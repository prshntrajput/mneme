import { z } from 'zod';

export const TabIngestSchema = z.object({
  url: z.string().url(),
  title: z.string().max(500).optional(),
  favicon_url: z.string().url().optional(),
  raw_content: z.string().max(100_000).optional(),
  visited_at: z.string().datetime().optional(),
  source: z.enum(['auto', 'manual', 'session', 'cleanup']).default('auto'),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
});

export type TabIngestInput = z.infer<typeof TabIngestSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
