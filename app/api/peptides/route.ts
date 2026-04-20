import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { canAccessPremiumInsights } from '@/lib/access/premium-insights';

export async function GET(request: Request) {
  try {
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

    const { data: peptides, error } = await supabase
      .from('peptides')
      .select(
        'id, slug, name, aliases, short_description, mechanism_summary, receptor_targets, evidence_score, status_label, created_at'
      )
      .eq('is_visible', true)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!premium) {
      return NextResponse.json({
        peptides: peptides ?? [],
        ai_summaries_included: false,
      });
    }

    const ids = (peptides ?? []).map((p) => p.id);
    const { data: summaries } =
      ids.length > 0
        ? await supabase
            .from('ai_summaries')
            .select(
              'peptide_id, summary_text, evidence_strength, limitations_text, model_name, last_generated_at, guardrail_passed'
            )
            .in('peptide_id', ids)
        : { data: [] };

    const summaryByPeptide = new Map((summaries ?? []).map((s) => [s.peptide_id, s]));

    return NextResponse.json({
      peptides: (peptides ?? []).map((p) => ({
        ...p,
        ai_summary: summaryByPeptide.get(p.id) ?? null,
      })),
      ai_summaries_included: true,
    });
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
