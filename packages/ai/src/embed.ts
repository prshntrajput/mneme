import { Inngest } from 'inngest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@mneme/database';
import { generateEmbeddingForTab } from './embeddings';

const inngest = new Inngest({ id: 'mneme' });

export const embedTab = inngest.createFunction(
  { id: 'embed-tab', concurrency: { limit: 1 } },
  { event: 'tab/ingested' },
  async ({ event, step }) => {
    const { tabId, userId } = event.data as { tabId: string; userId: string };

    const tab = await step.run('fetch-tab', async () => {
      const db = getAdminClient();
      const { data } = await db
        .from('tabs')
        .select('title, summary, raw_content')
        .eq('id', tabId)
        .eq('user_id', userId)
        .single();
      return data;
    });

    if (!tab) return { tabId, skipped: true, reason: 'not found' };

    const embedding = await step.run('generate-embedding', async () =>
      generateEmbeddingForTab(tab.title, tab.summary, tab.raw_content),
    );

    await step.run('save-embedding', async () => {
      const db = getAdminClient();
      await db
        .from('tabs')
        .update({
          embedding: embedding as unknown as number[],
          status: 'ready',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tabId);
      await db.from('processing_jobs').insert({
        user_id: userId,
        tab_id: tabId,
        job_type: 'embed',
        status: 'done',
      });
    });

    return { tabId, embedded: true };
  },
);

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
