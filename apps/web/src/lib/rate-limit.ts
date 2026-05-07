import { NextResponse } from 'next/server';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

// In-memory store for dev; swap for Upstash Redis in production via env flag.
const store = new Map<string, RateLimitStore>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
