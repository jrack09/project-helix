import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, DrugApprovalStatus, EvidenceLevel } from '@/types/database';
import type {
  AssembledEvidence,
  ClaimEvidenceLevel,
  DisplayTier,
  EvidenceClaim,
  EvidenceDrugRow,
  UnifiedSource,
} from '@/lib/evidence/types';
import {
  EXCLUDED_DOIS,
  extractDoiFromUrl,
  extractPubmedId,
  normalizeUrl,
  studyToUnifiedSourceType,
} from '@/lib/evidence/url-utils';

type AdminClient = SupabaseClient<Database>;

type DrugSourceRow = Database['public']['Tables']['drug_sources']['Row'];
type StudyRow = Database['public']['Tables']['studies']['Row'];

function deriveTier(
  sourceIds: string[],
  sourcesById: Map<string, UnifiedSource>,
  opts?: {
    fallbackEvidenceLevel?: EvidenceLevel;
    forceInvestigational?: boolean;
  },
): { evidence_level: ClaimEvidenceLevel; display_tier: DisplayTier } {
  if (sourceIds.length === 0) {
    return {
      evidence_level: opts?.fallbackEvidenceLevel ?? 'editorial',
      display_tier: 'educational',
    };
  }

  const primary = sourcesById.get(sourceIds[0]);
  if (!primary) {
    return {
      evidence_level: opts?.fallbackEvidenceLevel ?? 'editorial',
      display_tier: 'educational',
    };
  }

  if (opts?.forceInvestigational) {
    return {
      evidence_level: primary.source_type === 'regulator' ? 'regulatory' : 'study_backed',
      display_tier: 'investigational_context',
    };
  }

  if (primary.source_type === 'prescribing_information' || primary.source_type === 'regulator') {
    return { evidence_level: 'regulatory', display_tier: 'regulatory' };
  }

  if (
    primary.source_type === 'study' ||
    primary.source_type === 'human_rct' ||
    primary.source_type === 'review' ||
    primary.source_type === 'meta_analysis'
  ) {
    return { evidence_level: 'study_backed', display_tier: 'research_backed' };
  }

  return {
    evidence_level: opts?.fallbackEvidenceLevel ?? 'editorial',
    display_tier: 'educational',
  };
}

function pushClaim(
  claims: EvidenceClaim[],
  sourcesById: Map<string, UnifiedSource>,
  opts: {
    idPrefix: string;
    rowId: string;
    field: string;
    text: string | null | undefined;
    sourceId: string | null | undefined;
    fallbackEvidenceLevel?: EvidenceLevel;
    forceInvestigational?: boolean;
  },
) {
  const text = opts.text?.trim();
  if (!text) return;

  const source_ids = opts.sourceId ? [opts.sourceId] : [];
  const { evidence_level, display_tier } = deriveTier(source_ids, sourcesById, {
    fallbackEvidenceLevel: opts.fallbackEvidenceLevel,
    forceInvestigational: opts.forceInvestigational,
  });

  claims.push({
    id: `${opts.idPrefix}-${opts.rowId}`,
    field: opts.field,
    text,
    source_ids,
    evidence_level,
    display_tier,
  });
}

function drugSourceToUnified(row: DrugSourceRow, ordinal: number): UnifiedSource | null {
  const doi = extractDoiFromUrl(row.url);
  if (doi && EXCLUDED_DOIS.has(doi)) return null;

  return {
    id: row.id,
    source_type: row.source_type,
    label: row.label,
    url: row.url,
    region: row.region,
    authority: row.authority,
    citation_text: row.citation_text,
    retrieved_at: row.retrieved_at,
    doi,
    pubmed_id: extractPubmedId(row.url),
    study_type: null,
    sample_size: null,
    publication_date: null,
    ordinal,
  };
}

function mergeStudiesIntoSources(
  drugSources: DrugSourceRow[],
  studies: StudyRow[],
): { sources: UnifiedSource[]; studyIdToSourceId: Map<string, string> } {
  const sources: UnifiedSource[] = [];
  const byDoi = new Map<string, UnifiedSource>();
  const byUrl = new Map<string, UnifiedSource>();
  const studyIdToSourceId = new Map<string, string>();

  for (let i = 0; i < drugSources.length; i++) {
    const unified = drugSourceToUnified(drugSources[i], drugSources[i].ordinal ?? i);
    if (!unified) continue;
    sources.push(unified);
    if (unified.doi) byDoi.set(unified.doi.toLowerCase(), unified);
    const urlKey = normalizeUrl(unified.url);
    if (urlKey) byUrl.set(urlKey, unified);
  }

  let nextOrdinal = sources.length;

  for (const study of studies) {
    if (study.doi && EXCLUDED_DOIS.has(study.doi)) continue;

    let target: UnifiedSource | undefined;
    if (study.doi) target = byDoi.get(study.doi.toLowerCase());
    if (!target && study.source_url) {
      target = byUrl.get(normalizeUrl(study.source_url) ?? '');
    }

    if (target) {
      target.doi = target.doi ?? study.doi;
      target.pubmed_id = target.pubmed_id ?? extractPubmedId(study.source_url);
      target.study_type = study.study_type;
      target.sample_size = study.sample_size;
      target.publication_date = study.publication_date;
      if (!target.citation_text && study.title) {
        target.citation_text = study.title;
      }
      studyIdToSourceId.set(study.id, target.id);
      continue;
    }

    const id = `study-${study.id}`;
    const unified: UnifiedSource = {
      id,
      source_type: studyToUnifiedSourceType(study.study_type),
      label: study.title,
      url: study.source_url,
      region: null,
      authority: study.journal,
      citation_text: study.title,
      retrieved_at: null,
      doi: study.doi,
      pubmed_id: extractPubmedId(study.source_url),
      study_type: study.study_type,
      sample_size: study.sample_size,
      publication_date: study.publication_date,
      ordinal: nextOrdinal++,
    };
    sources.push(unified);
    studyIdToSourceId.set(study.id, id);
    if (unified.doi) byDoi.set(unified.doi.toLowerCase(), unified);
    const urlKey = normalizeUrl(unified.url);
    if (urlKey) byUrl.set(urlKey, unified);
  }

  sources.sort((a, b) => a.ordinal - b.ordinal);
  return { sources, studyIdToSourceId };
}

