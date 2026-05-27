import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';

export async function writeAuditLog(
  supabase: SupabaseClient<Database>,
  params: {
    action: string;
    entity_type: string;
    entity_id?: string | null;
    meta?: Json;
  }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    meta: (params.meta ?? {}) as Json,
  });
}
