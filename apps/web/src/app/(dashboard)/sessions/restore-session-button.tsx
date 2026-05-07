'use client';

import { useState } from 'react';

interface Props {
  sessionId: string;
  tabCount: number;
}

export function RestoreSessionButton({ sessionId, tabCount }: Props) {
  const [status, setStatus] = useState<'idle' | 'restoring' | 'done' | 'error'>('idle');

  async function handleRestore() {
    setStatus('restoring');
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      const data = (await res.json()) as { tabs: Array<{ url: string }> };
      // Post message to extension to open tabs
      window.postMessage({ type: 'MNEME_RESTORE_SESSION', tabs: data.tabs }, '*');
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  const label =
    status === 'restoring'
      ? 'Opening…'
      : status === 'done'
        ? `Opened ${tabCount} tabs!`
        : status === 'error'
          ? 'Error — try again'
          : 'Restore';

  return (
    <button
      onClick={() => void handleRestore()}
      disabled={status === 'restoring'}
      className="shrink-0 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {label}
    </button>
  );
}
