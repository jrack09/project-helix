import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const;

export async function hasActiveSubscription(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return false;
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(data.status);
}
