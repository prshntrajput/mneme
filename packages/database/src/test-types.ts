import type { Database } from './types';
import { createClient } from '@supabase/supabase-js';

// Test the actual Database type usage
const client = createClient<Database>('url', 'key');

async function test() {
  const { data } = await client.from('tabs').select('id, url').limit(5);
  // data should be typed, not never
  if (data) {
    const _ = data[0]?.id; // should be string | undefined, not error
  }

  await client.rpc('search_tabs_keyword', {
    p_user_id: 'test',
    p_query: 'test',
    p_limit: 10,
  });
}
