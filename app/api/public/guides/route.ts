import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { handleOptions, corsHeaders, resolveKey } from '@/lib/api/public-auth';
import { envelope } from '@/lib/api/envelope';
import { globalDisclaimer } from '@/lib/compliance/disclaimers';

export function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  const auth = await resolveKey(request);
  if ('error' in auth) return auth.error;

  const supabase = createAdminSupabaseClient();
  const { data: guides } = await supabase
    .from('guides')
    .select('id, slug, title, subtitle, category, cover_emoji, ordinal, updated_at')
    .eq('publication_status', 'published')
    .order('ordinal', { ascending: true });

  return NextResponse.json(
    envelope(guides ?? [], globalDisclaimer()),
    { headers: corsHeaders(origin) }
  );
}
