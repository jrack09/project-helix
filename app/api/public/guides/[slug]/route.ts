import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { handleOptions, corsHeaders, resolveKey } from '@/lib/api/public-auth';
import { envelope } from '@/lib/api/envelope';
import { globalDisclaimer } from '@/lib/compliance/disclaimers';

export function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = request.headers.get('origin') ?? '';
  const auth = await resolveKey(request);
  if ('error' in auth) return auth.error;

  const { slug } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: guide } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', slug)
    .eq('publication_status', 'published')
    .maybeSingle();

  if (!guide) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders(origin) });
  }

  return NextResponse.json(
    envelope(guide, globalDisclaimer()),
    { headers: corsHeaders(origin) }
  );
}
