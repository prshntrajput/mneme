// Type-safe wrapper around chrome.storage.local

export interface StorageSchema {
  auth_token: string;
  refresh_token: string;
  user_id: string;
  user_email: string;
  blocklist: string[];
  auto_save_on_close: boolean;
  auto_save_inactivity_ms: number;
}

export async function getStorage<K extends keyof StorageSchema>(
  key: K,
): Promise<StorageSchema[K] | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve((result[key] as StorageSchema[K]) ?? null);
    });
  });
}

export async function setStorage<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K],
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

export async function removeStorage<K extends keyof StorageSchema>(key: K): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve);
  });
}

export async function clearAuth(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['auth_token', 'refresh_token', 'user_id', 'user_email'], resolve);
  });
}
