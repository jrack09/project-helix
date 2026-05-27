import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRegionNotice } from '@/lib/compliance/region-copy';
import { QuickFactsPanel, ProtocolBlock } from '@/components/ui/content-blocks';
import { TocScrollSpy } from '@/components/ui/toc-scrollspy';
import { MobileSectionRail } from '@/components/ui/mobile-section-rail';
import {
  genericIngredientLabel,
  primaryDrugDisplayName,
  secondaryBrandNames,
} from '@/lib/drugs/display-name';

type Props = { params: Promise<{ slug: string }> };

const ADMIN_ROUTE_LABEL: Record<string, string> = {
  subcutaneous_injection: 'Subcutaneous injection',
  intramuscular_injection: 'Intramuscular injection',
  oral: 'Oral',
  intranasal: 'Intranasal',
  topical: 'Topical',
  intravenous: 'Intravenous',
};

// Maps database protocol_label → display heading + intro sentence shown above the table
const PROTOCOL_SECTION: Record<string, { heading: string; intro: string }> = {
  'Standard escalation (Phase 2 reference)': {
    heading: 'Standard / Gradual Approach',
    intro:
      'Conservative titration schedule matching the primary Phase 2 protocol. The recommended starting point for most patients.',
  },
  'Advanced escalation (Phase 2 high-dose arm)': {
    heading: 'Advanced Aggressive Protocol',
    intro:
      'Higher-dose arm from Phase 2, used for participants who tolerated the standard schedule well. Reach the 12 mg target dose sooner.',
  },
  'Concentration reference (10 mg/mL)': {
    heading: 'Dosing Protocol',
    intro:
      'Quick reference for converting your prescribed dose to syringe units and injection volume at 10 mg/mL concentration.',
  },
};