function isInvestigationalApprovalStatus(status: DrugApprovalStatus): boolean {
  return status === 'investigational' || status === 'not_approved';
}

export async function assembleEvidence(
  admin: AdminClient,
  drug: EvidenceDrugRow,
): Promise<AssembledEvidence> {
  const [
    drugSourcesRes,
    studyLinksRes,
    outcomesRes,
    sideEffectsRes,
    foodGuidanceRes,
    warningsRes,
    missedDoseRes,
    indicationsRes,
    dosePhasesRes,
    formulationStorageRes,
    seThresholdsRes,
    seWindowsRes,
    injectionSitesRes,
    oralAdminRes,
    protocolTimelineRes,
    doseCycleProfileRes,
    symptomPlaybooksRes,
    foodToleranceRes,
    checkinProtocolRes,
    redFlagRulesRes,
    clinicianReportRes,
  ] = await Promise.all([
    admin
      .from('drug_sources')
      .select('*')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin.from('study_peptides').select('study_id').eq('peptide_id', drug.id),
    admin.from('study_outcomes').select('*').eq('peptide_id', drug.id),
    admin
      .from('side_effects')
      .select('id, effect, severity, frequency, study_id')
      .eq('peptide_id', drug.id),
    admin
      .from('drug_food_guidance')
      .select('id, item, rationale, evidence_level, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_warnings')
      .select('id, title, body, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_missed_dose_rules')
      .select('id, instruction, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_approved_indications')
      .select('id, indication, approval_status, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_dose_escalation_phases')
      .select('id, phase_purpose, hold_or_reduce_guidance, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_formulation_storage')
      .select('id, handling_notes, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_side_effect_thresholds')
      .select('id, action_label, threshold, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_side_effect_windows')
      .select('id, notes, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_injection_sites')
      .select('id, rotation_guidance, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_oral_administration')
      .select('id, interaction_notes, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_protocol_timeline')
      .select('id, expected_changes, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_dose_cycle_profile')
      .select('notes, source_id')
      .eq('drug_id', drug.id)
      .maybeSingle(),
    admin
      .from('drug_symptom_playbooks')
      .select('id, symptom, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_food_tolerance_rules')
      .select('id, rationale, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_checkin_protocol')
      .select('id, notes, source_id')
      .eq('drug_id', drug.id)
      .maybeSingle(),
    admin
      .from('drug_red_flag_rules')
      .select('id, display_copy, source_id, ordinal')
      .eq('drug_id', drug.id)
      .order('ordinal', { ascending: true }),
    admin
      .from('drug_clinician_report_template')
      .select('medication_context_label, source_id')
      .eq('drug_id', drug.id)
      .maybeSingle(),
  ]);

  const studyIds = (studyLinksRes.data ?? []).map((l) => l.study_id);
  const { data: studies } =
    studyIds.length > 0
      ? await admin.from('studies').select('*').in('id', studyIds)
      : { data: [] as StudyRow[] };

  const { sources, studyIdToSourceId } = mergeStudiesIntoSources(
    drugSourcesRes.data ?? [],
    studies ?? [],
  );
  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const claims: EvidenceClaim[] = [];

  const drugIsInvestigational = drug.status_label === 'investigational';

  for (const [i, row] of (warningsRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-warning',
      rowId: row.id,
      field: `clinical_profile.warnings[${i}]`,
      text: `${row.title}: ${row.body}`,
      sourceId: row.source_id,
      forceInvestigational: drugIsInvestigational && row.title.toLowerCase().includes('investigational'),
    });
  }

  for (const [i, row] of (missedDoseRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-missed-dose',
      rowId: row.id,
      field: `clinical_profile.missed_dose_rules[${i}]`,
      text: row.instruction,
      sourceId: row.source_id,
    });
  }

  for (const [i, row] of (indicationsRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-indication',
      rowId: row.id,
      field: `clinical_profile.approved_indications[${i}]`,
      text: row.indication,
      sourceId: row.source_id,
      forceInvestigational: isInvestigationalApprovalStatus(row.approval_status),
    });
  }

  for (const [i, row] of (dosePhasesRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-dose-phase',
      rowId: row.id,
      field: `clinical_profile.dose_escalation_phases[${i}]`,
      text: row.phase_purpose ?? row.hold_or_reduce_guidance,
      sourceId: row.source_id,
    });
  }

  for (const [i, row] of (formulationStorageRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-storage',
      rowId: row.id,
      field: `clinical_profile.storage[${i}]`,
      text: row.handling_notes,
      sourceId: row.source_id,
    });
  }

  for (const [i, row] of (seThresholdsRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-se-threshold',
      rowId: row.id,
      field: `clinical_profile.side_effect_thresholds[${i}]`,
      text: row.action_label ?? row.threshold,
      sourceId: row.source_id,
    });
  }

  for (const [i, row] of (seWindowsRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-se-window',
      rowId: row.id,
      field: `clinical_profile.side_effect_windows[${i}]`,
      text: row.notes,
      sourceId: row.source_id,
    });
  }

  for (const [i, row] of (injectionSitesRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-injection-site',
      rowId: row.id,
      field: `clinical_profile.approved_injection_sites[${i}]`,
      text: row.rotation_guidance,
      sourceId: row.source_id,
    });
  }

  for (const [i, row] of (oralAdminRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-oral-admin',
      rowId: row.id,
      field: `clinical_profile.oral_administration[${i}]`,
      text: row.interaction_notes,
      sourceId: row.source_id,
    });
  }

  for (const [i, row] of (protocolTimelineRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-protocol-timeline',
      rowId: row.id,
      field: `protocol_timeline[${i}]`,
      text: row.expected_changes?.join(' '),
      sourceId: row.source_id,
    });
  }

  if (doseCycleProfileRes.data) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-dose-cycle',
      rowId: drug.id,
      field: 'clinical_profile.dose_cycle_profile',
      text: doseCycleProfileRes.data.notes,
      sourceId: doseCycleProfileRes.data.source_id,
    });
  }

  for (const [i, row] of (symptomPlaybooksRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-symptom-playbook',
      rowId: row.id,
      field: `clinical_profile.symptom_playbooks[${i}]`,
      text: row.symptom,
      sourceId: row.source_id,
    });
  }

  for (const [i, row] of (foodToleranceRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-food-tolerance',
      rowId: row.id,
      field: `clinical_profile.food_tolerance_rules[${i}]`,
      text: row.rationale,
      sourceId: row.source_id,
    });
  }

  if (checkinProtocolRes.data) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-checkin',
      rowId: checkinProtocolRes.data.id,
      field: 'checkin_protocol',
      text: checkinProtocolRes.data.notes,
      sourceId: checkinProtocolRes.data.source_id,
    });
  }

  for (const [i, row] of (redFlagRulesRes.data ?? []).entries()) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-red-flag',
      rowId: row.id,
      field: `clinical_profile.red_flag_rules[${i}]`,
      text: row.display_copy,
      sourceId: row.source_id,
    });
  }

  if (clinicianReportRes.data?.medication_context_label) {
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-clinician-report',
      rowId: drug.id,
      field: 'clinical_profile.clinician_report_template',
      text: clinicianReportRes.data.medication_context_label,
      sourceId: clinicianReportRes.data.source_id,
    });
  }

  for (const [i, row] of (foodGuidanceRes.data ?? []).entries()) {
    const text = row.rationale ? `${row.item}: ${row.rationale}` : row.item;
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-food',
      rowId: row.id,
      field: `food_guidance[${i}]`,
      text,
      sourceId: null,
      fallbackEvidenceLevel: row.evidence_level,
    });
  }

  for (const row of outcomesRes.data ?? []) {
    const sourceId = studyIdToSourceId.get(row.study_id);
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-outcome',
      rowId: row.id,
      field: `studies[${row.study_id}].outcomes[${row.id}]`,
      text: row.description,
      sourceId: sourceId ?? null,
    });
  }

  for (const row of sideEffectsRes.data ?? []) {
    const sourceId = studyIdToSourceId.get(row.study_id);
    pushClaim(claims, sourcesById, {
      idPrefix: 'claim-side-effect',
      rowId: row.id,
      field: `side_effects[${row.id}]`,
      text: row.effect,
      sourceId: sourceId ?? null,
    });
  }

  if (drugIsInvestigational) {
    const statusSourceId =
      sources.find((s) => s.source_type === 'regulator')?.id ??
      sources.find((s) => s.source_type === 'study' || s.source_type === 'human_rct')?.id ??
      sources[0]?.id;

    if (statusSourceId) {
      pushClaim(claims, sourcesById, {
        idPrefix: 'claim-status',
        rowId: drug.id,
        field: 'drug.clinical_status',
        text: 'Investigational — not approved for routine prescribing.',
        sourceId: statusSourceId,
        forceInvestigational: true,
      });
    }
  }

  return {
    slug: drug.slug,
    evidence_score: drug.evidence_score,
    sources,
    claims,
  };
}
