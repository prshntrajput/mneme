'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

const CATEGORIES = [
  'Coding',
  'Shopping',
  'Research',
  'AI',
  'Finance',
  'Travel',
  'Productivity',
  'Entertainment',
  'Videos',
  'Learning',
  'Social',
  'News',
  'Other',
];

const DATE_PRESETS = [
  { label: 'All time', value: '' },
  { label: 'Today', value: '1' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

export function LibraryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeCategory = searchParams.get('category') ?? '';
  const activeDays = searchParams.get('days') ?? '';

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className={`flex flex-wrap gap-3 ${isPending ? 'pointer-events-none opacity-60' : ''}`}>
      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => update('category', '')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !activeCategory
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => update('category', activeCategory === cat ? '' : cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Date preset select */}
      <select
        value={activeDays}
        onChange={(e) => update('days', e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      >
        {DATE_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
