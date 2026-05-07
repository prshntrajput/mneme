import type { Database } from './types';
import { createServerClient } from '@supabase/ssr';

// Test with createServerClient
const client = createServerClient<Database>('url', 'key', {
  cookies: {
    getAll() {
      return [];
    },
    setAll(cookiesToSet) {
      // cookiesToSet should be typed, not any
      console.log(cookiesToSet[0]?.name);
    },
  },
});

async function test() {
  const { data } = await client.from('tabs').select('id, url').limit(5);
  if (data) {
    const _ = data[0]?.id; // should be string | undefined, not error
  }

  await client.rpc('search_tabs_keyword', {
    p_user_id: 'test',
    p_query: 'test',
    p_limit: 10,
  });
}
