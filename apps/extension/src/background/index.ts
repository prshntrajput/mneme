import { isAuthenticated, getUserInfo, loginWithGoogle, logout } from '@/lib/auth';
import { ingestTab, searchTabs, saveSession } from '@/lib/api-client';
import { enqueueTab, getPendingTabs, removeQueuedTab, incrementAttempts } from '@/lib/db';
import { extractTabData, isBlockedDomain } from '@/content/extractor';
import type { Message, MessageResponse } from '@/lib/messaging';

// ── Keepalive (MV3 service workers die after 30s inactivity) ─────────────────
chrome.alarms.create('keepalive', { periodInMinutes: 0.4 });

// ── Alarms ────────────────────────────────────────────────────────────────────
chrome.alarms.create('auto-save-open-tabs', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepalive') return;
  if (alarm.name === 'drain-queue') void drainSyncQueue();
  if (alarm.name === 'auto-save-open-tabs') void autoSaveOpenTabs();
});

void drainSyncQueue();

// ── Tab metadata cache ────────────────────────────────────────────────────────
// Lightweight in-memory store so we can save URL/title/favicon on tab close
// even though the content script is already gone. Updated on every tab event.
// Service worker is usually alive during active browsing (keepalive alarm).
interface CachedTab {
  url: string;
  title?: string | undefined;
  favIconUrl?: string | undefined;
}
const tabCache = new Map<number, CachedTab>();

function shouldSkip(url: string, incognito: boolean): boolean {
  if (incognito) return true;
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return true;
  if (url.startsWith('about:') || url.startsWith('edge://')) return true;
  if (isBlockedDomain(url)) return true;
  return false;
}

// ── Auto-save on page load ────────────────────────────────────────────────────
// Every time a tab finishes loading, capture it automatically.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.url || shouldSkip(tab.url, tab.incognito ?? false)) return;

  // Always keep the cache fresh regardless of load state
  tabCache.set(tabId, { url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl });

  if (changeInfo.status !== 'complete') return;
  if (!(await isAuthenticated())) return;

  // Fire-and-forget: don't block the browser while we extract + send
  void (async () => {
    try {
      const data = await extractTabData(tab);
      await saveTab(data);
    } catch {
      // Silently fail — don't interrupt browsing
    }
  })();
});

// ── Auto-save on tab close ────────────────────────────────────────────────────
// The tab content was already saved when the page loaded, but this catches:
// (a) tabs that loaded before the extension was active
// (b) updates visited_at so the library shows when you last had it open
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const cached = tabCache.get(tabId);
  tabCache.delete(tabId);

  // When the whole window closes, tabs are removed in rapid succession.
  // Still save them — the API upserts by URL so duplicates are handled.
  if (!cached) return;
  if (shouldSkip(cached.url, false)) return;
  if (!(await isAuthenticated())) return;

  // Save with metadata only — content was captured on load
  const payload: Parameters<typeof ingestTab>[0] = {
    url: cached.url,
    source: 'auto',
    visited_at: new Date().toISOString(),
  };
  if (cached.title) payload.title = cached.title;
  if (cached.favIconUrl) payload.favicon_url = cached.favIconUrl;

  // Don't double-save if this is from a Clean My Tabs window close
  if (!removeInfo.isWindowClosing) {
    await saveTab(payload);
  }
});

// Track new tab opens so the cache stays warm
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id && tab.url && !shouldSkip(tab.url, tab.incognito ?? false)) {
    tabCache.set(tab.id, { url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl });
  }
});

// ── Message router ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (r: MessageResponse) => void) => {
    void handleMessage(message).then(sendResponse);
    return true;
  },
);

