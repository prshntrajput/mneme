import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TabCard } from '@/components/tabs/tab-card';
import { RenameCollection } from './rename-collection';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description, ai_generated, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!collection) notFound();

  const { data: collectionTabs } = await supabase
    .from('collection_tabs')
    .select(
      'tab_id, similarity, tabs(id, url, title, favicon_url, summary, key_points, category, tags, created_at, status)',
    )
    .eq('collection_id', id)
    .order('similarity', { ascending: false });

  const tabs = (collectionTabs ?? [])
    .map((ct) => ct.tabs)
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/collections"
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Collections
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{collection.name}</h1>
          {collection.ai_generated && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              AI
            </span>
          )}
        </div>
        {collection.description && (
          <p className="mt-1 text-sm text-gray-500">{collection.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3">
          <RenameCollection collectionId={collection.id} currentName={collection.name} />
        </div>
        <p className="mt-1 text-sm text-gray-400">
          {tabs.length} tab{tabs.length !== 1 ? 's' : ''} ·{' '}
          {new Date(collection.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {tabs.length > 0 ? (
        <div className="grid gap-3">
          {tabs.map((tab) => (
            <TabCard key={tab.id} tab={tab} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400">
          <p>No tabs in this collection yet.</p>
        </div>
      )}
    </div>
  );
}
