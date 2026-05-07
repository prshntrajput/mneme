import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@mneme/database';

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  // @supabase/ssr@0.6.x has a return-type bug: it passes the schema object as
  // SupabaseClient's SchemaName (string) arg, causing Schema=never internally.
  // Casting to SupabaseClient<Database> restores correct type inference.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from Server Component — cookies set in middleware
          }
        },
      },
    },
  ) as unknown as SupabaseClient<Database>;
}
