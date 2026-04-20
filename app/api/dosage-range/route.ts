import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('peptide_slug');
  const id = url.searchParams.get('peptide_id');

  if (!slug && !id) {
    return NextResponse.json({ error: 'Provide peptide_slug or peptide_id' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  let peptideId = id;
  if (!peptideId && slug) {
    const { data: peptide } = await supabase
      .from('peptides')
      .select('id')
      .eq('slug', slug)
      .eq('is_visible', true)
      .maybeSingle();
    peptideId = peptide?.id ?? null;
  }

  if (!peptideId) {
    return NextResponse.json({ error: 'Peptide not found' }, { status: 404 });
  }

  const [{ data: overall }, { data: byContext }] = await Promise.all([
    supabase.from('peptide_observed_dosage_ranges').select('*').eq('peptide_id', peptideId).maybeSingle(),
    supabase.from('peptide_observed_dosage_ranges_by_context').select('*').eq('peptide_id', peptideId),
  ]);

  return NextResponse.json({
    peptide_id: peptideId,
    overall: overall ?? null,
    by_context: byContext ?? [],
  });
}
