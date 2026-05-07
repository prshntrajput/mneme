'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  collectionId: string;
  currentName: string;
}

export function RenameCollection({ collectionId, currentName }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    if (!name.trim() || name.trim() === currentName) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        Rename
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="rounded-md border border-gray-300 bg-transparent px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700"
      />
      <button
        onClick={save}
        disabled={isPending}
        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Save
      </button>
      <button
        onClick={() => {
          setName(currentName);
          setEditing(false);
        }}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  );
}
