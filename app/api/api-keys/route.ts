import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateApiKey } from '@/lib/api-keys/crypto';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fullKey, prefix, hash } = generateApiKey();

  const { error } = await supabase.from('api_keys').insert({
    user_id: user.id,
    key_prefix: prefix,
    key_hash: hash,
    name: 'default',
    rate_limit_per_minute: 60,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    api_key: fullKey,
    message: 'Store this key securely; it cannot be retrieved again.',
  });
}
