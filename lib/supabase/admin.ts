import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getSupabasePublicEnv } from '@/lib/supabase/env-public';

export function createAdminSupabaseClient() {
  const { url } = getSupabasePublicEnv();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRole) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Add it to `.env.local` (see `.env.example`).'
    );
  }

  return createClient<Database>(
    url,
    serviceRole,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
