import { getStorage, setStorage, clearAuth } from './storage';
import type { TabIngestPayload } from '@mneme/shared';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getStorage('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      await clearAuth();
      return null;
    }
    const data = (await res.json()) as { access_token?: string; refresh_token?: string };
    if (!data.access_token) return null;
    await setStorage('auth_token', data.access_token);
    if (data.refresh_token) await setStorage('refresh_token', data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let token = await getStorage('auth_token');
  if (!token) throw new Error('Not authenticated');

  const makeRequest = (t: string) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
        ...init.headers,
      },
    });

  let res = await makeRequest(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await makeRequest(newToken);
    }
  }

  return res;
}

export async function ingestTab(payload: TabIngestPayload): Promise<{ tabId: string }> {
  const res = await authFetch('/api/ingest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'Unknown error' }))) as { error: string };
    throw new Error(err.error);
  }

  return res.json() as Promise<{ tabId: string }>;
}

export async function searchTabs(q: string): Promise<unknown[]> {
  const res = await authFetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({ q, limit: 10 }),
  });

  if (!res.ok) return [];
  const data = (await res.json()) as { results?: unknown[] };
  return data.results ?? [];
}

export async function saveSession(tabs: TabIngestPayload[]): Promise<{ sessionId: string }> {
  const res = await authFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ tabs }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'Unknown error' }))) as { error: string };
    throw new Error(err.error);
  }

  return res.json() as Promise<{ sessionId: string }>;
}
