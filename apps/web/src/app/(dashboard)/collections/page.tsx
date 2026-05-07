import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CollectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: collections } = await supabase
    .from('collections')
    .select('id, name, description, ai_generated, created_at, collection_tabs(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Smart Collections</h1>
      <p className="text-sm text-gray-500">AI auto-groups your related tabs. No folders needed.</p>

      {collections && collections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold">{col.name}</h2>
                {col.ai_generated && <span className="text-xs text-gray-400">AI</span>}
              </div>
              {col.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{col.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {(col.collection_tabs as unknown as { count: number }[])?.[0]?.count ?? 0} tabs
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-gray-400">
          <p className="font-medium">No collections yet</p>
          <p className="mt-1 text-sm">
            Collections are generated automatically every 6 hours once you have enough saved tabs.
          </p>
        </div>
      )}
    </div>
  );
}