export default async function DrugDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: drug } = await supabase
    .from('peptides')
    .select(
      'id, slug, name, generic_name, brand_names, drug_class, administration_route, typical_dosing_schedule, short_description, mechanism_summary, evidence_score, status_label, prescription_required, image_url, contraindications, drug_interactions, storage_handling, pharmacokinetics',
    )
    .eq('slug', slug)
    .eq('is_visible', true)
    .eq('publication_status', 'published')
    .maybeSingle();

  if (!drug) notFound();

  const [
    expectationsRes,
    foodRes,
    tipsRes,
    sideEffectsRes,
    studyLinksRes,
    dosagesRes,
    outcomesRes,
    injectionGuideRes,
    reconstitutionGuideRes,
    doseReferenceRes,
    sourcesRes,
    warningsRes,
    missedDoseRulesRes,
    approvedIndicationsRes,
    doseEscalationPhasesRes,
    formulationStorageRes,
    sideEffectThresholdsRes,
  ] = await Promise.all([
    supabase
      .from('drug_expectations')
      .select('id, week_number, milestone, description, is_common')
      .eq('drug_id', drug.id)
      .order('week_number')
      .limit(8),
    supabase
      .from('drug_food_guidance')
      .select('id, category, item, rationale')
      .eq('drug_id', drug.id)
      .order('ordinal')
      .limit(12),
    supabase
      .from('drug_tips')
      .select('id, category, title, body_markdown')
      .eq('drug_id', drug.id)
      .order('ordinal')
      .limit(20),
    supabase
      .from('side_effects')
      .select('id, effect, severity, frequency')
      .eq('peptide_id', drug.id)
      .limit(12),
    supabase.from('study_peptides').select('study_id').eq('peptide_id', drug.id),
    supabase
      .from('study_dosages')
      .select('id, study_id, dosage_value, dosage_unit, frequency, duration, context_note')
      .eq('peptide_id', drug.id),
    supabase
      .from('study_outcomes')
      .select('id, study_id, outcome_type, description, significance')
      .eq('peptide_id', drug.id),
    supabase
      .from('drug_injection_guide')
      .select('id, step_type, formulation, ordinal, title, body')
      .eq('drug_id', drug.id)
      .order('ordinal'),
    supabase
      .from('drug_reconstitution_guide')
      .select(
        'id, vial_size_mg, bac_water_ml, concentration_mg_per_ml, technique_notes, measurement_note, storage_lyophilized, storage_reconstituted, use_within, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('ordinal'),
    supabase
      .from('drug_dose_reference')
      .select('id, protocol_label, phase_label, dose_mg, units_u100, volume_ml, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal'),
    supabase
      .from('drug_sources')
      .select('id, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal'),
    supabase
      .from('drug_warnings')
      .select('id, severity, title, body, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal'),
    supabase
      .from('drug_missed_dose_rules')
      .select('id, formulation, max_delay_hours, instruction, restart_guidance, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal'),
    supabase
      .from('drug_approved_indications')
      .select('id, region, authority, approval_status, indication, population, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal'),
    supabase
      .from('drug_dose_escalation_phases')
      .select(
        'id, protocol_label, phase_label, start_week, end_week, dose_amount, dose_unit, frequency, route, phase_purpose, hold_or_reduce_guidance, source_id, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('protocol_label')
      .order('ordinal'),
    supabase
      .from('drug_formulation_storage')
      .select(
        'id, formulation, storage_state, temperature, protect_from_light, do_not_freeze, expiry_after_opening, expiry_after_reconstitution, handling_notes, source_id, ordinal',
      )
      .eq('drug_id', drug.id)
      .order('ordinal'),
    supabase
      .from('drug_side_effect_thresholds')
      .select('id, side_effect_id, effect, threshold, action, action_label, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal'),
  ]);

  const studyIds = (studyLinksRes.data ?? []).map((r) => r.study_id);
  const studiesRes =
    studyIds.length > 0
      ? await supabase
          .from('studies')
          .select(
            'id, title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract',
          )
          .in('id', studyIds)
          .eq('publication_status', 'published')
          .order('publication_date', { ascending: false })
      : {
          data: [] as Array<{
            id: string;
            title: string;
            journal: string | null;
            publication_date: string | null;
            study_type: string;
            sample_size: number | null;
            population: string | null;
            source_url: string;
            doi: string | null;
            abstract: string | null;
          }>,
        };

  const sideEffectIds = (sideEffectsRes.data ?? []).map((sideEffect) => sideEffect.id);
  const sideEffectTipsRes =
    sideEffectIds.length > 0
      ? await supabase
          .from('drug_side_effect_tips')
          .select('id, side_effect_id, strategy, when_to_seek_help, ordinal')
          .in('side_effect_id', sideEffectIds)
          .order('ordinal')
      : {
          data: [] as Array<{
            id: string;
            side_effect_id: string;
            strategy: string;
            when_to_seek_help: string | null;
            ordinal: number;
          }>,
        };

  let regionNote: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('region_code').eq('id', user.id).single();
    regionNote = getRegionNotice(profile?.region_code);
  }

  const displayName = primaryDrugDisplayName(drug);
  const innLabel = genericIngredientLabel(drug);
  const extraBrandLabels = secondaryBrandNames(drug.brand_names);
  const expectations = expectationsRes.data ?? [];
  const food = foodRes.data ?? [];
  const tips = tipsRes.data ?? [];
  const sideEffects = sideEffectsRes.data ?? [];
  const sideEffectTips = sideEffectTipsRes.data ?? [];
  const studies = studiesRes.data ?? [];
  const dosages = dosagesRes.data ?? [];
  const outcomes = outcomesRes.data ?? [];
  const sources = sourcesRes.data ?? [];
  const warnings = warningsRes.data ?? [];
  const missedDoseRules = missedDoseRulesRes.data ?? [];
  const approvedIndications = approvedIndicationsRes.data ?? [];
  const doseEscalationPhases = doseEscalationPhasesRes.data ?? [];
  const formulationStorage = formulationStorageRes.data ?? [];
  const sideEffectThresholds = sideEffectThresholdsRes.data ?? [];

  const injectionGuide = injectionGuideRes.data ?? [];
  const injectionByType = (['supply', 'step', 'warning', 'disposal'] as const).reduce(
    (acc, t) => ({ ...acc, [t]: injectionGuide.filter((g) => g.step_type === t) }),
    {} as Record<string, typeof injectionGuide>,
  );

  const reconstitutionGuide = reconstitutionGuideRes.data ?? [];
  const doseReference = doseReferenceRes.data ?? [];
  const doseByProtocol = doseReference.reduce<Record<string, typeof doseReference>>((acc, r) => {
    (acc[r.protocol_label] ||= []).push(r);
    return acc;
  }, {});
  const doseProtocolLabels = [...new Set(doseReference.map((r) => r.protocol_label))];
  const dosePhasesByProtocol = doseEscalationPhases.reduce<Record<string, typeof doseEscalationPhases>>(
    (acc, phase) => {
      (acc[phase.protocol_label] ||= []).push(phase);
      return acc;
    },
    {},
  );
  const dosePhaseLabels = [...new Set(doseEscalationPhases.map((phase) => phase.protocol_label))];

  // True when the drug is a compounded/lyophilized formulation
  const hasReconstitution = reconstitutionGuide.length > 0 || doseReference.length > 0;
  // True when the drug uses a pen device and has no reconstitution content
  const hasPenGuide = injectionGuide.length > 0 && !hasReconstitution;

  const lifecycleTips = tips.filter((t) => t.category === 'other');
  const practicalTips = tips.filter((t) => t.category !== 'other');

  const dosagesByStudy = dosages.reduce<Record<string, typeof dosages>>((acc, d) => {
    (acc[d.study_id] ||= []).push(d);
    return acc;
  }, {});
  const outcomesByStudy = outcomes.reduce<Record<string, typeof outcomes>>((acc, o) => {
    (acc[o.study_id] ||= []).push(o);
    return acc;
  }, {});
  const sideEffectTipsById = sideEffectTips.reduce<Record<string, typeof sideEffectTips>>((acc, tip) => {
    (acc[tip.side_effect_id] ||= []).push(tip);
    return acc;
  }, {});

  const STUDY_TYPE_LABEL: Record<string, string> = {
    human: 'Human trial',
    animal: 'Animal study',
    in_vitro: 'In vitro',
    review: 'Review',
    meta_analysis: 'Meta-analysis',
  };

  type DrugInteraction = { drug?: string; interaction?: string; severity?: string };
  const interactionList: DrugInteraction[] = Array.isArray(drug.drug_interactions)
    ? (drug.drug_interactions as DrugInteraction[])
    : [];

  const pk =
    drug.pharmacokinetics &&
    typeof drug.pharmacokinetics === 'object' &&
    !Array.isArray(drug.pharmacokinetics)
      ? (drug.pharmacokinetics as Record<string, string>)
      : {};
  const PK_LABEL: Record<string, string> = {
    half_life: 'Elimination half-life',
    tmax: 'Time to peak (Tmax)',
    bioavailability_note: 'Bioavailability',
    clearance: 'Clearance',
  };
  const pkEntries = Object.entries(pk).filter(([, v]) => typeof v === 'string' && v.length > 0);

  const FOOD_LABEL: Record<string, string> = {
    prefer: '✅ Prefer',
    limit: '⚠️ Limit',
    avoid: '❌ Avoid',
    hydrate: '💧 Hydrate',
  };
  const foodByCategory = (['prefer', 'limit', 'avoid', 'hydrate'] as const).reduce(
    (acc, cat) => ({ ...acc, [cat]: food.filter((f) => f.category === cat) }),
    {} as Record<string, typeof food>,
  );

  const WARNING_LABEL: Record<string, string> = {
    info: 'Info',
    caution: 'Caution',
    urgent: 'Urgent',
    boxed_warning: 'Boxed warning',
  };
  const APPROVAL_LABEL: Record<string, string> = {
    approved: 'Approved',
    off_label: 'Off label',
    investigational: 'Investigational',
    not_approved: 'Not approved',
  };
  const THRESHOLD_ACTION_LABEL: Record<string, string> = {
    self_monitor: 'Monitor',
    contact_prescriber: 'Contact prescriber',
    urgent_care: 'Urgent care',
    emergency: 'Emergency',
  };

  // Quickstart highlights derived from drug fields — no extra query needed
  const quickstartHighlights: Array<{ icon: string; text: string }> = (
    [
      drug.administration_route
        ? { icon: '💉', text: ADMIN_ROUTE_LABEL[drug.administration_route] ?? drug.administration_route }
        : null,
      drug.drug_class ? { icon: '🔬', text: drug.drug_class } : null,
      reconstitutionGuide.length > 0
        ? { icon: '🧪', text: 'Lyophilised powder — requires reconstitution with bacteriostatic water' }
        : injectionGuide.length > 0
          ? { icon: '🖊️', text: 'Pre-filled autoinjector pen' }
          : null,
      drug.prescription_required ? { icon: '📋', text: 'Prescription required' } : null,
    ] as Array<{ icon: string; text: string } | null>
  ).filter(Boolean) as Array<{ icon: string; text: string }>;

  const tocItems = [
    { id: 'overview', label: 'Overview' },
    ...(drug.mechanism_summary || pkEntries.length > 0 ? [{ id: 'mechanism', label: 'How it works' }] : []),
    ...(doseEscalationPhases.length > 0 && !hasReconstitution && !hasPenGuide
      ? [{ id: 'dosing', label: 'Dosing' }]
      : []),
    ...(hasReconstitution
      ? [{ id: 'reconstitution', label: 'Dosing & reconstitution' }]
      : hasPenGuide
        ? [{ id: 'injection', label: 'Injection guide' }]
        : []),
    ...(expectations.length > 0 || sideEffects.length > 0 || lifecycleTips.length > 0
      ? [{ id: 'clinical', label: 'Benefits & side effects' }]
      : []),
    ...(food.length > 0 || practicalTips.length > 0 ? [{ id: 'guidance', label: 'Nutrition & tips' }] : []),
    ...(drug.contraindications ||
    interactionList.length > 0 ||
    warnings.length > 0 ||
    approvedIndications.length > 0 ||
    missedDoseRules.length > 0 ||
    formulationStorage.length > 0 ||
    sideEffectThresholds.length > 0 ||
    drug.storage_handling
      ? [{ id: 'safety', label: 'Safety & interactions' }]
      : []),
    ...(studies.length > 0 || sources.length > 0 ? [{ id: 'evidence', label: 'Research evidence' }] : []),
  ];

  const quickFacts = [
    { label: 'Drug class', value: drug.drug_class ?? 'See companion content' },
    {
      label: 'Route',
      value: drug.administration_route
        ? (ADMIN_ROUTE_LABEL[drug.administration_route] ?? drug.administration_route)
        : 'See prescribing information',
    },
    {
      label: 'Schedule',
      value: drug.typical_dosing_schedule
        ? drug.typical_dosing_schedule.split('.')[0].trim()
        : 'Individualised by prescriber',
    },
    {
      label: 'Evidence score',
      value: drug.evidence_score != null ? String(drug.evidence_score) : 'Literature linked below',
    },
  ];

  const doseEscalationContent =
    dosePhaseLabels.length > 0 ? (
      <div className="space-y-4">
        {dosePhaseLabels.map((label) => (
          <div key={label} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-1.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Phase
                    </th>
                    <th className="pb-1.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Dose
                    </th>
                    <th className="pb-1.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Frequency
                    </th>
                    <th className="pb-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Guidance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dosePhasesByProtocol[label].map((phase) => {
                    const dose =
                      phase.dose_amount != null
                        ? `${phase.dose_amount} ${phase.dose_unit ?? ''}`.trim()
                        : 'Protocol specific';
                    return (
                      <tr key={phase.id} className="border-b border-border/50 align-top">
                        <td className="py-2 pr-4">
                          <span className="font-medium">{phase.phase_label}</span>
                          <p className="text-xs text-muted-foreground">
                            Week {phase.start_week}
                            {phase.end_week ? `-${phase.end_week}` : '+'}
                          </p>
                        </td>
                        <td className="py-2 pr-4 tabular-nums">{dose}</td>
                        <td className="py-2 pr-4">{phase.frequency ?? 'See source'}</td>
                        <td className="py-2">
                          {phase.phase_purpose && <p>{phase.phase_purpose}</p>}
                          {phase.hold_or_reduce_guidance && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {phase.hold_or_reduce_guidance}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <main className="section-shell py-8 pb-24 sm:py-10 sm:pb-10">
      <div className="space-y-8">
        <div className="sticky top-[4.5rem] z-30 lg:hidden">
          <TocScrollSpy items={tocItems} compact />
        </div>
        <Link
          href="/peptides"
          className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All drugs
        </Link>

        {/* ── Overview header ── */}
        <header id="overview" className="space-y-4 fade-up">
          <p className="eyebrow">Drug companion protocol</p>
          <div className="space-y-3">
            <div className="flex flex-wrap items-start gap-2.5">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{displayName}</h1>
              {drug.prescription_required && <Badge>Prescription only</Badge>}
              {drug.drug_class && <Badge variant="secondary">{drug.drug_class}</Badge>}
            </div>
            {innLabel && (
              <p className="text-sm text-muted-foreground">
                Active ingredient:{' '}
                <span className="font-medium text-foreground">{innLabel}</span>
              </p>
            )}
            {extraBrandLabels.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Other US trade names: {extraBrandLabels.join(', ')}
              </p>
            )}
            {drug.short_description && (
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{drug.short_description}</p>
            )}
          </div>

          {drug.image_url && (
            <div className="relative h-52 w-full max-w-md overflow-hidden rounded-[--radius-xl] border border-border/60 bg-muted/30 sm:h-64">
              <Image src={drug.image_url} alt={`${displayName} vial`} fill className="object-contain p-4" />
            </div>
          )}

          <QuickFactsPanel items={quickFacts} />

          {/* Quickstart highlights */}
          {quickstartHighlights.length > 0 && (
            <div className="rounded-[--radius-xl] border border-primary/20 bg-primary/5 p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-primary">
                Quickstart highlights
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {quickstartHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 text-base leading-5">{h.icon}</span>
                    <span>{h.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Alert variant="info">
            <AlertDescription className="text-sm">
              <strong>General information only — not medical advice.</strong> Always follow your prescriber&apos;s
              instructions.{regionNote ? <> {regionNote}</> : null}
            </AlertDescription>
          </Alert>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-8">
            {/* ── How it works ── */}
            {(drug.mechanism_summary || pkEntries.length > 0) && (
              <ProtocolBlock
                id="mechanism"
                title="How this works"
                subtitle="Mechanism of action and pharmacokinetic profile from published data."
              >
                <div className="space-y-4">
                  {drug.mechanism_summary && (
                    <p className="text-sm leading-relaxed">{drug.mechanism_summary}</p>
                  )}
                  {pkEntries.length > 0 && (
                    <dl className="grid gap-x-6 gap-y-3 rounded-[--radius] border border-border bg-background p-4 sm:grid-cols-2">
                      {pkEntries.map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-xs font-semibold text-muted-foreground">
                            {PK_LABEL[k] ?? k.replace(/_/g, ' ')}
                          </dt>
                          <dd className="mt-0.5 text-sm">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </ProtocolBlock>
            )}

            {doseEscalationContent && !hasReconstitution && !hasPenGuide && (
              <ProtocolBlock
                id="dosing"
                title="Dosing overview"
                subtitle="Structured dosing phases exposed through the public drug API."
              >
                {doseEscalationContent}
              </ProtocolBlock>
            )}

            {/* ── Dosing & Reconstitution Guide (lyophilised / compounded drugs) ── */}
            {hasReconstitution && (
              <ProtocolBlock
                id="reconstitution"
                title="Dosing & Reconstitution Guide"
                subtitle="Full preparation, protocol, and administration reference for compounded lyophilised formulations."
              >
                <div className="space-y-8">
                  {/* Protocol Overview */}
                  {drug.typical_dosing_schedule && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Protocol overview
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed">{drug.typical_dosing_schedule}</p>
                    </div>
                  )}

                  {doseEscalationContent && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Dose escalation phases
                      </p>
                      {doseEscalationContent}
                    </div>
                  )}

                  {/* Supplies Needed */}
                  {injectionByType.supply.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Supplies needed
                      </p>
                      <ul className="mt-2 space-y-2">
                        {injectionByType.supply.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-muted-foreground">◦</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <span className="text-muted-foreground"> — {g.body}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dose protocol tables — Standard, Advanced, Concentration reference */}
                  {doseProtocolLabels.map((label) => {
                    const config = PROTOCOL_SECTION[label];
                    return (
                      <div key={label} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {config?.heading ?? label}
                        </p>
                        {config?.intro && (
                          <p className="text-sm text-muted-foreground">{config.intro}</p>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="pb-1.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Phase / Dose
                                </th>
                                <th className="pb-1.5 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  U-100 Units
                                </th>
                                <th className="pb-1.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Volume (mL)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {doseByProtocol[label].map((row) => (
                                <tr key={row.id} className="border-b border-border/50">
                                  <td className="py-1.5 pr-4">{row.phase_label ?? `${row.dose_mg} mg`}</td>
                                  <td className="py-1.5 pr-4 text-right tabular-nums">{row.units_u100}</td>
                                  <td className="py-1.5 text-right tabular-nums">
                                    {Number(row.volume_ml).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  {/* Reconstitution Steps */}
                  {reconstitutionGuide.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Reconstitution steps
                      </p>
                      {reconstitutionGuide.map((r) => (
                        <div
                          key={r.id}
                          className="space-y-3 rounded-[--radius] border border-border bg-background p-4"
                        >
                          <div className="flex flex-wrap gap-6">
                            <div>
                              <p className="text-xs text-muted-foreground">Vial size</p>
                              <p className="text-sm font-semibold">{r.vial_size_mg} mg</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">BAC water to add</p>
                              <p className="text-sm font-semibold">{r.bac_water_ml} mL</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Resulting concentration</p>
                              <p className="text-sm font-semibold">{r.concentration_mg_per_ml} mg/mL</p>
                            </div>
                          </div>
                          {r.measurement_note && (
                            <p className="rounded bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                              {r.measurement_note}
                            </p>
                          )}
                          {r.technique_notes && (
                            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                              {r.technique_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Injection steps */}
                  {injectionByType.step.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Injection steps
                      </p>
                      <ol className="mt-2 space-y-2">
                        {injectionByType.step.map((g, i) => (
                          <li key={g.id} className="flex gap-3 text-sm">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                              {i + 1}
                            </span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <p className="mt-0.5 text-muted-foreground">{g.body}</p>}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Storage Instructions */}
                  {reconstitutionGuide.length > 0 &&
                    (reconstitutionGuide[0].storage_lyophilized ||
                      reconstitutionGuide[0].storage_reconstituted) && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Storage instructions
                        </p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          {reconstitutionGuide[0].storage_lyophilized && (
                            <div className="rounded-[--radius] border border-border bg-background p-3">
                              <p className="text-xs font-semibold text-muted-foreground">Before reconstitution</p>
                              <p className="mt-1 text-sm leading-relaxed">
                                {reconstitutionGuide[0].storage_lyophilized}
                              </p>
                            </div>
                          )}
                          {reconstitutionGuide[0].storage_reconstituted && (
                            <div className="rounded-[--radius] border border-border bg-background p-3">
                              <p className="text-xs font-semibold text-muted-foreground">After reconstitution</p>
                              <p className="mt-1 text-sm leading-relaxed">
                                {reconstitutionGuide[0].storage_reconstituted}
                              </p>
                              {reconstitutionGuide[0].use_within && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {reconstitutionGuide[0].use_within}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Important Notes */}
                  {injectionByType.warning.length > 0 && (
                    <div className="rounded-[--radius] border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Important notes
                      </p>
                      <ul className="mt-2 space-y-2">
                        {injectionByType.warning.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">!</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <p className="mt-0.5 text-muted-foreground">{g.body}</p>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sharps Disposal */}
                  {injectionByType.disposal.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Sharps disposal
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {injectionByType.disposal.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-muted-foreground">◦</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <span className="text-muted-foreground"> — {g.body}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-[--radius] border border-border/60 bg-muted/30 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">
                      Concentration calculations are standard compounding arithmetic. Protocol phases are drawn from
                      published Phase 2 trial data. Your prescriber and dispensing pharmacy determine the actual dose,
                      vial size, and escalation schedule for your treatment.
                    </p>
                  </div>
                </div>
              </ProtocolBlock>
            )}

            {/* ── Pen Injection Guide (approved pen-device drugs only) ── */}
            {hasPenGuide && (
              <ProtocolBlock
                id="injection"
                title="Injection guide"
                subtitle="Supplies, step-by-step technique, safety notes, and AU sharps disposal."
              >
                <div className="space-y-6">
                  {doseEscalationContent && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Dose escalation phases
                      </p>
                      {doseEscalationContent}
                    </div>
                  )}

                  {injectionByType.supply.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Supplies needed
                      </p>
                      <ul className="mt-2 space-y-2">
                        {injectionByType.supply.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-muted-foreground">◦</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <span className="text-muted-foreground"> — {g.body}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {injectionByType.step.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Step-by-step
                      </p>
                      <ol className="mt-2 space-y-2">
                        {injectionByType.step.map((g, i) => (
                          <li key={g.id} className="flex gap-3 text-sm">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                              {i + 1}
                            </span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <p className="mt-0.5 text-muted-foreground">{g.body}</p>}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {injectionByType.warning.length > 0 && (
                    <div className="rounded-[--radius] border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Important notes
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {injectionByType.warning.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">!</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <p className="mt-0.5 text-muted-foreground">{g.body}</p>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {injectionByType.disposal.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Sharps disposal
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {injectionByType.disposal.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-muted-foreground">◦</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <span className="text-muted-foreground"> — {g.body}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ProtocolBlock>
            )}

            {/* ── Clinical Benefits & Side Effects ── */}
            {(expectations.length > 0 || sideEffects.length > 0 || lifecycleTips.length > 0) && (
              <ProtocolBlock
                id="clinical"
                title="Clinical Benefits & Side Effects"
                subtitle="Observed outcomes, adverse effects, and lifecycle considerations from published trial data."
              >
                <div className="space-y-7">
                  {/* Benefits */}
                  {expectations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Benefits</p>
                      <div className="mt-2 space-y-2">
                        {expectations.map((e) => (
                          <div key={e.id} className="rounded-[--radius] border border-border/85 bg-background p-3">
                            <div className="flex items-start gap-2">
                              <Badge variant="outline" className="mt-0.5 shrink-0">
                                Week {e.week_number === 0 ? '0' : e.week_number}
                              </Badge>
                              <div>
                                <p className="text-sm font-semibold">{e.milestone}</p>
                                <p className="text-sm text-muted-foreground">{e.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Side Effects */}
                  {sideEffects.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Side effects
                      </p>
                      <div className="mt-2 space-y-2">
                        {sideEffects.map((s) => (
                          <div key={s.id} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-muted-foreground">◦</span>
                            <span>
                              <span className="font-medium">{s.effect}</span>
                              {s.severity && (
                                <span className="ml-1.5 text-xs text-muted-foreground">({s.severity})</span>
                              )}
                              {s.frequency && <p className="text-xs text-muted-foreground">{s.frequency}</p>}
                              {sideEffectTipsById[s.id] && sideEffectTipsById[s.id].length > 0 && (
                                <ul className="mt-1 space-y-1">
                                  {sideEffectTipsById[s.id]
                                    .sort((a, b) => a.ordinal - b.ordinal)
                                    .map((tip) => (
                                      <li key={tip.id} className="text-xs text-muted-foreground">
                                        {tip.strategy}
                                        {tip.when_to_seek_help && (
                                          <span className="block">Seek help: {tip.when_to_seek_help}</span>
                                        )}
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lifecycle Factors */}
                  {lifecycleTips.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Lifecycle factors
                      </p>
                      <div className="mt-2 space-y-2">
                        {lifecycleTips.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-[--radius] border border-border bg-background p-3"
                          >
                            <p className="text-sm font-semibold">{t.title}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{t.body_markdown}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Important Note */}
                  <div className="rounded-[--radius] border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Important note
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {hasReconstitution
                        ? `This content is intended for therapeutic educational purposes only and does not constitute medical advice, diagnosis, or treatment. ${displayName} is not TGA/FDA-approved and is available only for research purposes. All information presented is based on published clinical trial data and is not intended to encourage off-label use.`
                        : 'This content is intended for therapeutic educational purposes only and does not constitute medical advice, diagnosis, or treatment. All information presented is based on published clinical trial data. Always follow your prescriber\'s instructions.'}
                    </p>
                  </div>
                </div>
              </ProtocolBlock>
            )}

            {/* ── Nutrition & Practical Guidance ── */}
            {(food.length > 0 || practicalTips.length > 0) && (
              <ProtocolBlock
                id="guidance"
                title="Nutrition & practical guidance"
                subtitle="Food, hydration, and adherence tips compiled from trial data and clinical companion content."
              >
                <div className="space-y-6">
                  {food.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Food and hydration
                      </p>
                      <div className="mt-2 space-y-3">
                        {(['prefer', 'limit', 'avoid', 'hydrate'] as const)
                          .filter((c) => foodByCategory[c].length > 0)
                          .map((cat) => (
                            <div key={cat}>
                              <p className="mb-1 text-xs font-semibold text-muted-foreground">{FOOD_LABEL[cat]}</p>
                              <div className="flex flex-wrap gap-2">
                                {foodByCategory[cat].map((f) => (
                                  <span
                                    key={f.id}
                                    className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs"
                                  >
                                    {f.item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  {practicalTips.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Adherence tips
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {practicalTips.map((t) => (
                          <Card key={t.id} className="h-full">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{t.category}</Badge>
                                <CardTitle className="text-sm">{t.title}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm leading-relaxed text-muted-foreground">{t.body_markdown}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ProtocolBlock>
            )}

            {/* ── Safety & Interactions ── */}
            {(drug.contraindications ||
              interactionList.length > 0 ||
              warnings.length > 0 ||
              approvedIndications.length > 0 ||
              missedDoseRules.length > 0 ||
              formulationStorage.length > 0 ||
              sideEffectThresholds.length > 0 ||
              drug.storage_handling) && (
              <ProtocolBlock
                id="safety"
                title="Safety and interactions"
                subtitle="Share this information with your prescriber for personalised care decisions."
              >
                <div className="space-y-4">
                  {warnings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Structured warnings
                      </p>
                      <div className="mt-2 space-y-2">
                        {warnings.map((warning) => (
                          <div
                            key={warning.id}
                            className="rounded-[--radius] border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{WARNING_LABEL[warning.severity] ?? warning.severity}</Badge>
                              <p className="text-sm font-semibold">{warning.title}</p>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{warning.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {approvedIndications.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Indication and approval status
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {approvedIndications.map((indication) => (
                          <div key={indication.id} className="rounded-[--radius] border border-border bg-background p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                {APPROVAL_LABEL[indication.approval_status] ?? indication.approval_status}
                              </Badge>
                              <span className="text-xs font-medium text-muted-foreground">
                                {indication.region}
                                {indication.authority ? ` · ${indication.authority}` : ''}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{indication.indication}</p>
                            {indication.population && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{indication.population}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {drug.contraindications && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Who should not take this
                      </p>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
                        {drug.contraindications}
                      </p>
                    </div>
                  )}
                  {interactionList.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Known interactions
                      </p>
                      <ul className="mt-1.5 space-y-2">
                        {interactionList.map((item, idx) => (
                          <li key={idx} className="text-sm">
                            {item.drug && <span className="font-medium">{item.drug}</span>}
                            {item.severity && (
                              <Badge variant="outline" className="ml-2">
                                {item.severity}
                              </Badge>
                            )}
                            {item.interaction && (
                              <p className="mt-0.5 text-muted-foreground">{item.interaction}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {missedDoseRules.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Missed-dose guidance
                      </p>
                      <div className="mt-2 space-y-2">
                        {missedDoseRules.map((rule) => (
                          <div key={rule.id} className="rounded-[--radius] border border-border bg-background p-3">
                            <p className="text-sm">{rule.instruction}</p>
                            {rule.restart_guidance && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{rule.restart_guidance}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sideEffectThresholds.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        When to seek help
                      </p>
                      <div className="mt-2 space-y-2">
                        {sideEffectThresholds.map((threshold) => (
                          <div key={threshold.id} className="rounded-[--radius] border border-border bg-background p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">{threshold.effect}</span>
                              <Badge variant="outline">
                                {THRESHOLD_ACTION_LABEL[threshold.action] ?? threshold.action}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{threshold.threshold}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{threshold.action_label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formulationStorage.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Structured storage
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {formulationStorage.map((storage) => (
                          <div key={storage.id} className="rounded-[--radius] border border-border bg-background p-3">
                            <p className="text-sm font-semibold">{storage.formulation}</p>
                            {storage.storage_state && (
                              <p className="text-xs text-muted-foreground">{storage.storage_state}</p>
                            )}
                            {storage.temperature && <p className="mt-1 text-sm">{storage.temperature}</p>}
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {storage.protect_from_light && <Badge variant="secondary">Protect from light</Badge>}
                              {storage.do_not_freeze && <Badge variant="secondary">Do not freeze</Badge>}
                            </div>
                            {(storage.expiry_after_opening || storage.expiry_after_reconstitution) && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {storage.expiry_after_opening ?? storage.expiry_after_reconstitution}
                              </p>
                            )}
                            {storage.handling_notes && (
                              <p className="mt-1 text-xs text-muted-foreground">{storage.handling_notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {drug.storage_handling && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Storage and handling
                      </p>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
                        {drug.storage_handling}
                      </p>
                    </div>
                  )}
                </div>
              </ProtocolBlock>
            )}

            {/* ── Research Evidence ── */}
            {(studies.length > 0 || sources.length > 0) && (
              <ProtocolBlock
                id="evidence"
                title="Research evidence"
                subtitle="Published studies, labels, regulator pages, and curated protocol sources connected to this profile."
              >
                <div className="space-y-4">
                  {sources.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        API source references
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {sources.map((source) => (
                          <div key={source.id} className="rounded-[--radius] border border-border bg-background p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{source.source_type.replace(/_/g, ' ')}</Badge>
                              {(source.region || source.authority) && (
                                <span className="text-xs text-muted-foreground">
                                  {[source.region, source.authority].filter(Boolean).join(' · ')}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-semibold">{source.label}</p>
                            {source.citation_text && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{source.citation_text}</p>
                            )}
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex text-xs font-medium hover:underline"
                              >
                                Open source ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {studies.map((s) => {
                    const meta = [
                      STUDY_TYPE_LABEL[s.study_type] ?? s.study_type,
                      s.publication_date ? new Date(s.publication_date).getFullYear() : null,
                      s.journal,
                      s.sample_size != null ? `n=${s.sample_size}` : null,
                      s.population,
                    ].filter(Boolean);
                    const studyDosages = dosagesByStudy[s.id] ?? [];
                    const studyOutcomes = outcomesByStudy[s.id] ?? [];
                    const citation = s.doi ? `https://doi.org/${s.doi}` : s.source_url;
                    return (
                      <Card key={s.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm leading-snug">{s.title}</CardTitle>
                          {meta.length > 0 && (
                            <p className="text-xs text-muted-foreground">{meta.join(' · ')}</p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {s.abstract && (
                            <p className="text-sm leading-relaxed text-muted-foreground">{s.abstract}</p>
                          )}
                          {studyOutcomes.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Reported outcomes
                              </p>
                              <ul className="mt-1 list-disc space-y-1 pl-5">
                                {studyOutcomes.map((o) => (
                                  <li key={o.id} className="text-sm">
                                    {o.outcome_type && (
                                      <span className="text-muted-foreground">{o.outcome_type}: </span>
                                    )}
                                    {o.description}
                                    {o.significance && (
                                      <span className="text-muted-foreground"> ({o.significance})</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {studyDosages.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Reported dosage
                              </p>
                              <ul className="mt-1 list-disc space-y-1 pl-5">
                                {studyDosages.map((d) => {
                                  const parts = [
                                    d.dosage_value != null && d.dosage_unit
                                      ? `${d.dosage_value} ${d.dosage_unit}`
                                      : null,
                                    d.frequency,
                                    d.duration,
                                  ].filter(Boolean);
                                  return (
                                    <li key={d.id} className="text-sm">
                                      {parts.length > 0 ? parts.join(' · ') : 'See source'}
                                      {d.context_note && (
                                        <span className="text-muted-foreground"> — {d.context_note}</span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                          <a
                            href={citation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium hover:underline"
                          >
                            {s.doi ? `DOI: ${s.doi}` : 'Source'} ↗
                          </a>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ProtocolBlock>
            )}

            <div className="surface-panel rounded-[--radius-xl] p-6 text-center">
              <p className="text-lg font-semibold">Get the full companion experience in Viora</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Week-by-week reminders, food and symptom tracking, and the complete companion guide in one place.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Available on iOS and Android.</p>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TocScrollSpy items={tocItems} />
            </div>
          </aside>
        </div>

        <MobileSectionRail
          items={[
            { id: 'overview', label: 'Top' },
            { id: 'reconstitution', label: 'Dosing' },
            { id: 'clinical', label: 'Benefits' },
            { id: 'evidence', label: 'Evidence' },
          ]}
          ctaHref="/auth/signup"
          ctaLabel="App signup"
        />
      </div>
    </main>
  );
}
