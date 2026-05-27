import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { assertSafeEducationalOutput } from '@/lib/compliance/ai-guardrails';

const bodySchema = z.object({
  peptide_slug: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { peptide_slug } = parsed.data;

  const { data: peptide } = await supabase
    .from('peptides')
    .select('id, name, mechanism_summary, short_description')
    .eq('slug', peptide_slug)
    .maybeSingle();

  if (!peptide) {
    return NextResponse.json({ error: 'Peptide not found' }, { status: 404 });
  }

  const { data: links } = await supabase.from('study_peptides').select('study_id').eq('peptide_id', peptide.id);
  const studyIds = (links ?? []).map((l) => l.study_id);
  const { data: studies } =
    studyIds.length > 0
      ? await supabase.from('studies').select('title, abstract, study_type, publication_date').in('id', studyIds)
      : { data: [] };

  const abstracts = (studies ?? [])
    .map((s) => s.abstract)
    .filter((a): a is string => typeof a === 'string' && a.length > 0);

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  let summaryText: string;
  let evidenceStrength: string;
  let limitationsText: string;

  if (!apiKey) {
    summaryText = `Automated summary unavailable (no OPENAI_API_KEY). Manual placeholder for ${peptide.name}: reviewed ${abstracts.length} abstracts in the index.`;
    evidenceStrength = 'unknown_pipeline_offline';
    limitationsText =
      'Generated without LLM; replace when API credentials are configured. Not a substitute for reading primary sources.';
  } else {
    const studyBlock = abstracts.slice(0, 12).join('\n---\n');
    const prompt = `You summarise peptide research for licensed professionals and researchers in a strictly non-prescriptive way.

Rules:
- Never recommend dosages, cycles, protocols, stacks, or instructions.
- Describe evidence quality and uncertainty.
- Use neutral scientific tone.

Peptide: ${peptide.name}
Mechanism notes: ${peptide.mechanism_summary ?? 'not provided'}
Short description: ${peptide.short_description ?? 'not provided'}

Study abstracts (may be truncated):
${studyBlock || '(no abstracts indexed)'}

Respond as JSON with keys: summary (string), evidence_strength (short snake_case label), limitations (string).`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You output only valid JSON objects with keys summary, evidence_strength, limitations. No markdown fences.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return NextResponse.json({ error: 'OpenAI request failed', detail: errText }, { status: 502 });
    }

    const completion = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = completion.choices?.[0]?.message?.content ?? '{}';

    let parsedJson: { summary?: string; evidence_strength?: string; limitations?: string };
    try {
      parsedJson = JSON.parse(raw) as typeof parsedJson;
    } catch {
      return NextResponse.json({ error: 'Model returned non-JSON' }, { status: 502 });
    }

    summaryText = parsedJson.summary ?? '';
    evidenceStrength = parsedJson.evidence_strength ?? 'unspecified';
    limitationsText = parsedJson.limitations ?? '';

    if (!summaryText) {
      return NextResponse.json({ error: 'Empty summary from model' }, { status: 502 });
    }
  }

  try {
    assertSafeEducationalOutput(summaryText);
    assertSafeEducationalOutput(limitationsText);
  } catch {
    return NextResponse.json({ error: 'Output blocked by compliance guardrails' }, { status: 422 });
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabase.from('ai_summaries').upsert(
    {
      peptide_id: peptide.id,
      summary_text: summaryText,
      evidence_strength: evidenceStrength,
      limitations_text: limitationsText,
      model_name: apiKey ? model : 'offline-placeholder',
      last_generated_at: now,
      guardrail_passed: true,
    },
    { onConflict: 'peptide_id' }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, peptide_id: peptide.id });
}
