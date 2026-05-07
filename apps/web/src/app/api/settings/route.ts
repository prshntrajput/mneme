import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { Database } from '@mneme/database';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, tab_quota, blocked_domains')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    plan: profile?.plan ?? 'free',
    tab_quota: profile?.tab_quota ?? 1000,
    blocked_domains: profile?.blocked_domains ?? [],
  });
}

const SettingsPatchSchema = z.object({
  blocked_domains: z.array(z.string().max(253)).max(200).optional(),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!rateLimit(`settings:${user.id}`, 20, 60_000)) return rateLimitResponse();

  const body: unknown = await request.json();
  const parsed = SettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updates: ProfileUpdate = {};
  if (parsed.data.blocked_domains !== undefined) {
    updates.blocked_domains = parsed.data.blocked_domains;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
