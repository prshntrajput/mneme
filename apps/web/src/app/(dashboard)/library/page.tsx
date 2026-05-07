import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TabCard } from '@/components/tabs/tab-card';
import { SearchBar } from '@/components/search/search-bar';
import { LibraryFilters } from '@/components/library/library-filters';

interface Props {
  searchParams: Promise<{ category?: string; days?: string }>;
}

export default async function LibraryPage({ searchParams }: Props) {
  const { category, days } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Build the base query — cast preserves type through conditional reassignments
  let query = supabase
    .from('tabs')
    .select('id, url, title, favicon_url, summary, key_points, category, tags, created_at, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (category) {
    query = query.eq('category', category) as unknown as typeof query;
  }
  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    query = query.gte('created_at', since.toISOString()) as unknown as typeof query;
  }

  const { data: tabs } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Library</h1>
        <span className="text-sm text-gray-500">{tabs?.length ?? 0} tabs</span>
      </div>

      <SearchBar />

      <Suspense
        fallback={<div className="h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />}
      >
        <LibraryFilters />
      </Suspense>

      {tabs && tabs.length > 0 ? (
        <div className="grid gap-3">
          {tabs.map((tab) => (
            <TabCard key={tab.id} tab={tab} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium text-gray-500">
            {category || days ? 'No tabs match these filters' : 'No tabs saved yet'}
          </p>
          {!category && !days && (
            <p className="mt-1 text-sm text-gray-400">
              Install the Mneme Chrome extension to start capturing tabs.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