async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case 'GET_AUTH_STATUS': {
      const authenticated = await isAuthenticated();
      const info = authenticated ? await getUserInfo() : null;
      return {
        type: 'AUTH_STATUS',
        payload: { authenticated, ...(info?.email ? { email: info.email } : {}) },
      };
    }

    case 'LOGIN': {
      try {
        await loginWithGoogle();
        return { type: 'OK' };
      } catch (err) {
        return { type: 'ERROR', payload: { message: String(err) } };
      }
    }

    case 'LOGOUT': {
      await logout();
      return { type: 'OK' };
    }

    case 'SAVE_CURRENT_TAB': {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id || !activeTab.url) {
        return { type: 'ERROR', payload: { message: 'No active tab' } };
      }
      try {
        const data = await extractTabData(activeTab);
        await saveTab(data);
        return { type: 'OK' };
      } catch (err) {
        return { type: 'ERROR', payload: { message: String(err) } };
      }
    }

    case 'CLEAN_MY_TABS': {
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const toClose = allTabs.filter(
        (t) => t.id !== activeTab?.id && !t.incognito && t.url && !t.url.startsWith('chrome://'),
      );
      return { type: 'CLEAN_MY_TABS_PREVIEW', payload: { tabCount: toClose.length } };
    }

    case 'CLEAN_MY_TABS_CONFIRMED': {
      try {
        await cleanMyTabs();
        return { type: 'OK' };
      } catch (err) {
        return { type: 'ERROR', payload: { message: String(err) } };
      }
    }

    case 'SEARCH': {
      const results = await searchTabs(message.payload.q);
      return { type: 'SEARCH_RESULTS', payload: { results } };
    }

    case 'RESTORE_SESSION': {
      try {
        const { tabs } = message.payload;
        const BATCH = 5;
        for (let i = 0; i < tabs.length; i += BATCH) {
          const batch = tabs.slice(i, i + BATCH);
          await Promise.all(batch.map((t) => chrome.tabs.create({ url: t.url, active: false })));
        }
        return { type: 'OK' };
      } catch (err) {
        return { type: 'ERROR', payload: { message: String(err) } };
      }
    }
  }
}

async function saveTab(data: Parameters<typeof ingestTab>[0]): Promise<void> {
  try {
    await ingestTab(data);
  } catch {
    await enqueueTab(data);
    chrome.alarms.create('drain-queue', { delayInMinutes: 1 });
  }
}

async function cleanMyTabs(): Promise<void> {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const allTabs = await chrome.tabs.query({ currentWindow: true });
  const tabsToClose = allTabs.filter(
    (t) =>
      t.id !== currentTab?.id &&
      !t.incognito &&
      t.url &&
      !t.url.startsWith('chrome://') &&
      !t.url.startsWith('chrome-extension://'),
  );

  const tabPayloads = await Promise.all(
    tabsToClose.map(async (tab) => {
      if (!tab.url) return null;
      try {
        return await extractTabData(tab);
      } catch {
        const fallback: Parameters<typeof ingestTab>[0] = { url: tab.url, source: 'session' };
        if (tab.title) fallback.title = tab.title;
        if (tab.favIconUrl) fallback.favicon_url = tab.favIconUrl;
        return fallback;
      }
    }),
  );

  const validPayloads = tabPayloads.filter((p): p is NonNullable<typeof p> => p !== null);

  if (validPayloads.length > 0) {
    try {
      await saveSession(validPayloads);
    } catch {
      for (const payload of validPayloads) {
        await enqueueTab(payload);
      }
    }
  }

  const idsToClose = tabsToClose.map((t) => t.id).filter((id): id is number => id !== undefined);
  if (idsToClose.length > 0) {
    await chrome.tabs.remove(idsToClose);
  }
}

// ── 30-minute inactivity scan ─────────────────────────────────────────────────
// Saves all currently open tabs so nothing is lost if the browser is closed
// before any individual tab triggers onUpdated.
async function autoSaveOpenTabs(): Promise<void> {
  if (!(await isAuthenticated())) return;

  const windows = await chrome.windows.getAll({ populate: true });
  for (const win of windows) {
    if (win.incognito) continue;
    for (const tab of win.tabs ?? []) {
      if (!tab.url || !tab.id || shouldSkip(tab.url, tab.incognito ?? false)) continue;

      // Update cache while we're scanning
      tabCache.set(tab.id, { url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl });

      // Save metadata only — full content extraction already happened on load
      const payload: Parameters<typeof ingestTab>[0] = { url: tab.url, source: 'auto' };
      if (tab.title) payload.title = tab.title;
      if (tab.favIconUrl) payload.favicon_url = tab.favIconUrl;

      await saveTab(payload).catch(() => {});
    }
  }
}

async function drainSyncQueue(): Promise<void> {
  if (!(await isAuthenticated())) return;

  const pending = await getPendingTabs();
  for (const tab of pending) {
    if (tab.id === undefined) continue;
    const delay = Math.min(1000 * 2 ** tab.attempts, 30_000);
    if (tab.attempts > 0 && Date.now() - tab.queuedAt < delay) continue;

    try {
      await ingestTab(tab);
      await removeQueuedTab(tab.id);
    } catch {
      await incrementAttempts(tab.id);
    }
  }
}
