import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { hasActiveSubscription } from '@/lib/billing/subscription';
import { sha256Hex } from '@/lib/api-keys/crypto';
import { rateLimitExceeded } from '@/lib/rate-limit/memory';

export type ResolvedApiKey = {
  apiKeyId: string;
  userId: string;
  rateLimitPerMinute: number;
};

export async function resolveApiKeyFromHeader(headerValue: string | null): Promise<ResolvedApiKey | null> {
  if (!headerValue?.startsWith('Bearer ')) return null;
  const token = headerValue.slice('Bearer '.length).trim();
  if (!token.startsWith('pip_')) return null;

  const admin = createAdminSupabaseClient();
  const hash = sha256Hex(token);
  const { data: row } = await admin
    .from('api_keys')
    .select('id, user_id, rate_limit_per_minute, revoked_at')
    .eq('key_hash', hash)
    .maybeSingle();

  if (!row || row.revoked_at) return null;

  if (rateLimitExceeded(`api:${row.id}`, row.rate_limit_per_minute)) {
    throw new Error('rate_limited');
  }

  return {
    apiKeyId: row.id,
    userId: row.user_id,
    rateLimitPerMinute: row.rate_limit_per_minute,
  };
}

export async function userHasPremiumViaApiKey(userId: string): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  return hasActiveSubscription(admin, userId);
}
