import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const payloadSchema = z.object({
  title: z.string().min(1),
  journal: z.string().optional().nullable(),
  publication_date: z.string().optional().nullable(),
  study_type: z.enum(['human', 'animal', 'in_vitro', 'review', 'meta_analysis']),
  sample_size: z.number().optional().nullable(),
  population: z.string().optional().nullable(),
  source_url: z.string().url(),
  doi: z.string().optional().nullable(),
  abstract: z.string().optional().nullable(),
  peptide_slug: z.string().optional(),
});

export async function POST(request: Request) {
  const secret = request.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const admin = createAdminSupabaseClient();

  const { data: study, error } = await admin
    .from('studies')
    .insert({
      title: payload.title,
      journal: payload.journal ?? null,
      publication_date: payload.publication_date ?? null,
      study_type: payload.study_type,
      sample_size: payload.sample_size ?? null,
      population: payload.population ?? null,
      source_url: payload.source_url,
      doi: payload.doi ?? null,
      abstract: payload.abstract ?? null,
    })
    .select('id')
    .single();

  if (error || !study) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });
  }

  if (payload.peptide_slug) {
    const { data: pep } = await admin.from('peptides').select('id').eq('slug', payload.peptide_slug).maybeSingle();
    if (pep) {
      await admin.from('study_peptides').insert({ peptide_id: pep.id, study_id: study.id });
    }
  }

  return NextResponse.json({ id: study.id });
}
