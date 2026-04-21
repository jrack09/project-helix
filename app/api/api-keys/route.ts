import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateApiKey } from '@/lib/api-keys/crypto';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, key_prefix, name, rate_limit_per_minute, created_at, revoked_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data ?? [] });
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fullKey, prefix, hash } = generateApiKey();

  const { data: row, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      key_prefix: prefix,
      key_hash: hash,
      name: 'default',
      rate_limit_per_minute: 60,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: row.id,
    api_key: fullKey,
    message: 'Store this key securely; it cannot be retrieved again.',
  });
}
