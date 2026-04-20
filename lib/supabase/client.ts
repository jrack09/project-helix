import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { getSupabasePublicEnv } from '@/lib/supabase/env-public';

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
