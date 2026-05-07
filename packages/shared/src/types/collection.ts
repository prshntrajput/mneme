export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithTabs extends Collection {
  tab_count: number;
}
