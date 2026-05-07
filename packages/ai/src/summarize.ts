import { Inngest } from 'inngest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@mneme/database';
import { generateJson } from './gemini';
import { buildSummarizePrompt } from './prompts/summarize';

const inngest = new Inngest({ id: 'mneme' });

interface SummarizeResult {
  summary: string;
  key_points: string[];
}

export const summarizeTab = inngest.createFunction(
  { id: 'summarize-tab', concurrency: { limit: 1 } },
  { event: 'tab/ingested' },
  async ({ event, step }) => {
    const { tabId, userId } = event.data as { tabId: string; userId: string };

    const tab = await step.run('fetch-tab', async () => {
      const db = getAdminClient();
      const { data } = await db
        .from('tabs')
        .select('title, raw_content')
        .eq('id', tabId)
        .eq('user_id', userId)
        .single();
      return data;
    });

    if (!tab) return { tabId, skipped: true, reason: 'not found' };

    // Skip very short content — nothing to summarize
    if (!tab.raw_content || tab.raw_content.length < 200) {
      return { tabId, skipped: true };
    }

    const result = await step.run('summarize', async () =>
      generateJson<SummarizeResult>(
        buildSummarizePrompt(tab.title ?? 'Untitled', tab.raw_content!),
      ),
    );

    await step.run('save-summary', async () => {
      const db = getAdminClient();
      await db
        .from('tabs')
        .update({
          summary: result.summary,
          key_points: result.key_points,
        })
        .eq('id', tabId);
      await db.from('processing_jobs').insert({
        user_id: userId,
        tab_id: tabId,
        job_type: 'summarize',
        status: 'done',
      });
    });

    return { tabId, summarized: true };
  },
);

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
