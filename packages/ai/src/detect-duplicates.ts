import { Inngest } from 'inngest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@mneme/database';

const inngest = new Inngest({ id: 'mneme' });

export const detectDuplicates = inngest.createFunction(
  { id: 'detect-duplicates', concurrency: { limit: 5 } },
  { event: 'tab/ingested' },
  async ({ event, step }) => {
    const { userId } = event.data as { tabId: string; userId: string };

    const duplicates = await step.run('find-duplicates', async () => {
      const db = getAdminClient();
      // Find URLs with more than one saved tab
      const { data } = await db
        .from('tabs')
        .select('url, url_hash')
        .eq('user_id', userId)
        .eq('status', 'ready');

      const urlCounts = new Map<string, number>();
      for (const tab of data ?? []) {
        urlCounts.set(tab.url_hash, (urlCounts.get(tab.url_hash) ?? 0) + 1);
      }

      return [...urlCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([hash]) => ({ url_hash: hash, count: urlCounts.get(hash)! }));
    });

    // TODO: surface duplicates to user via realtime or popup notification
    return { userId, duplicates: duplicates.length };
  },
);

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
