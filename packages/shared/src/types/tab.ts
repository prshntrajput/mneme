export type TabStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type TabSource = 'auto' | 'manual' | 'session' | 'cleanup';

export type TabCategory =
  | 'Coding'
  | 'Shopping'
  | 'Research'
  | 'AI'
  | 'Finance'
  | 'Travel'
  | 'Productivity'
  | 'Entertainment'
  | 'Videos'
  | 'Learning'
  | 'Social'
  | 'News'
  | 'Other';

export interface Tab {
  id: string;
  user_id: string;
  url: string;
  url_hash?: string;
  title?: string | null;
  favicon_url?: string | null;
  raw_content?: string | null;
  summary?: string | null;
  key_points?: string[] | null;
  tags: string[];
  category?: TabCategory | null;
  status: TabStatus;
  source: TabSource;
  visited_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TabIngestPayload {
  url: string;
  title?: string;
  favicon_url?: string;
  raw_content?: string;
  visited_at?: string;
  source?: TabSource;
}
