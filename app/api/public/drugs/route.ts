import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { envelope } from '@/lib/api/envelope';
import { globalDisclaimer } from '@/lib/compliance/disclaimers';
import { resolveKey, handleOptions, corsHeaders } from '@/lib/api/public-auth';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  const auth = await resolveKey(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const from = (page - 1) * limit;

  const admin = createAdminSupabaseClient();
  const { data, error, count } = await admin
    .from('peptides')
    .select(
      'id, slug, name, generic_name, brand_names, drug_class, short_description, image_url, administration_route, prescription_required, evidence_score, updated_at',
      { count: 'exact' },
    )
    .eq('is_visible', true)
    .eq('publication_status', 'published')
    .order('name', { ascending: true })
    .range(from, from + limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch drugs.' }, { status: 500, headers: cors });
  }

  return NextResponse.json(
    envelope(
      { drugs: data ?? [], total: count ?? 0, page, limit },
      globalDisclaimer(),
    ),
    { headers: cors },
  );
}
