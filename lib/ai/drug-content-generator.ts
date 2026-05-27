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
