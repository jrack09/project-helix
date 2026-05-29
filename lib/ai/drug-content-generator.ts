import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type GeneratedExpectation = {
  week_number: number;
  milestone: string;
  description: string;
  is_common: boolean;
};

export type GeneratedFoodGuidance = {
  category: 'prefer' | 'limit' | 'avoid' | 'hydrate';
  item: string;
  rationale: string;
  evidence_level: 'anecdotal' | 'editorial' | 'study_backed';
};

export type GeneratedTip = {
  category: 'administration' | 'timing' | 'mindset' | 'exercise' | 'sleep' | 'hydration' | 'nutrition' | 'other';
  title: string;
  body_markdown: string;
};

export type GeneratedDrugContent = {
  expectations: GeneratedExpectation[];
  food_guidance: GeneratedFoodGuidance[];
  tips: GeneratedTip[];
};

type DrugInput = {
  name: string;
  generic_name: string | null;
  drug_class: string | null;
  administration_route: string | null;
  typical_dosing_schedule: string | null;
  short_description: string | null;
};

export async function generateDrugContent(drug: DrugInput): Promise<GeneratedDrugContent> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    tools: [
      {
        name: 'set_drug_content',
        description: 'Set week-by-week companion content for a GLP-1 or weight-management medication',
        input_schema: {
          type: 'object' as const,
          properties: {
            expectations: {
              type: 'array',
              description: 'Week-by-week expectations, weeks 1–12 minimum',
              items: {
                type: 'object',
                properties: {
                  week_number: { type: 'integer', minimum: 1, maximum: 24 },
                  milestone: { type: 'string', description: 'Short milestone title, 5–8 words' },
                  description: { type: 'string', description: '2–3 sentences on what the user may experience this week' },
                  is_common: { type: 'boolean', description: 'True if this is a commonly reported experience' },
                },
                required: ['week_number', 'milestone', 'description', 'is_common'],
              },
            },
            food_guidance: {
              type: 'array',
              description: 'Food and drink guidance across all four categories',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['prefer', 'limit', 'avoid', 'hydrate'] },
                  item: { type: 'string', description: 'The food, drink, or food group' },
                  rationale: { type: 'string', description: '1–2 sentences explaining why' },
                  evidence_level: { type: 'string', enum: ['anecdotal', 'editorial', 'study_backed'] },
                },
                required: ['category', 'item', 'rationale', 'evidence_level'],
              },
            },
            tips: {
              type: 'array',
              description: 'Practical companion tips covering multiple categories',
              items: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    enum: ['administration', 'timing', 'mindset', 'exercise', 'sleep', 'hydration', 'nutrition', 'other'],
                  },
                  title: { type: 'string', description: 'Short tip title' },
                  body_markdown: { type: 'string', description: '2–4 sentences of practical advice, Markdown supported' },
                },
                required: ['category', 'title', 'body_markdown'],
              },
            },
          },
          required: ['expectations', 'food_guidance', 'tips'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'set_drug_content' },
    messages: [
      {
        role: 'user',
        content: `Generate companion content for people starting ${drug.name}${drug.generic_name ? ` (${drug.generic_name})` : ''}.

Drug details:
- Generic name: ${drug.generic_name ?? 'N/A'}
- Drug class: ${drug.drug_class ?? 'N/A'}
- Administration: ${drug.administration_route?.replace(/_/g, ' ') ?? 'N/A'}
- Dosing schedule: ${drug.typical_dosing_schedule ?? 'N/A'}
- Description: ${drug.short_description ?? 'N/A'}

Content requirements:
- General lifestyle information only — NOT medical advice
- Warm, supportive, plain language — written for someone new to this medication
- Use "your prescriber" not "your doctor"; include "follow your prescriber's instructions" where appropriate
- Australian context: metric units (kg, mL, km), Australian food references where relevant

Expectations (weeks 1–12, one entry per week):
- Week 1–4: focus on adjustment, side effects (especially nausea), low dose, little visible result yet — set realistic expectations
- Week 5–8: dose escalation phase, appetite suppression becoming more noticeable
- Week 9–12: settling into routine, early results, building habits
- Be honest about the difficulty of early weeks; do not over-promise results

Food guidance:
- ~5 prefer items (high-protein, easily digested whole foods)
- ~4 limit items (fatty, processed, or high-sugar foods)
- ~4 avoid items (foods that significantly worsen side effects)
- ~4 hydrate items (specific hydration recommendations)

Tips (12–15 total):
- Cover: administration technique, injection timing, hydration habits, protein intake, managing nausea, movement/exercise, sleep, mindset, tracking progress
- Each tip should be actionable and specific, not generic

STRICTLY NEVER use: cure, guarantee results, treat (as a medical claim), reverse diabetes/obesity, diagnose, stop taking, skip a dose, instead of your prescribed medication.`,
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return a valid structured response');
  }

  return toolUse.input as GeneratedDrugContent;
}

