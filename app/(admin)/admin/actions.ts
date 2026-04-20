'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { assertComplianceSafe } from '@/lib/compliance/ai-guardrails';
import { writeAuditLog } from '@/lib/audit/log';

async function requireEditor() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['editor', 'admin'].includes(profile.role)) {
    throw new Error('Forbidden');
  }
  return { user, supabase };
}

// ── Drug overview ──────────────────────────────────────────

const drugOverviewSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
  generic_name: z.string().optional(),
  brand_names: z.string().optional(),
  drug_class: z.string().optional(),
  administration_route: z.string().optional(),
  typical_dosing_schedule: z.string().optional(),
  short_description: z.string().optional(),
  mechanism_summary: z.string().optional(),
  evidence_score: z.coerce.number().min(0).max(100).optional(),
  status_label: z.string().optional(),
  prescription_required: z.coerce.boolean().optional(),
});

export async function saveDrugOverview(formData: FormData) {
  const { user, supabase } = await requireEditor();
  const raw = Object.fromEntries(formData.entries());
  const parsed = drugOverviewSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const complianceFields = [d.mechanism_summary, d.short_description, d.typical_dosing_schedule];
  for (const text of complianceFields) {
    if (text) assertComplianceSafe(text);
  }

  let brandNames: string[];
  try {
    brandNames = JSON.parse(d.brand_names ?? '[]');
  } catch {
    brandNames = (d.brand_names ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('peptides')
    .update({
      name: d.name,
      slug: d.slug,
      generic_name: d.generic_name ?? null,
      brand_names: brandNames,
      drug_class: d.drug_class ?? null,
      administration_route: d.administration_route ?? null,
      typical_dosing_schedule: d.typical_dosing_schedule ?? null,
      short_description: d.short_description ?? null,
      mechanism_summary: d.mechanism_summary ?? null,
      evidence_score: d.evidence_score ?? null,
      status_label: d.status_label ?? 'investigational',
      prescription_required: d.prescription_required ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', d.id);

  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, { action: 'drug.updated', entity_type: 'drug', entity_id: d.id });
  revalidatePath(`/admin/drugs/${d.id}/edit`);
}

// ── Create new drug ────────────────────────────────────────

const newDrugSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  drug_class: z.string().optional(),
});

export async function createDrug(formData: FormData) {
  const { supabase } = await requireEditor();
  const parsed = newDrugSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('peptides')
    .insert({
      name: d.name,
      slug: d.slug,
      drug_class: d.drug_class ?? null,
      publication_status: 'draft',
      is_visible: true,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, { action: 'drug.created', entity_type: 'drug', entity_id: data.id });
  redirect(`/admin/drugs/${data.id}/edit`);
}

// ── Expectations ───────────────────────────────────────────

const expectationSchema = z.object({
  drug_id: z.string().uuid(),
  week_number: z.coerce.number().min(0),
  milestone: z.string().min(1),
  description: z.string().min(1),
  is_common: z.coerce.boolean().optional(),
});

export async function addExpectation(formData: FormData) {
  await requireEditor();
  const parsed = expectationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  assertComplianceSafe(d.description, 'description');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_expectations').insert({
    drug_id: d.drug_id, week_number: d.week_number, milestone: d.milestone,
    description: d.description, is_common: d.is_common ?? true,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteExpectation(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_expectations').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Food guidance ──────────────────────────────────────────

const foodGuidanceSchema = z.object({
  drug_id: z.string().uuid(),
  category: z.enum(['prefer', 'limit', 'avoid', 'hydrate']),
  item: z.string().min(1),
  rationale: z.string().optional(),
  evidence_level: z.enum(['anecdotal', 'editorial', 'study_backed']).optional(),
});

export async function addFoodGuidance(formData: FormData) {
  await requireEditor();
  const parsed = foodGuidanceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  if (d.rationale) assertComplianceSafe(d.rationale, 'rationale');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_food_guidance').insert({
    drug_id: d.drug_id, category: d.category, item: d.item,
    rationale: d.rationale ?? null, evidence_level: d.evidence_level ?? 'editorial',
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteFoodGuidance(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_food_guidance').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Tips ───────────────────────────────────────────────────

const tipSchema = z.object({
  drug_id: z.string().uuid(),
  category: z.enum(['administration', 'timing', 'mindset', 'exercise', 'sleep', 'hydration', 'nutrition', 'other']),
  title: z.string().min(1),
  body_markdown: z.string().min(1),
  ordinal: z.coerce.number().optional(),
});

export async function addTip(formData: FormData) {
  await requireEditor();
  const parsed = tipSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  assertComplianceSafe(d.body_markdown, 'body');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_tips').insert({
    drug_id: d.drug_id, category: d.category, title: d.title,
    body_markdown: d.body_markdown, ordinal: d.ordinal ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteTip(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_tips').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Publish ────────────────────────────────────────────────

export async function publishDrug(drugId: string) {
  const { user, supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();

  // Fetch all text fields for compliance lint
  const [{ data: drug }, { data: expectations }, { data: tips }, { data: food }] = await Promise.all([
    admin.from('peptides').select('name, mechanism_summary, short_description, typical_dosing_schedule').eq('id', drugId).single(),
    admin.from('drug_expectations').select('description').eq('drug_id', drugId),
    admin.from('drug_tips').select('body_markdown, title').eq('drug_id', drugId),
    admin.from('drug_food_guidance').select('rationale').eq('drug_id', drugId),
  ]);

  const textFields: { text: string; field: string }[] = [
    { text: drug?.mechanism_summary ?? '', field: 'mechanism_summary' },
    { text: drug?.short_description ?? '', field: 'short_description' },
    { text: drug?.typical_dosing_schedule ?? '', field: 'typical_dosing_schedule' },
    ...(expectations ?? []).map((e) => ({ text: e.description, field: 'expectation.description' })),
    ...(tips ?? []).flatMap((t) => [
      { text: t.body_markdown, field: 'tip.body' },
      { text: t.title, field: 'tip.title' },
    ]),
    ...(food ?? []).map((f) => ({ text: f.rationale ?? '', field: 'food.rationale' })),
  ];

  for (const { text, field } of textFields) {
    if (text) assertComplianceSafe(text, field);
  }

  const { error } = await admin
    .from('peptides')
    .update({ publication_status: 'published', updated_at: new Date().toISOString() })
    .eq('id', drugId);

  if (error) throw new Error(error.message);

  await admin.from('content_reviews').insert({
    entity_type: 'drug',
    entity_id: drugId,
    reviewer_id: user.id,
    action: 'approved',
    notes: 'Published via admin CMS',
  });

  await writeAuditLog(supabase, { action: 'drug.published', entity_type: 'drug', entity_id: drugId });
  revalidatePath(`/admin/drugs/${drugId}/edit`);
  revalidatePath('/admin/drugs');
  revalidatePath('/peptides');
}

export async function archiveDrug(drugId: string) {
  const { user, supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('peptides').update({ publication_status: 'archived', updated_at: new Date().toISOString() }).eq('id', drugId);
  await writeAuditLog(supabase, { action: 'drug.archived', entity_type: 'drug', entity_id: drugId });
  revalidatePath(`/admin/drugs/${drugId}/edit`);
  revalidatePath('/admin/drugs');
}
