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

  const [
    expectations,
    foodGuidance,
    tips,
    sideEffects,
    injectionGuide,
    reconstitutionGuide,
    doseReference,
    sources,
    warnings,
    missedDoseRules,
    approvedIndications,
    doseEscalationPhases,
    formulationStorage,
    sideEffectThresholds,
    sideEffectWindows,
    injectionSites,
    oralAdministration,
    protocolTimeline,
    doseCycleProfile,
    symptomPlaybooks,
    foodToleranceRules,
    checkinProtocol,
    redFlagRules,
    clinicianReportTemplate,
  ] = await Promise.all([
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
    admin
      .from('drug_sources')
      .select('id, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_warnings')
      .select('id, severity, title, body, is_red_flag, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_missed_dose_rules')
      .select('id, formulation, max_delay_hours, instruction, restart_guidance, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_approved_indications')
      .select('id, region, authority, approval_status, indication, population, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_dose_escalation_phases')
      .select(
        'id, protocol_label, phase_label, start_week, end_week, dose_amount, dose_unit, frequency, route, phase_purpose, hold_or_reduce_guidance, source_id, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('protocol_label', { ascending: true })
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_formulation_storage')
      .select(
        'id, formulation, storage_state, temperature, protect_from_light, do_not_freeze, expiry_after_opening, expiry_after_reconstitution, handling_notes, source_id, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_side_effect_thresholds')
      .select('id, side_effect_id, effect, threshold, action, action_label, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_side_effect_windows')
      .select(
        'id, side_effect_id, effect, onset_hours_min, onset_hours_max, peak_hours_min, peak_hours_max, resolution_days_typical, notes, source_id, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_injection_sites')
      .select('id, site, preferred, rotation_guidance, avoid_notes, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_oral_administration')
      .select(
        'id, formulation, with_water_ml, swallow_whole, time_of_day, fasting_window_before_min, fasting_window_after_min, interaction_notes, source_id, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_protocol_timeline')
      .select(
        'id, protocol_label, week_start, week_end, phase_title, typical_dose_mg, cadence_days, expected_changes, common_adjustments, user_focus, source_id, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('protocol_label', { ascending: true })
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_dose_cycle_profile')
      .select(
        'onset_hours, peak_effect_hours_min, peak_effect_hours_max, appetite_effect_window_min, appetite_effect_window_max, nausea_risk_window_min, nausea_risk_window_max, constipation_risk_window_min, constipation_risk_window_max, coverage_fades_after_hours, notes, source_id',
      )
      .eq('drug_id', drug.id)
      .maybeSingle(),
    admin
      .from('drug_symptom_playbooks')
      .select(
        'id, symptom, side_effect_id, source_id, ordinal, drug_symptom_playbook_bands(id, min_score, max_score, title, nutrition_strategy, hydration_strategy, avoid, escalation, ordinal)',
      )
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_food_tolerance_rules')
      .select('id, context, prefer, "limit", avoid, rationale, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_checkin_protocol')
      .select(
        'id, cadence, notes, source_id, drug_checkin_questions(id, question_id, label, type, unit, condition, trigger_guidance_from_score, ordinal)',
      )
      .eq('drug_id', drug.id)
      .maybeSingle(),
    admin
      .from('drug_red_flag_rules')
      .select('id, symptom, action_level, display_copy, related_risks, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_clinician_report_template')
      .select('key_metrics, relevant_symptoms, medication_context_label, source_id')
      .eq('drug_id', drug.id)
      .maybeSingle(),
  ]);

  // Sort nested playbook bands + check-in questions by ordinal (nested
  // selects don't honour an outer .order()). The typed client doesn't
  // resolve embedded relations not declared in Relationships, so cast.
  type OrdinalRow = { ordinal: number };
  const byOrdinal = (a: OrdinalRow, b: OrdinalRow) => a.ordinal - b.ordinal;

  const symptomPlaybooksData = (symptomPlaybooks.data ?? []).map((pb) => ({
    ...pb,
    drug_symptom_playbook_bands: [
      ...((pb.drug_symptom_playbook_bands as unknown as OrdinalRow[]) ?? []),
    ].sort(byOrdinal),
  }));

  const checkinProtocolData = checkinProtocol.data
    ? {
        ...checkinProtocol.data,
        drug_checkin_questions: [
          ...((checkinProtocol.data.drug_checkin_questions as unknown as OrdinalRow[]) ?? []),
        ].sort(byOrdinal),
      }
    : null;

  // Consolidated "right now" dose-cycle profile: merge the numeric PK
  // columns on peptides with the dedicated window row. Null when neither
  // source has data (e.g. investigational peptides).
  const cp = doseCycleProfile.data;
  const doseCycleProfilePayload =
    cp || drug.half_life_hours != null || drug.tmax_hours != null || drug.duration_of_action_hours != null
      ? {
          onset_hours: cp?.onset_hours ?? drug.tmax_hours ?? null,
          half_life_hours: drug.half_life_hours ?? null,
          peak_effect_hours: [cp?.peak_effect_hours_min ?? null, cp?.peak_effect_hours_max ?? null],
          appetite_effect_window_hours: [
            cp?.appetite_effect_window_min ?? null,
            cp?.appetite_effect_window_max ?? null,
          ],
          nausea_risk_window_hours: [cp?.nausea_risk_window_min ?? null, cp?.nausea_risk_window_max ?? null],
          constipation_risk_window_hours: [
            cp?.constipation_risk_window_min ?? null,
            cp?.constipation_risk_window_max ?? null,
          ],
          coverage_fades_after_hours:
            cp?.coverage_fades_after_hours ?? drug.duration_of_action_hours ?? null,
          notes: cp?.notes ?? null,
          source_id: cp?.source_id ?? null,
        }
      : null;

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
        clinical_profile: {
          contraindications: drug.contraindications,
          interactions: drug.drug_interactions,
          storage_handling: drug.storage_handling,
          pharmacokinetics: drug.pharmacokinetics,
          half_life_hours: drug.half_life_hours,
          tmax_hours: drug.tmax_hours,
          duration_of_action_hours: drug.duration_of_action_hours,
          warnings: warnings.data ?? [],
          red_flag_symptoms: (warnings.data ?? []).filter((w) => w.is_red_flag),
          missed_dose_rules: missedDoseRules.data ?? [],
          approved_indications: approvedIndications.data ?? [],
          dose_escalation_phases: doseEscalationPhases.data ?? [],
          storage: formulationStorage.data ?? [],
          side_effect_thresholds: sideEffectThresholds.data ?? [],
          side_effect_windows: sideEffectWindows.data ?? [],
          approved_injection_sites: injectionSites.data ?? [],
          oral_administration: oralAdministration.data ?? [],
          dose_cycle_profile: doseCycleProfilePayload,
          symptom_playbooks: symptomPlaybooksData,
          food_tolerance_rules: foodToleranceRules.data ?? [],
          red_flag_rules: redFlagRules.data ?? [],
          clinician_report_template: clinicianReportTemplate.data ?? null,
          sources: sources.data ?? [],
        },
        expectations: expectations.data ?? [],
        food_guidance: foodGuidance.data ?? [],
        tips: tips.data ?? [],
        side_effects: sideEffects.data ?? [],
        injection_guide: injectionGuide.data ?? [],
        reconstitution_guide: reconstitutionGuide.data ?? [],
        dose_reference: doseReference.data ?? [],
        protocol_timeline: protocolTimeline.data ?? [],
        checkin_protocol: checkinProtocolData,
      },
      drugDisclaimer(slug),
      drug.updated_at,
    ),
    { headers: cors },
  );
}
