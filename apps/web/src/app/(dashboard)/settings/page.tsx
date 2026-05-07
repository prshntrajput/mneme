import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DeleteAccountButton } from './delete-account-button';
import { BlockedDomainsEditor } from './blocked-domains-editor';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, tab_quota, blocked_domains, created_at')
    .eq('id', user.id)
    .single();

  const blockedDomains: string[] = Array.isArray(profile?.blocked_domains)
    ? (profile.blocked_domains as string[])
    : [];

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Account</h2>
        <div className="space-y-2 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Plan</span>
            <span className="capitalize">{profile?.plan ?? 'free'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tab quota</span>
            <span>{profile?.tab_quota ?? 1000}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Privacy</h2>
        <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium">Blocked domains</p>
            <p className="mt-1 mb-3 text-xs text-gray-500">
              Tabs from these domains will never be saved. Useful for banking, email, and other
              sensitive sites.
            </p>
            <BlockedDomainsEditor initialDomains={blockedDomains} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Data</h2>
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium">Export your data</p>
            <p className="mt-1 text-xs text-gray-500">
              Download all your saved tabs as a JSON file.
            </p>
          </div>
          <a
            href="/api/export"
            download
            className="inline-block rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Export tabs
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-red-600">Danger zone</h2>
        <div className="space-y-3 rounded-lg border border-red-200 p-4 dark:border-red-900">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="mt-1 text-xs text-gray-500">
              Permanently deletes your account and all saved tabs, collections, and sessions. This
              cannot be undone.
            </p>
          </div>
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
