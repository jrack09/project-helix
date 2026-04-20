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
