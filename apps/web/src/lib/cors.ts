import type { NextRequest } from 'next/server';

const DASHBOARD_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === DASHBOARD_ORIGIN) return true;
  // Allow any Chrome extension origin — ID is not fixed in dev
  if (origin.startsWith('chrome-extension://')) return true;
  return false;
}

export function getCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get('origin');
  const allowed = isAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? (origin ?? '') : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function corsOptionsResponse(request: NextRequest): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}
