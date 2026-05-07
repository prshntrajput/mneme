import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: tab, error } = await supabase
    .from('tabs')
    .select(
      'id, url, title, favicon_url, summary, key_points, category, tags, status, source, visited_at, created_at, updated_at',
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !tab) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(tab);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!rateLimit(`tabs-delete:${user.id}`, 60, 60_000)) return rateLimitResponse();

  const { error } = await supabase.from('tabs').delete().eq('id', id).eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Failed to delete tab' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
