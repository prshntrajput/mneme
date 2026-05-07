import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const CollectionPatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!rateLimit(`collections:${user.id}`, 30, 60_000)) return rateLimitResponse();

  const body: unknown = await request.json();
  const parsed = CollectionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('collections')
    .update({ ...parsed.data, ai_generated: false })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!rateLimit(`collections:${user.id}`, 30, 60_000)) return rateLimitResponse();

  const { error } = await supabase.from('collections').delete().eq('id', id).eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
