'use client';

import { useState } from 'react';

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-red-600">Are you absolutely sure?</p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700"
        >
          Cancel
        </button>
        <form action="/api/account/delete" method="POST">
          <button
            type="submit"
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Yes, delete everything
          </button>
        </form>
      </div>
    </div>
  );
}
