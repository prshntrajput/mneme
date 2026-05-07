import { Inngest } from 'inngest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@mneme/database';
import { categorizeByDomain } from '@mneme/shared';
import { generateJson } from './gemini';
import { buildCategorizePrompt } from './prompts/categorize';

const inngest = new Inngest({ id: 'mneme' });

interface CategorizeResult {
  category: string;
  tags: string[];
}

export const categorizeTab = inngest.createFunction(
  { id: 'categorize-tab', concurrency: { limit: 1 } },
  { event: 'tab/ingested' },
  async ({ event, step }) => {
    const { tabId, userId } = event.data as { tabId: string; userId: string };

    const tab = await step.run('fetch-tab', async () => {
      const db = getAdminClient();
      const { data } = await db
        .from('tabs')
        .select('url, title, raw_content')
        .eq('id', tabId)
        .eq('user_id', userId)
        .single();
      return data;
    });

    if (!tab) return { tabId, skipped: true, reason: 'not found' };

    const category = await step.run('categorize', async () => {
      // Rule-based first (fast + free)
      const ruleCategory = categorizeByDomain(tab.url);
      if (ruleCategory) return { category: ruleCategory, tags: [] as string[] };

      // LLM fallback
      return generateJson<CategorizeResult>(
        buildCategorizePrompt(tab.title ?? tab.url, tab.raw_content ?? ''),
      );
    });

    await step.run('save-category', async () => {
      const db = getAdminClient();
      await db
        .from('tabs')
        .update({
          category: category.category,
          tags: category.tags,
          status: 'processing',
        })
        .eq('id', tabId);
      await db.from('processing_jobs').insert({
        user_id: userId,
        tab_id: tabId,
        job_type: 'categorize',
        status: 'done',
      });
    });

    return { tabId, category: category.category };
  },
);

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
