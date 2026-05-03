import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { getSupabasePublicEnv } from '@/lib/supabase/env-public';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Session refresh may write cookies; Next.js only allows that in middleware / Server Actions / Route Handlers.
          }
        },
      },
    }
  );
}
