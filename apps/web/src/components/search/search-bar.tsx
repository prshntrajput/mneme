'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search your tabs ("that React auth article")'
        className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900"
        aria-label="Search tabs"
      />
      <button
        type="submit"
        className="bg-foreground text-background rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}
