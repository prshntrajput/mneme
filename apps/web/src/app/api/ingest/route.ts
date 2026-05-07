import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { inngest } from '@/lib/inngest';
import { getCorsHeaders, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request);
}

const IngestBodySchema = z.object({
  url: z.string().url(),
  title: z.string().max(500).optional(),
  favicon_url: z.string().url().optional(),
  raw_content: z.string().max(100_000).optional(),
  visited_at: z.string().datetime().optional(),
  source: z.enum(['auto', 'manual', 'session', 'cleanup']).default('auto'),
});

export async function POST(request: NextRequest) {
  const cors = getCorsHeaders(request);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
  }

  if (!rateLimit(`ingest:${user.id}`, 60, 60_000)) {
    return rateLimitResponse();
  }

  const body: unknown = await request.json();
  const parsed = IngestBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.issues },
      { status: 400, headers: cors },
    );
  }

  const { url, title, favicon_url, raw_content, visited_at, source } = parsed.data;

  // Check if this tab already exists and is fully processed.
  // If so, only update lightweight metadata — don't reset status or re-queue AI jobs.
  const { data: existing } = await supabase
    .from('tabs')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('url', url)
    .maybeSingle();

  const alreadyProcessed = existing?.status === 'ready';

  const { data: tab, error } = await supabase
    .from('tabs')
    .upsert(
      {
        user_id: user.id,
        url,
        title: title ?? null,
        favicon_url: favicon_url ?? null,
        // Don't overwrite existing content if new save has none (e.g. close-time metadata save)
        ...(raw_content ? { raw_content } : {}),
        visited_at: visited_at ?? new Date().toISOString(),
        source,
        // Never reset a 'ready' tab back to 'pending' — that triggers redundant AI jobs
        ...(!alreadyProcessed ? { status: 'pending' as const } : {}),
      },
      { onConflict: 'user_id,url_hash', ignoreDuplicates: false },
    )
    .select('id, status')
    .single();

  if (error || !tab) {
    console.error('Ingest error:', error?.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500, headers: cors });
  }

  // Only fire the AI pipeline for new tabs or previously failed ones
  if (!alreadyProcessed) {
    await inngest.send({ name: 'tab/ingested', data: { tabId: tab.id, userId: user.id } });
  }

  return NextResponse.json({ tabId: tab.id, status: tab.status }, { status: 201, headers: cors });
}
