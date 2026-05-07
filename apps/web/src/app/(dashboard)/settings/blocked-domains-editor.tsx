'use client';

import { useState, useTransition } from 'react';

interface Props {
  initialDomains: string[];
}

export function BlockedDomainsEditor({ initialDomains }: Props) {
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function addDomain() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed.length > 253) {
      setError('Domain too long (max 253 chars)');
      return;
    }
    if (domains.includes(trimmed)) {
      setError('Domain already in list');
      return;
    }
    if (domains.length >= 200) {
      setError('Maximum 200 blocked domains');
      return;
    }
    setDomains((prev) => [...prev, trimmed]);
    setInput('');
    setError('');
    setSaved(false);
  }

  function removeDomain(domain: string) {
    setDomains((prev) => prev.filter((d) => d !== domain));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked_domains: domains }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        setError('Failed to save. Try again.');
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError('');
            setSaved(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDomain();
            }
          }}
          placeholder="e.g. mail.google.com"
          className="flex-1 rounded-md border border-gray-200 bg-transparent px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700"
        />
        <button
          type="button"
          onClick={addDomain}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Add
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {domains.length > 0 && (
        <ul className="space-y-1">
          {domains.map((domain) => (
            <li
              key={domain}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm dark:bg-gray-800/50"
            >
              <span className="font-mono">{domain}</span>
              <button
                type="button"
                onClick={() => removeDomain(domain)}
                className="ml-2 text-gray-400 hover:text-red-500"
                aria-label={`Remove ${domain}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {domains.length === 0 && (
        <p className="text-xs text-gray-400">
          No blocked domains. Tabs from all sites will be saved.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-xs text-green-600">Saved</span>}
      </div>
    </div>
  );
}
