import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { envelope } from '@/lib/api/envelope';
import { globalDisclaimer } from '@/lib/compliance/disclaimers';
import { resolveKey, handleOptions, corsHeaders } from '@/lib/api/public-auth';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  const auth = await resolveKey(request);
  if (auth.error) return auth.error;

  const admin = createAdminSupabaseClient();

  const { data: drug } = await admin
    .from('peptides')
    .select('id')
    .eq('slug', slug)
    .eq('publication_status', 'published')
    .eq('is_visible', true)
    .maybeSingle();

  if (!drug) {
    return NextResponse.json({ error: 'Drug not found.' }, { status: 404, headers: cors });
  }

  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get('week');

  let query = admin
    .from('drug_expectations')
    .select('id, week_number, milestone, description, is_common')
    .eq('drug_id', drug.id)
    .order('week_number', { ascending: true });

  if (weekParam !== null) {
    const week = parseInt(weekParam, 10);
    if (!isNaN(week)) {
      query = query.eq('week_number', week);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch expectations.' }, { status: 500, headers: cors });
  }

  return NextResponse.json(
    envelope({ expectations: data ?? [] }, globalDisclaimer()),
    { headers: cors },
  );
}