// ────────────────────────────────────────────────────────────
// PIP-extension fields generator
// ────────────────────────────────────────────────────────────

export type GeneratedPharmacokinetics = {
  half_life_hours: number | null;
  tmax_hours: number | null;
  duration_of_action_hours: number | null;
};

export type GeneratedWarning = {
  severity: 'info' | 'caution' | 'urgent' | 'boxed_warning';
  title: string;
  body: string;
  is_red_flag: boolean;
};

export type GeneratedMissedDoseRule = {
  formulation: string | null;
  max_delay_hours: number | null;
  instruction: string;
  restart_guidance: string | null;
};

export type GeneratedInjectionSite = {
  site: 'abdomen' | 'thigh' | 'upper_arm' | 'buttock' | 'other';
  preferred: boolean;
  rotation_guidance: string | null;
  avoid_notes: string | null;
};

export type GeneratedSideEffectWindow = {
  effect: string;
  onset_hours_min: number | null;
  onset_hours_max: number | null;
  peak_hours_min: number | null;
  peak_hours_max: number | null;
  resolution_days_typical: number | null;
  notes: string | null;
};

export type GeneratedOralAdministration = {
  formulation: string;
  with_water_ml: number | null;
  swallow_whole: boolean;
  time_of_day: string | null;
  fasting_window_before_min: number | null;
  fasting_window_after_min: number | null;
  interaction_notes: string | null;
};

export type GeneratedPipExtensions = {
  pharmacokinetics: GeneratedPharmacokinetics;
  warnings: GeneratedWarning[];
  missed_dose_rules: GeneratedMissedDoseRule[];
  injection_sites: GeneratedInjectionSite[];
  side_effect_windows: GeneratedSideEffectWindow[];
  oral_administration: GeneratedOralAdministration[];
};

type PipDrugInput = DrugInput & {
  mechanism_summary: string | null;
  contraindications: string | null;
  pharmacokinetics_notes: string | null;
  source_urls: string[];
};

