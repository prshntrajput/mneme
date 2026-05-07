'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { logout } from '@/app/(auth)/login/actions';

const NAV_ITEMS = [
  { href: '/library', label: 'Library' },
  { href: '/collections', label: 'Collections' },
  { href: '/search', label: 'Search' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/settings', label: 'Settings' },
] as const;

export function DashboardNav({ user }: { readonly user: User }) {
  const pathname = usePathname();

  return (
    <nav className="flex w-56 flex-col gap-2 border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-4">
        <span className="text-lg font-bold">Mneme</span>
      </div>

      <div className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
        <p className="truncate text-xs text-gray-400">{user.email}</p>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
