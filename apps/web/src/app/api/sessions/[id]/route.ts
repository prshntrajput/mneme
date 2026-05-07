import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // Fetch session + all its tabs
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, ai_name, tab_count, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: sessionTabs } = await supabase
    .from('session_tabs')
    .select('position, tabs(id, url, title, favicon_url, summary, category)')
    .eq('session_id', id)
    .order('position');

  const tabs = (sessionTabs ?? []).map((st) => st.tabs).filter(Boolean);

  return NextResponse.json({ session, tabs });
}
