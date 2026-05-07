import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { inngest } from '@/lib/inngest';
import { getCorsHeaders, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request);
}

const SessionCreateSchema = z.object({
  tabs: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().max(500).optional(),
        favicon_url: z.string().url().optional(),
        raw_content: z.string().max(100_000).optional(),
        visited_at: z.string().datetime().optional(),
      }),
    )
    .min(1)
    .max(500),
  name: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const cors = getCorsHeaders(request);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
  if (!rateLimit(`sessions:${user.id}`, 10, 60_000)) return rateLimitResponse();

  const body: unknown = await request.json();
  const parsed = SessionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.issues },
      { status: 400, headers: cors },
    );
  }

  const { tabs, name } = parsed.data;
  const admin = createAdminClient();

  // Upsert all tabs first, converting undefined → null for optional fields
  const tabRows = await Promise.all(
    tabs.map(async (tab) => {
      const { data } = await admin
        .from('tabs')
        .upsert(
          {
            user_id: user.id,
            url: tab.url,
            title: tab.title ?? null,
            favicon_url: tab.favicon_url ?? null,
            raw_content: tab.raw_content ?? null,
            visited_at: tab.visited_at ?? new Date().toISOString(),
            source: 'session',
            status: 'pending',
          },
          { onConflict: 'user_id,url_hash', ignoreDuplicates: false },
        )
        .select('id')
        .single();
      return data;
    }),
  );

  const validTabIds = tabRows.filter((t): t is { id: string } => t !== null).map((t) => t.id);

  // Create session record
  const { data: session, error } = await admin
    .from('sessions')
    .insert({
      user_id: user.id,
      name: name ?? null,
      tab_count: validTabIds.length,
    })
    .select('id')
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500, headers: cors });
  }

  // Link tabs to session
  if (validTabIds.length > 0) {
    await admin.from('session_tabs').insert(
      validTabIds.map((tabId, position) => ({
        session_id: session.id,
        tab_id: tabId,
        position,
      })),
    );
  }

  // Fire AI pipeline for each tab + session naming
  await Promise.all([
    ...validTabIds.map((tabId) =>
      inngest.send({ name: 'tab/ingested', data: { tabId, userId: user.id } }),
    ),
    inngest.send({ name: 'session/created', data: { sessionId: session.id, userId: user.id } }),
  ]);

  return NextResponse.json(
    { sessionId: session.id, tabCount: validTabIds.length },
    { status: 201, headers: cors },
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, ai_name, tab_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return NextResponse.json({ sessions: sessions ?? [] });
}
