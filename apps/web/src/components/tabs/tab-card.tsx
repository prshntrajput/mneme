'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Database } from '@mneme/database';
import { TabDetailDrawer } from './tab-detail-drawer';

type Tab = Pick<
  Database['public']['Tables']['tabs']['Row'],
  | 'id'
  | 'url'
  | 'title'
  | 'favicon_url'
  | 'summary'
  | 'key_points'
  | 'category'
  | 'tags'
  | 'created_at'
  | 'status'
>;

export function TabCard({ tab }: { readonly tab: Tab }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const domain = (() => {
    try {
      return new URL(tab.url).hostname.replace('www.', '');
    } catch {
      return tab.url;
    }
  })();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      const res = await fetch(`/api/tabs/${tab.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleted(true);
        router.refresh();
      }
    });
  }

  if (deleted) return null;

  return (
    <>
      <article className="group flex gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900">
        <div className="mt-0.5 shrink-0">
          {tab.favicon_url ? (
            <Image
              src={tab.favicon_url}
              alt=""
              width={16}
              height={16}
              className="rounded-sm"
              unoptimized
            />
          ) : (
            <div className="h-4 w-4 rounded-sm bg-gray-200 dark:bg-gray-700" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <a
              href={tab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm font-medium hover:underline"
            >
              {tab.title ?? domain}
            </a>
            <div className="flex shrink-0 items-center gap-1">
              {tab.category && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {tab.category}
                </span>
              )}
              <button
                onClick={handleDelete}
                disabled={isPending}
                title="Delete tab"
                className="hidden h-6 w-6 items-center justify-center rounded text-gray-300 group-hover:flex hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950"
                aria-label="Delete tab"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66H14.5a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11zm1.958 1l-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916z" />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-0.5 text-xs text-gray-400">{domain}</p>

          {tab.summary && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
              {tab.summary}
            </p>
          )}

          {tab.status === 'pending' && (
            <p className="mt-1 text-xs text-gray-400 italic">Processing…</p>
          )}

          {(tab.summary || (tab.key_points && tab.key_points.length > 0)) && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="mt-2 text-xs font-medium text-blue-500 hover:text-blue-700"
            >
              View details →
            </button>
          )}
        </div>
      </article>

      {drawerOpen && (
        <TabDetailDrawer
          tab={tab}
          onClose={() => setDrawerOpen(false)}
          onDelete={() => {
            setDeleted(true);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
