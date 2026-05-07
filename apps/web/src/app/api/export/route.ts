import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: tabs, error } = await supabase
    .from('tabs')
    .select(
      'id, url, title, favicon_url, summary, key_points, category, tags, source, visited_at, created_at, status',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to export tabs' }, { status: 500 });
  }

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    tab_count: tabs?.length ?? 0,
    tabs: tabs ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="mneme-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
