import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('profiles').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ status: 'ok', db: 'ok', ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
