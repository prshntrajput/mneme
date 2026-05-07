import { extractPageContent, isBlockedDomain } from './extractor';
import { sendMessage } from '@/lib/messaging';

// Content scripts run in page context — listen for extraction requests from background
chrome.runtime.onMessage.addListener((message: { type: string }, _sender, sendResponse) => {
  if (message.type !== 'EXTRACT_CONTENT') return false;

  if (isBlockedDomain(window.location.href)) {
    sendResponse({ content: null });
    return false;
  }

  // Skip if noindex meta tag present
  const noIndex = document.querySelector('meta[name="robots"][content*="noindex"]');
  if (noIndex) {
    sendResponse({ content: null });
    return false;
  }

  const content = extractPageContent();
  sendResponse({ content });
  return false;
});

// Intercept session restore requests posted by the web dashboard
window.addEventListener(
  'message',
  (event: MessageEvent<{ type?: string; tabs?: Array<{ url: string }> }>) => {
    if (event.source !== window) return;
    if (event.data?.type !== 'MNEME_RESTORE_SESSION') return;
    const tabs = event.data.tabs ?? [];
    if (tabs.length === 0) return;

    void sendMessage({ type: 'RESTORE_SESSION', payload: { tabs } });
  },
);