export async function generateDrugPipExtensions(drug: PipDrugInput): Promise<GeneratedPipExtensions> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    tools: [
      {
        name: 'set_pip_extensions',
        description: 'Draft structured PIP-extension fields (numeric PK, warnings, missed-dose, injection sites, SE windows, oral admin) for a drug, sourced from its prescribing information.',
        input_schema: {
          type: 'object' as const,
          properties: {
            pharmacokinetics: {
              type: 'object',
              properties: {
                half_life_hours: { type: ['number', 'null'], description: 'Elimination half-life in hours. Null if not characterised in humans.' },
                tmax_hours: { type: ['number', 'null'], description: 'Time to peak plasma concentration in hours.' },
                duration_of_action_hours: { type: ['number', 'null'], description: 'Typical duration of clinical action between doses, in hours (e.g. 168 for once-weekly).' },
              },
              required: ['half_life_hours', 'tmax_hours', 'duration_of_action_hours'],
            },
            warnings: {
              type: 'array',
              description: '3-6 structured warnings, with is_red_flag=true on the ones describing symptoms needing urgent escalation.',
              items: {
                type: 'object',
                properties: {
                  severity: { type: 'string', enum: ['info', 'caution', 'urgent', 'boxed_warning'] },
                  title: { type: 'string', description: 'Short title, e.g. "Pancreatitis symptoms"' },
                  body: { type: 'string', description: '1-2 sentence body in plain language' },
                  is_red_flag: { type: 'boolean', description: 'True only for warnings describing a symptom the patient should act on urgently.' },
                },
                required: ['severity', 'title', 'body', 'is_red_flag'],
              },
            },
            missed_dose_rules: {
              type: 'array',
              description: 'Missed-dose rules from the PI. Omit entirely if no formal guidance exists.',
              items: {
                type: 'object',
                properties: {
                  formulation: { type: ['string', 'null'], description: 'e.g. "pen", "vial", "tablet"' },
                  max_delay_hours: { type: ['integer', 'null'] },
                  instruction: { type: 'string' },
                  restart_guidance: { type: ['string', 'null'] },
                },
                required: ['formulation', 'max_delay_hours', 'instruction', 'restart_guidance'],
              },
            },
            injection_sites: {
              type: 'array',
              description: 'Approved injection sites for parenteral drugs. Empty array for oral-only drugs.',
              items: {
                type: 'object',
                properties: {
                  site: { type: 'string', enum: ['abdomen', 'thigh', 'upper_arm', 'buttock', 'other'] },
                  preferred: { type: 'boolean' },
                  rotation_guidance: { type: ['string', 'null'] },
                  avoid_notes: { type: ['string', 'null'] },
                },
                required: ['site', 'preferred', 'rotation_guidance', 'avoid_notes'],
              },
            },
            side_effect_windows: {
              type: 'array',
              description: 'Typical onset / peak / resolution timing for the dominant side effects. Population typicals from trial pharmacology, not individual predictions.',
              items: {
                type: 'object',
                properties: {
                  effect: { type: 'string', description: 'e.g. Nausea, Vomiting, Diarrhoea, Constipation, Injection-site reaction' },
                  onset_hours_min: { type: ['number', 'null'] },
                  onset_hours_max: { type: ['number', 'null'] },
                  peak_hours_min: { type: ['number', 'null'] },
                  peak_hours_max: { type: ['number', 'null'] },
                  resolution_days_typical: { type: ['number', 'null'] },
                  notes: { type: ['string', 'null'] },
                },
                required: ['effect', 'onset_hours_min', 'onset_hours_max', 'peak_hours_min', 'peak_hours_max', 'resolution_days_typical', 'notes'],
              },
            },
            oral_administration: {
              type: 'array',
              description: 'Oral administration instructions. Empty array unless the drug has an oral formulation (e.g. tablet, capsule).',
              items: {
                type: 'object',
                properties: {
                  formulation: { type: 'string', description: 'e.g. "oral tablet"' },
                  with_water_ml: { type: ['integer', 'null'] },
                  swallow_whole: { type: 'boolean' },
                  time_of_day: { type: ['string', 'null'] },
                  fasting_window_before_min: { type: ['integer', 'null'] },
                  fasting_window_after_min: { type: ['integer', 'null'] },
                  interaction_notes: { type: ['string', 'null'] },
                },
                required: ['formulation', 'with_water_ml', 'swallow_whole', 'time_of_day', 'fasting_window_before_min', 'fasting_window_after_min', 'interaction_notes'],
              },
            },
          },
          required: ['pharmacokinetics', 'warnings', 'missed_dose_rules', 'injection_sites', 'side_effect_windows', 'oral_administration'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'set_pip_extensions' },
    messages: [
      {
        role: 'user',
        content: `Draft structured PIP-extension fields for ${drug.name}${drug.generic_name ? ` (${drug.generic_name})` : ''}.

These are STAFF DRAFTS for editorial review against the prescribing information — not final published content. A clinical editor will verify every field before publication.

Drug context:
- Generic: ${drug.generic_name ?? 'N/A'}
- Class: ${drug.drug_class ?? 'N/A'}
- Route: ${drug.administration_route?.replace(/_/g, ' ') ?? 'N/A'}
- Dosing: ${drug.typical_dosing_schedule ?? 'N/A'}
- Mechanism notes: ${drug.mechanism_summary ?? 'N/A'}
- Contraindications notes: ${drug.contraindications ?? 'N/A'}
- Existing PK prose: ${drug.pharmacokinetics_notes ?? 'N/A'}
- Source URLs already cited for this drug:
${drug.source_urls.length > 0 ? drug.source_urls.map((u) => `  - ${u}`).join('\n') : '  (none)'}

Rules:
- Pull values from the cited prescribing information / trial papers above where possible.
- For unapproved or investigational substances with no human PK characterisation, set numeric PK fields to null.
- is_red_flag=true only on warnings describing a symptom the patient should act on urgently (pancreatitis, severe allergic reaction, severe abdominal pain, severe hypoglycaemia, dehydration, suspected MTC symptoms).
- For non-injectable drugs, return empty injection_sites array.
- For injectable-only drugs, return empty oral_administration array.
- Plain language; "your prescriber" not "your doctor"; metric units (mg, mL, kg); Australian English spellings where applicable.
- Side-effect windows: only include effects with credible PI/trial-derived timing data. Skip if unknown.

STRICTLY NEVER use: cure, guarantee, treat (as a medical claim), reverse diabetes/obesity, diagnose, stop taking, skip a dose, instead of your prescribed medication.`,
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return a valid structured response');
  }

  return toolUse.input as GeneratedPipExtensions;
}

// ────────────────────────────────────────────────────────────
// Protocol-companion fields generator
// ────────────────────────────────────────────────────────────
// Separate tool call from set_pip_extensions to stay within
// max_tokens and keep the two editorial workflows independent.

export type GeneratedProtocolTimelinePhase = {
  protocol_label: string | null;
  week_start: number;
  week_end: number | null;
  phase_title: string;
  typical_dose_mg: number | null;
  cadence_days: number | null;
  expected_changes: string[];
  common_adjustments: string[];
  user_focus: string[];
};

export type GeneratedDoseCycleProfile = {
  onset_hours: number | null;
  peak_effect_hours_min: number | null;
  peak_effect_hours_max: number | null;
  appetite_effect_window_min: number | null;
  appetite_effect_window_max: number | null;
  nausea_risk_window_min: number | null;
  nausea_risk_window_max: number | null;
  constipation_risk_window_min: number | null;
  constipation_risk_window_max: number | null;
  coverage_fades_after_hours: number | null;
  notes: string | null;
};

export type GeneratedSymptomPlaybookBand = {
  min_score: number | null;
  max_score: number | null;
  title: string;
  nutrition_strategy: string[];
  hydration_strategy: string[];
  avoid: string[];
  escalation: string | null;
};

export type GeneratedSymptomPlaybook = {
  symptom: string;
  bands: GeneratedSymptomPlaybookBand[];
};

export type GeneratedFoodToleranceRule = {
  context:
    | 'low_appetite'
    | 'nausea'
    | 'constipation'
    | 'reflux'
    | 'diarrhea'
    | 'dose_escalation_week'
    | 'day_before_dose'
    | 'post_dose_peak'
    | 'post_dose_nausea_window';
  prefer: string[];
  limit: string[];
  avoid: string[];
  rationale: string | null;
};

export type GeneratedCheckinQuestion = {
  question_id: string;
  label: string;
  type: string;
  unit: string | null;
  condition: string | null;
  trigger_guidance_from_score: number | null;
};

export type GeneratedCheckinProtocol = {
  cadence: string;
  notes: string | null;
  questions: GeneratedCheckinQuestion[];
};

export type GeneratedRedFlagRule = {
  symptom: string;
  action_level: 'monitor' | 'contact_prescriber' | 'urgent_care' | 'emergency';
  display_copy: string;
  related_risks: string[];
};

export type GeneratedClinicianReportTemplate = {
  key_metrics: string[];
  relevant_symptoms: string[];
  medication_context_label: string | null;
};

export type GeneratedProtocolExtensions = {
  protocol_timeline: GeneratedProtocolTimelinePhase[];
  dose_cycle_profile: GeneratedDoseCycleProfile | null;
  symptom_playbooks: GeneratedSymptomPlaybook[];
  food_tolerance_rules: GeneratedFoodToleranceRule[];
  checkin_protocol: GeneratedCheckinProtocol | null;
  red_flag_rules: GeneratedRedFlagRule[];
  clinician_report_template: GeneratedClinicianReportTemplate | null;
};

export async function generateDrugProtocolExtensions(
  drug: PipDrugInput,
): Promise<GeneratedProtocolExtensions> {
  const strArray = { type: 'array', items: { type: 'string' } } as const;
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    tools: [
      {
        name: 'set_protocol_extensions',
        description:
          'Draft structured protocol-companion fields (journey timeline, dose-cycle windows, symptom playbooks, contextual food rules, check-in protocol, red-flag rules, clinician report template) for a drug, sourced from its prescribing information / trial data.',
        input_schema: {
          type: 'object' as const,
          properties: {
            protocol_timeline: {
              type: 'array',
              description:
                'Journey-map phases across the standard escalation/maintenance schedule. Educational population typicals, not a prescription. Empty array if no structured schedule exists.',
              items: {
                type: 'object',
                properties: {
                  protocol_label: { type: ['string', 'null'], description: 'e.g. "Standard escalation"' },
                  week_start: { type: 'integer' },
                  week_end: { type: ['integer', 'null'], description: 'Null for an open-ended maintenance phase.' },
                  phase_title: { type: 'string', description: 'e.g. "Starter phase"' },
                  typical_dose_mg: { type: ['number', 'null'] },
                  cadence_days: { type: ['integer', 'null'], description: 'e.g. 7 for weekly, 1 for daily.' },
                  expected_changes: strArray,
                  common_adjustments: strArray,
                  user_focus: strArray,
                },
                required: ['protocol_label', 'week_start', 'week_end', 'phase_title', 'typical_dose_mg', 'cadence_days', 'expected_changes', 'common_adjustments', 'user_focus'],
              },
            },
            dose_cycle_profile: {
              type: ['object', 'null'],
              description:
                'Consolidated "right now" windows for one dose interval, in hours from dosing. Null if the substance has no characterised PK/symptom timing.',
              properties: {
                onset_hours: { type: ['number', 'null'] },
                peak_effect_hours_min: { type: ['number', 'null'] },
                peak_effect_hours_max: { type: ['number', 'null'] },
                appetite_effect_window_min: { type: ['number', 'null'] },
                appetite_effect_window_max: { type: ['number', 'null'] },
                nausea_risk_window_min: { type: ['number', 'null'] },
                nausea_risk_window_max: { type: ['number', 'null'] },
                constipation_risk_window_min: { type: ['number', 'null'] },
                constipation_risk_window_max: { type: ['number', 'null'] },
                coverage_fades_after_hours: { type: ['number', 'null'] },
                notes: { type: ['string', 'null'] },
              },
              required: ['onset_hours', 'peak_effect_hours_min', 'peak_effect_hours_max', 'appetite_effect_window_min', 'appetite_effect_window_max', 'nausea_risk_window_min', 'nausea_risk_window_max', 'constipation_risk_window_min', 'constipation_risk_window_max', 'coverage_fades_after_hours', 'notes'],
            },
            symptom_playbooks: {
              type: 'array',
              description: 'Practical, score-banded playbooks for the dominant symptoms (e.g. Nausea, Constipation). Empty array if none apply.',
              items: {
                type: 'object',
                properties: {
                  symptom: { type: 'string' },
                  bands: {
                    type: 'array',
                    description: 'Severity bands, scored on a 0-10 scale matching the check-in question for this symptom.',
                    items: {
                      type: 'object',
                      properties: {
                        min_score: { type: ['number', 'null'] },
                        max_score: { type: ['number', 'null'] },
                        title: { type: 'string', description: 'e.g. "Mild nausea"' },
                        nutrition_strategy: strArray,
                        hydration_strategy: strArray,
                        avoid: strArray,
                        escalation: { type: ['string', 'null'], description: 'When to seek help; null if no escalation copy for this band.' },
                      },
                      required: ['min_score', 'max_score', 'title', 'nutrition_strategy', 'hydration_strategy', 'avoid', 'escalation'],
                    },
                  },
                },
                required: ['symptom', 'bands'],
              },
            },
            food_tolerance_rules: {
              type: 'array',
              description: 'Context-specific food guidance. Empty array if none apply.',
              items: {
                type: 'object',
                properties: {
                  context: { type: 'string', enum: ['low_appetite', 'nausea', 'constipation', 'reflux', 'diarrhea', 'dose_escalation_week', 'day_before_dose', 'post_dose_peak', 'post_dose_nausea_window'] },
                  prefer: strArray,
                  limit: strArray,
                  avoid: strArray,
                  rationale: { type: ['string', 'null'] },
                },
                required: ['context', 'prefer', 'limit', 'avoid', 'rationale'],
              },
            },
            checkin_protocol: {
              type: ['object', 'null'],
              description: 'What to track and when. Null if no meaningful check-in applies.',
              properties: {
                cadence: { type: 'string', description: 'e.g. "dose_day_plus_2", "daily", "weekly".' },
                notes: { type: ['string', 'null'] },
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question_id: { type: 'string', description: 'stable snake_case key, e.g. "nausea_0_10"' },
                      label: { type: 'string' },
                      type: { type: 'string', description: 'e.g. scale_0_10, decimal, integer, boolean, text' },
                      unit: { type: ['string', 'null'] },
                      condition: { type: ['string', 'null'], description: 'optional gating, e.g. "if_constipation_or_nausea"' },
                      trigger_guidance_from_score: { type: ['number', 'null'] },
                    },
                    required: ['question_id', 'label', 'type', 'unit', 'condition', 'trigger_guidance_from_score'],
                  },
                },
              },
              required: ['cadence', 'notes', 'questions'],
            },
            red_flag_rules: {
              type: 'array',
              description: 'Explicit urgent-escalation rules. Empty array if none apply.',
              items: {
                type: 'object',
                properties: {
                  symptom: { type: 'string' },
                  action_level: { type: 'string', enum: ['monitor', 'contact_prescriber', 'urgent_care', 'emergency'] },
                  display_copy: { type: 'string', description: 'Plain-language copy shown to the user.' },
                  related_risks: strArray,
                },
                required: ['symptom', 'action_level', 'display_copy', 'related_risks'],
              },
            },
            clinician_report_template: {
              type: ['object', 'null'],
              description: 'Report-friendly labels for a "take this to your appointment" export. Null if not applicable.',
              properties: {
                key_metrics: strArray,
                relevant_symptoms: strArray,
                medication_context_label: { type: ['string', 'null'], description: 'e.g. "GLP-1 receptor agonist"' },
              },
              required: ['key_metrics', 'relevant_symptoms', 'medication_context_label'],
            },
          },
          required: ['protocol_timeline', 'dose_cycle_profile', 'symptom_playbooks', 'food_tolerance_rules', 'checkin_protocol', 'red_flag_rules', 'clinician_report_template'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'set_protocol_extensions' },
    messages: [
      {
        role: 'user',
        content: `Draft structured protocol-companion fields for ${drug.name}${drug.generic_name ? ` (${drug.generic_name})` : ''}.

These are STAFF DRAFTS for editorial review against the prescribing information — not final published content. A clinical editor will verify every field before publication.

Drug context:
- Generic: ${drug.generic_name ?? 'N/A'}
- Class: ${drug.drug_class ?? 'N/A'}
- Route: ${drug.administration_route?.replace(/_/g, ' ') ?? 'N/A'}
- Dosing: ${drug.typical_dosing_schedule ?? 'N/A'}
- Mechanism notes: ${drug.mechanism_summary ?? 'N/A'}
- Contraindications notes: ${drug.contraindications ?? 'N/A'}
- Existing PK prose: ${drug.pharmacokinetics_notes ?? 'N/A'}
- Source URLs already cited for this drug:
${drug.source_urls.length > 0 ? drug.source_urls.map((u) => `  - ${u}`).join('\n') : '  (none)'}

Rules:
- All content is population-typical and EDUCATIONAL — never a personalised prescription. Frame timeline doses as "typical".
- For unapproved or investigational substances with no human PK characterisation, set dose_cycle_profile to null and keep arrays minimal or empty.
- Dose-cycle windows are in HOURS from the dose; use [min,max] pairs and null where unknown.
- Symptom playbook bands must be scored on 0-10 and align with the check-in question for that symptom (e.g. nausea_0_10).
- Check-in question_id values are stable snake_case keys; reuse standard ones where possible: nausea_0_10, appetite_0_10, energy_0_10, hydration_l, weight_kg, blood_glucose_mmol.
- Plain language; "your prescriber" not "your doctor"; metric units (mg, mL, kg, L); Australian English spellings where applicable.

STRICTLY NEVER use: cure, guarantee, treat (as a medical claim), reverse diabetes/obesity, diagnose, stop taking, skip a dose, instead of your prescribed medication.`,
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return a valid structured response');
  }

  return toolUse.input as GeneratedProtocolExtensions;
}
