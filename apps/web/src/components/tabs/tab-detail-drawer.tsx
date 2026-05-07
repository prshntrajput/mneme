'use client';

import { useEffect, useTransition } from 'react';

interface Props {
  tab: {
    id: string;
    url: string;
    title: string | null;
    favicon_url: string | null;
    summary: string | null;
    key_points: string[] | null;
    category: string | null;
    tags: string[] | null;
    created_at: string;
  };
  onClose: () => void;
  onDelete?: () => void;
}

export function TabDetailDrawer({ tab, onClose, onDelete }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/tabs/${tab.id}`, { method: 'DELETE' });
      if (res.ok) {
        onClose();
        onDelete?.();
      }
    });
  }
  const domain = (() => {
    try {
      return new URL(tab.url).hostname.replace('www.', '');
    } catch {
      return tab.url;
    }
  })();

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className="animate-in slide-in-from-right fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl duration-200 dark:bg-gray-950">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="leading-snug font-semibold">{tab.title ?? domain}</h2>
            <a
              href={tab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-xs text-blue-500 hover:underline"
            >
              {domain}
            </a>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            {tab.category && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {tab.category}
              </span>
            )}
            {(tab.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Summary */}
          {tab.summary && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Summary
              </h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {tab.summary}
              </p>
            </section>
          )}

          {/* Key points */}
          {tab.key_points && tab.key_points.length > 0 && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Key Points
              </h3>
              <ul className="space-y-2">
                {tab.key_points.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!tab.summary && (!tab.key_points || tab.key_points.length === 0) && (
            <p className="text-sm text-gray-400 italic">AI analysis still processing…</p>
          )}

          {/* Date */}
          <p className="text-xs text-gray-400">
            Saved{' '}
            {new Date(tab.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Footer */}
        <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-800">
          <a
            href={tab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-gray-900 py-2.5 text-center text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Open page →
          </a>
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="block w-full rounded-lg border border-red-200 py-2 text-center text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              {isPending ? 'Deleting…' : 'Delete tab'}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
