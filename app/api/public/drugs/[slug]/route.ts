import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { envelope } from '@/lib/api/envelope';
import { drugDisclaimer } from '@/lib/compliance/disclaimers';
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

  const { data: drug, error: drugError } = await admin
    .from('peptides')
    .select('*')
    .eq('slug', slug)
    .eq('is_visible', true)
    .eq('publication_status', 'published')
    .maybeSingle();

  if (drugError || !drug) {
    return NextResponse.json({ error: 'Drug not found.' }, { status: 404, headers: cors });
  }

  const [expectations, foodGuidance, tips, sideEffects, injectionGuide, reconstitutionGuide, doseReference] = await Promise.all([
    admin
      .from('drug_expectations')
      .select('id, week_number, milestone, description, is_common')
      .eq('drug_id', drug.id)
      .order('week_number', { ascending: true }),
    admin
      .from('drug_food_guidance')
      .select('id, category, item, rationale, evidence_level, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_tips')
      .select('id, category, title, body_markdown, ordinal')
      .eq('drug_id', drug.id)
      .order('category', { ascending: true })
      .order('ordinal', { ascending: true }),
    admin
      .from('side_effects')
      .select('id, effect, severity, frequency, drug_side_effect_tips(id, strategy, when_to_seek_help, ordinal)')
      .eq('peptide_id', drug.id),
    admin
      .from('drug_injection_guide')
      .select('id, step_type, formulation, ordinal, title, body')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_reconstitution_guide')
      .select(
        'id, vial_size_mg, bac_water_ml, concentration_mg_per_ml, technique_notes, measurement_note, storage_lyophilized, storage_reconstituted, use_within, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_dose_reference')
      .select('id, protocol_label, phase_label, dose_mg, units_u100, volume_ml, ordinal')
      .eq('drug_id', drug.id)
      .order('protocol_label', { ascending: true })
      .order('ordinal', { ascending: true }),
  ]);

  return NextResponse.json(
    envelope(
      {
        drug: {
          id: drug.id,
          slug: drug.slug,
          name: drug.name,
          generic_name: drug.generic_name,
          brand_names: drug.brand_names,
          drug_class: drug.drug_class,
          administration_route: drug.administration_route,
          typical_dosing_schedule: drug.typical_dosing_schedule,
          prescription_required: drug.prescription_required,
          short_description: drug.short_description,
          image_url: drug.image_url,
          mechanism_summary: drug.mechanism_summary,
          evidence_score: drug.evidence_score,
          updated_at: drug.updated_at,
        },
        expectations: expectations.data ?? [],
        food_guidance: foodGuidance.data ?? [],
        tips: tips.data ?? [],
        side_effects: sideEffects.data ?? [],
        injection_guide: injectionGuide.data ?? [],
        reconstitution_guide: reconstitutionGuide.data ?? [],
        dose_reference: doseReference.data ?? [],
      },
      drugDisclaimer(slug),
      drug.updated_at,
    ),
    { headers: cors },
  );
}
