import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { canAccessPremiumInsights } from '@/lib/access/premium-insights';

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let premium = false;
    try {
      premium = await canAccessPremiumInsights(supabase, request, user?.id);
    } catch (e) {
      if (e instanceof Error && e.message === 'rate_limited') {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
      throw e;
    }

    const { data: peptide, error } = await supabase
      .from('peptides')
      .select(
        'id, slug, name, aliases, short_description, mechanism_summary, receptor_targets, evidence_score, status_label, created_at'
      )
      .eq('slug', slug)
      .eq('is_visible', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!peptide) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const [{ data: dosageOverall }, { data: dosageByContext }, { data: links }] = await Promise.all([
      supabase.from('peptide_observed_dosage_ranges').select('*').eq('peptide_id', peptide.id).maybeSingle(),
      supabase.from('peptide_observed_dosage_ranges_by_context').select('*').eq('peptide_id', peptide.id),
      supabase.from('study_peptides').select('study_id').eq('peptide_id', peptide.id),
    ]);

    const studyIds = (links ?? []).map((l) => l.study_id);
    const { data: studies } =
      studyIds.length > 0
        ? await supabase.from('studies').select('*').in('id', studyIds)
        : { data: [] };

    const [{ data: outcomes }, { data: risks }] = await Promise.all([
      supabase.from('study_outcomes').select('*').eq('peptide_id', peptide.id),
      supabase.from('side_effects').select('*').eq('peptide_id', peptide.id),
    ]);

    let ai_summary = null;
    if (premium) {
      const { data: ai } = await supabase.from('ai_summaries').select('*').eq('peptide_id', peptide.id).maybeSingle();
      ai_summary = ai;
    }

    return NextResponse.json({
      peptide,
      dosage: {
        overall: dosageOverall,
        by_context: dosageByContext ?? [],
      },
      studies: studies ?? [],
      outcomes: outcomes ?? [],
      side_effects: risks ?? [],
      ai_summary,
      ai_summaries_included: premium,
    });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
