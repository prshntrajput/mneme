import { Inngest } from 'inngest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@mneme/database';
import { generateJson } from './gemini';
import { buildSessionNamePrompt } from './prompts/session';

const inngest = new Inngest({ id: 'mneme' });

interface SessionNameResult {
  name: string;
}

export const nameSession = inngest.createFunction(
  { id: 'name-session', concurrency: { limit: 5 } },
  { event: 'session/created' },
  async ({ event, step }) => {
    const { sessionId, userId } = event.data as { sessionId: string; userId: string };

    const titles = await step.run('fetch-tab-titles', async () => {
      const db = getAdminClient();
      const { data } = await db
        .from('session_tabs')
        .select('tabs(title, url)')
        .eq('session_id', sessionId)
        .limit(20);

      return (data ?? [])
        .map((row) => {
          const tab = row.tabs;
          if (!tab) return null;
          return (
            (tab as { title?: string | null; url: string }).title ?? (tab as { url: string }).url
          );
        })
        .filter((t): t is string => Boolean(t));
    });

    if (titles.length === 0) return { sessionId, skipped: true };

    const { name } = await step.run('generate-name', () =>
      generateJson<SessionNameResult>(buildSessionNamePrompt(titles)),
    );

    await step.run('save-name', async () => {
      const db = getAdminClient();
      await db.from('sessions').update({ ai_name: name }).eq('id', sessionId).eq('user_id', userId);
    });

    return { sessionId, name };
  },
);

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
