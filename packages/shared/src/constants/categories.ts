import type { TabCategory } from '../types/tab';

export const ALL_CATEGORIES: TabCategory[] = [
  'Coding',
  'Shopping',
  'Research',
  'AI',
  'Finance',
  'Travel',
  'Productivity',
  'Entertainment',
  'Videos',
  'Learning',
  'Social',
  'News',
  'Other',
];

/** Domain prefix → category. Checked before LLM fallback. */
export const DOMAIN_CATEGORY_MAP: Record<string, TabCategory> = {
  // Coding
  'github.com': 'Coding',
  'gitlab.com': 'Coding',
  'stackoverflow.com': 'Coding',
  'npmjs.com': 'Coding',
  'crates.io': 'Coding',
  'pkg.go.dev': 'Coding',
  'docs.rs': 'Coding',
  'developer.mozilla.org': 'Coding',
  'codepen.io': 'Coding',
  'replit.com': 'Coding',
  // AI
  'openai.com': 'AI',
  'anthropic.com': 'AI',
  'huggingface.co': 'AI',
  'arxiv.org': 'Research',
  'chat.openai.com': 'AI',
  'claude.ai': 'AI',
  'gemini.google.com': 'AI',
  // Shopping
  'amazon.com': 'Shopping',
  'amazon.co.uk': 'Shopping',
  'amazon.in': 'Shopping',
  'ebay.com': 'Shopping',
  'etsy.com': 'Shopping',
  'shopify.com': 'Shopping',
  'flipkart.com': 'Shopping',
  // Videos
  'youtube.com': 'Videos',
  'youtu.be': 'Videos',
  'vimeo.com': 'Videos',
  'twitch.tv': 'Videos',
  // Social
  'twitter.com': 'Social',
  'x.com': 'Social',
  'reddit.com': 'Social',
  'linkedin.com': 'Social',
  'facebook.com': 'Social',
  'instagram.com': 'Social',
  // News
  'news.ycombinator.com': 'News',
  'techcrunch.com': 'News',
  'theverge.com': 'News',
  'wired.com': 'News',
  'bbc.com': 'News',
  'nytimes.com': 'News',
  // Finance
  'coinmarketcap.com': 'Finance',
  'coingecko.com': 'Finance',
  'finance.yahoo.com': 'Finance',
  'investing.com': 'Finance',
  // Travel
  'booking.com': 'Travel',
  'airbnb.com': 'Travel',
  'skyscanner.com': 'Travel',
  'google.com/travel': 'Travel',
  // Productivity
  'notion.so': 'Productivity',
  'docs.google.com': 'Productivity',
  'figma.com': 'Productivity',
  'linear.app': 'Productivity',
  'slack.com': 'Productivity',
};

export function categorizeByDomain(url: string): TabCategory | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return DOMAIN_CATEGORY_MAP[hostname] ?? null;
  } catch {
    return null;
  }
}
