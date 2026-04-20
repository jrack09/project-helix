import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/database';

const payloadSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  short_description: z.string().optional().nullable(),
  mechanism_summary: z.string().optional().nullable(),
  receptor_targets: z.array(z.string()).optional(),
  evidence_score: z.number().min(0).max(100).optional().nullable(),
  status_label: z.string().optional(),
  is_visible: z.boolean().optional(),
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

  const p = parsed.data;
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from('peptides')
    .upsert(
      {
        slug: p.slug,
        name: p.name,
        aliases: (p.aliases ?? []) as unknown as Json,
        short_description: p.short_description ?? null,
        mechanism_summary: p.mechanism_summary ?? null,
        receptor_targets: (p.receptor_targets ?? []) as unknown as Json,
        evidence_score: p.evidence_score ?? null,
        status_label: p.status_label ?? 'investigational',
        is_visible: p.is_visible ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Upsert failed' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
