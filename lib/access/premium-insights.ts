import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { hasActiveSubscription } from '@/lib/billing/subscription';
import { resolveApiKeyFromHeader, userHasPremiumViaApiKey } from '@/lib/api-keys/resolve';

export async function canAccessPremiumInsights(
  supabase: SupabaseClient<Database>,
  request: Request,
  userId: string | undefined
): Promise<boolean> {
  if (userId && (await hasActiveSubscription(supabase, userId))) {
    return true;
  }

  try {
    const resolved = await resolveApiKeyFromHeader(request.headers.get('authorization'));
    if (resolved && (await userHasPremiumViaApiKey(resolved.userId))) {
      return true;
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'rate_limited') {
      throw e;
    }
  }

  return false;
}
