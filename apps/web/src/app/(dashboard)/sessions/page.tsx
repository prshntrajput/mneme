import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RestoreSessionButton } from './restore-session-button';

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, ai_name, tab_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sessions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Past browsing sessions you've saved. Restore any in one click.
        </p>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {session.ai_name ?? session.name ?? 'Untitled session'}
                </p>
                <p className="text-sm text-gray-500">
                  {session.tab_count} tab{session.tab_count !== 1 ? 's' : ''} ·{' '}
                  {new Date(session.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <RestoreSessionButton sessionId={session.id} tabCount={session.tab_count} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium text-gray-500">No sessions saved yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Use &ldquo;Clean My Tabs&rdquo; in the extension popup to save your current window as a
            session.
          </p>
        </div>
      )}
    </div>
  );
}
