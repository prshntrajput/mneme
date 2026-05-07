import { Readability } from '@mozilla/readability';
import type { TabIngestPayload } from '@mneme/shared';

const BLOCKED_DOMAINS = [
  'mail.google.com',
  'accounts.google.com',
  'login.microsoftonline.com',
  'signin.aws.amazon.com',
  'console.aws.amazon.com',
];

const MAX_CONTENT_BYTES = 100_000;

export function isBlockedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return BLOCKED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function extractPageContent(): string {
  // Clone so Readability doesn't mutate the live DOM
  const docClone = document.cloneNode(true) as Document;

  // Strip all form inputs to avoid capturing passwords / PII
  docClone.querySelectorAll('input, textarea, select, form').forEach((el) => el.remove());

  const reader = new Readability(docClone, { charThreshold: 200 });
  const article = reader.parse();

  if (!article?.textContent) return '';

  return article.textContent.slice(0, MAX_CONTENT_BYTES);
}

export async function extractTabData(tab: chrome.tabs.Tab): Promise<TabIngestPayload> {
  const url = tab.url ?? '';

  // Ask content script for the page content if tab is loaded
  let raw_content: string | undefined;
  if (tab.id && tab.status === 'complete' && !isBlockedDomain(url)) {
    try {
      const response = (await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTENT' })) as {
        content?: string;
      };
      raw_content = response?.content;
    } catch {
      // Content script not ready — send without content
    }
  }

  const payload: TabIngestPayload = { url, visited_at: new Date().toISOString(), source: 'auto' };
  if (tab.title) payload.title = tab.title;
  if (tab.favIconUrl) payload.favicon_url = tab.favIconUrl;
  if (raw_content) payload.raw_content = raw_content;
  return payload;
}
