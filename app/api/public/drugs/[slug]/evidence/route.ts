import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { envelope } from '@/lib/api/envelope';
import { drugDisclaimer } from '@/lib/compliance/disclaimers';
import { resolveKey, handleOptions, corsHeaders } from '@/lib/api/public-auth';
import { assembleEvidence } from '@/lib/evidence/assemble-evidence';

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

  const { data: drug, error } = await admin
    .from('peptides')
    .select('id, slug, evidence_score, status_label, updated_at')
    .eq('slug', slug)
    .eq('is_visible', true)
    .eq('publication_status', 'published')
    .maybeSingle();

  if (error || !drug) {
    return NextResponse.json({ error: 'Drug not found.' }, { status: 404, headers: cors });
  }

  const evidence = await assembleEvidence(admin, drug);

  return NextResponse.json(
    envelope({ evidence }, drugDisclaimer(slug), drug.updated_at),
    { headers: cors },
  );
}
