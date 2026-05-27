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
  image_url: z.string().optional(),
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
      image_url: d.image_url ?? null,
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

// ── Guides ─────────────────────────────────────────────────

const newGuideSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
  category: z.enum(['getting_started', 'administration', 'nutrition', 'side_effects', 'lifestyle', 'other']),
});

export async function createGuide(formData: FormData) {
  const { supabase } = await requireEditor();
  const parsed = newGuideSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('guides')
    .insert({ title: d.title, slug: d.slug, category: d.category, publication_status: 'draft' })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, { action: 'guide.created', entity_type: 'guide', entity_id: data.id });
  redirect(`/admin/guides/${data.id}/edit`);
}

const saveGuideSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  subtitle: z.string().optional(),
  body_markdown: z.string().optional(),
  category: z.enum(['getting_started', 'administration', 'nutrition', 'side_effects', 'lifestyle', 'other']),
  cover_emoji: z.string().optional(),
  ordinal: z.coerce.number().optional(),
});

export async function saveGuide(formData: FormData) {
  const { user, supabase } = await requireEditor();
  const parsed = saveGuideSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  if (d.body_markdown) assertComplianceSafe(d.body_markdown, 'body');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('guides').update({
    title: d.title,
    slug: d.slug,
    subtitle: d.subtitle ?? null,
    body_markdown: d.body_markdown ?? '',
    category: d.category,
    cover_emoji: d.cover_emoji ?? null,
    ordinal: d.ordinal ?? 0,
    updated_at: new Date().toISOString(),
  }).eq('id', d.id);

  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, { action: 'guide.updated', entity_type: 'guide', entity_id: d.id });
  revalidatePath(`/admin/guides/${d.id}/edit`);
  revalidatePath('/guides');
}

export async function publishGuide(guideId: string) {
  const { user, supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();

  const { data: guide } = await admin.from('guides').select('body_markdown, title, subtitle').eq('id', guideId).single();
  if (guide?.body_markdown) assertComplianceSafe(guide.body_markdown, 'body');
  if (guide?.subtitle) assertComplianceSafe(guide.subtitle, 'subtitle');

  const { error } = await admin.from('guides').update({
    publication_status: 'published',
    updated_at: new Date().toISOString(),
  }).eq('id', guideId);
  if (error) throw new Error(error.message);

  await admin.from('content_reviews').insert({
    entity_type: 'guide',
    entity_id: guideId,
    reviewer_id: user.id,
    action: 'approved',
    notes: 'Published via admin CMS',
  });

  await writeAuditLog(supabase, { action: 'guide.published', entity_type: 'guide', entity_id: guideId });
  revalidatePath('/admin/guides');
  revalidatePath('/guides');
  redirect('/admin/guides');
}

// ── AI content generation ──────────────────────────────────

export async function generateDrugContentAction(drugId: string) {
  const { user, supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();

  const { data: drug } = await admin
    .from('peptides')
    .select('name, generic_name, drug_class, administration_route, typical_dosing_schedule, short_description')
    .eq('id', drugId)
    .single();
  if (!drug) throw new Error('Drug not found');

  const { generateDrugContent } = await import('@/lib/ai/drug-content-generator');
  const content = await generateDrugContent(drug);

  await Promise.all([
    admin.from('drug_expectations').insert(
      content.expectations.map((e) => ({
        drug_id: drugId,
        week_number: e.week_number,
        milestone: e.milestone,
        description: e.description,
        is_common: e.is_common,
      }))
    ),
    admin.from('drug_food_guidance').insert(
      content.food_guidance.map((f, i) => ({
        drug_id: drugId,
        category: f.category,
        item: f.item,
        rationale: f.rationale,
        evidence_level: f.evidence_level,
        ordinal: i,
      }))
    ),
    admin.from('drug_tips').insert(
      content.tips.map((t, i) => ({
        drug_id: drugId,
        category: t.category,
        title: t.title,
        body_markdown: t.body_markdown,
        ordinal: i,
      }))
    ),
  ]);

  await writeAuditLog(supabase, { action: 'drug.ai_content_generated', entity_type: 'drug', entity_id: drugId });
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

export async function clearAndRegenerateDrugContent(drugId: string) {
  const { user, supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();

  // Clear existing companion content
  await Promise.all([
    admin.from('drug_expectations').delete().eq('drug_id', drugId),
    admin.from('drug_food_guidance').delete().eq('drug_id', drugId),
    admin.from('drug_tips').delete().eq('drug_id', drugId),
  ]);

  // Re-run generation (reuses same logic)
  await generateDrugContentAction(drugId);
  await writeAuditLog(supabase, { action: 'drug.ai_content_regenerated', entity_type: 'drug', entity_id: drugId });
}

export async function archiveGuide(guideId: string) {
  const { user, supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('guides').update({ publication_status: 'archived', updated_at: new Date().toISOString() }).eq('id', guideId);
  await writeAuditLog(supabase, { action: 'guide.archived', entity_type: 'guide', entity_id: guideId });
  revalidatePath(`/admin/guides/${guideId}/edit`);
  revalidatePath('/admin/guides');
}

// ── Drug pharmacokinetics (numeric) ────────────────────────

const drugPharmacokineticsSchema = z.object({
  id: z.string().uuid(),
  half_life_hours: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  tmax_hours: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  duration_of_action_hours: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
});

function toNumOrNull(v: number | '' | undefined) {
  return typeof v === 'number' ? v : null;
}

export async function saveDrugPharmacokinetics(formData: FormData) {
  const { supabase } = await requireEditor();
  const parsed = drugPharmacokineticsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('peptides')
    .update({
      half_life_hours: toNumOrNull(d.half_life_hours),
      tmax_hours: toNumOrNull(d.tmax_hours),
      duration_of_action_hours: toNumOrNull(d.duration_of_action_hours),
      updated_at: new Date().toISOString(),
    })
    .eq('id', d.id);
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, { action: 'drug.pk_updated', entity_type: 'drug', entity_id: d.id });
  revalidatePath(`/admin/drugs/${d.id}/edit`);
}

// ── Drug warnings (+ red-flag toggle) ──────────────────────

const warningSchema = z.object({
  drug_id: z.string().uuid(),
  severity: z.enum(['info', 'caution', 'urgent', 'boxed_warning']),
  title: z.string().min(1),
  body: z.string().min(1),
  is_red_flag: z.coerce.boolean().optional(),
});

export async function addWarning(formData: FormData) {
  await requireEditor();
  const parsed = warningSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  assertComplianceSafe(d.body, 'body');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_warnings').insert({
    drug_id: d.drug_id,
    severity: d.severity,
    title: d.title,
    body: d.body,
    is_red_flag: d.is_red_flag ?? false,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function toggleWarningRedFlag(id: string, drugId: string, value: boolean) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_warnings').update({ is_red_flag: value, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

export async function deleteWarning(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_warnings').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Injection sites ────────────────────────────────────────

const injectionSiteSchema = z.object({
  drug_id: z.string().uuid(),
  site: z.enum(['abdomen', 'thigh', 'upper_arm', 'buttock', 'other']),
  preferred: z.coerce.boolean().optional(),
  rotation_guidance: z.string().optional(),
  avoid_notes: z.string().optional(),
});

export async function addInjectionSite(formData: FormData) {
  await requireEditor();
  const parsed = injectionSiteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_injection_sites').insert({
    drug_id: d.drug_id,
    site: d.site,
    preferred: d.preferred ?? false,
    rotation_guidance: d.rotation_guidance ?? null,
    avoid_notes: d.avoid_notes ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteInjectionSite(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_injection_sites').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Side-effect windows ────────────────────────────────────

const sideEffectWindowSchema = z.object({
  drug_id: z.string().uuid(),
  side_effect_id: z.string().uuid().optional().or(z.literal('')),
  effect: z.string().min(1),
  onset_hours_min: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  onset_hours_max: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  peak_hours_min: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  peak_hours_max: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  resolution_days_typical: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  notes: z.string().optional(),
});

export async function addSideEffectWindow(formData: FormData) {
  await requireEditor();
  const parsed = sideEffectWindowSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  if (d.notes) assertComplianceSafe(d.notes, 'notes');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_side_effect_windows').insert({
    drug_id: d.drug_id,
    side_effect_id: d.side_effect_id && d.side_effect_id !== '' ? d.side_effect_id : null,
    effect: d.effect,
    onset_hours_min: toNumOrNull(d.onset_hours_min),
    onset_hours_max: toNumOrNull(d.onset_hours_max),
    peak_hours_min: toNumOrNull(d.peak_hours_min),
    peak_hours_max: toNumOrNull(d.peak_hours_max),
    resolution_days_typical: toNumOrNull(d.resolution_days_typical),
    notes: d.notes ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteSideEffectWindow(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_side_effect_windows').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Oral administration ────────────────────────────────────

const oralAdminSchema = z.object({
  drug_id: z.string().uuid(),
  formulation: z.string().min(1),
  with_water_ml: z.union([z.coerce.number().int().nonnegative(), z.literal('')]).optional(),
  swallow_whole: z.coerce.boolean().optional(),
  time_of_day: z.string().optional(),
  fasting_window_before_min: z.union([z.coerce.number().int().nonnegative(), z.literal('')]).optional(),
  fasting_window_after_min: z.union([z.coerce.number().int().nonnegative(), z.literal('')]).optional(),
  interaction_notes: z.string().optional(),
});

export async function addOralAdministration(formData: FormData) {
  await requireEditor();
  const parsed = oralAdminSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  if (d.interaction_notes) assertComplianceSafe(d.interaction_notes, 'interaction_notes');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_oral_administration').insert({
    drug_id: d.drug_id,
    formulation: d.formulation,
    with_water_ml: toNumOrNull(d.with_water_ml),
    swallow_whole: d.swallow_whole ?? false,
    time_of_day: d.time_of_day ?? null,
    fasting_window_before_min: toNumOrNull(d.fasting_window_before_min),
    fasting_window_after_min: toNumOrNull(d.fasting_window_after_min),
    interaction_notes: d.interaction_notes ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteOralAdministration(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_oral_administration').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── AI: draft PIP extension fields (preview → approve flow) ─

import type { GeneratedPipExtensions } from '@/lib/ai/drug-content-generator';
import type { Json } from '@/types/database';

export type PipDraftDedup = {
  pk: { half_life_will_fill: boolean; tmax_will_fill: boolean; duration_will_fill: boolean };
  warnings_duplicate: boolean[];
  missed_dose_rules_duplicate: boolean[];
  injection_sites_duplicate: boolean[];
  side_effect_windows_duplicate: boolean[];
};

export type PipDraftResult = {
  drug_id: string;
  draft: GeneratedPipExtensions;
  dedup: PipDraftDedup;
};

async function loadDedup(drugId: string, draft: GeneratedPipExtensions): Promise<PipDraftDedup> {
  const admin = createAdminSupabaseClient();
  const [current, ws, md, sites, sew] = await Promise.all([
    admin.from('peptides').select('half_life_hours, tmax_hours, duration_of_action_hours').eq('id', drugId).single(),
    admin.from('drug_warnings').select('title').eq('drug_id', drugId),
    admin.from('drug_missed_dose_rules').select('instruction').eq('drug_id', drugId),
    admin.from('drug_injection_sites').select('site').eq('drug_id', drugId),
    admin.from('drug_side_effect_windows').select('effect').eq('drug_id', drugId),
  ]);

  const warningTitles = new Set((ws.data ?? []).map((w) => w.title.toLowerCase()));
  const mdInstructions = new Set((md.data ?? []).map((r) => r.instruction.toLowerCase()));
  const existingSites = new Set((sites.data ?? []).map((s) => s.site));
  const existingWindows = new Set((sew.data ?? []).map((w) => w.effect.toLowerCase()));

  return {
    pk: {
      half_life_will_fill: current.data?.half_life_hours == null && draft.pharmacokinetics.half_life_hours != null,
      tmax_will_fill: current.data?.tmax_hours == null && draft.pharmacokinetics.tmax_hours != null,
      duration_will_fill: current.data?.duration_of_action_hours == null && draft.pharmacokinetics.duration_of_action_hours != null,
    },
    warnings_duplicate: draft.warnings.map((w) => warningTitles.has(w.title.toLowerCase())),
    missed_dose_rules_duplicate: draft.missed_dose_rules.map((r) => mdInstructions.has(r.instruction.toLowerCase())),
    injection_sites_duplicate: draft.injection_sites.map((s) => existingSites.has(s.site)),
    side_effect_windows_duplicate: draft.side_effect_windows.map((w) => existingWindows.has(w.effect.toLowerCase())),
  };
}

export async function draftPipExtensionsAction(drugId: string): Promise<PipDraftResult> {
  await requireEditor();
  const admin = createAdminSupabaseClient();

  const { data: drug } = await admin
    .from('peptides')
    .select('name, generic_name, drug_class, administration_route, typical_dosing_schedule, short_description, mechanism_summary, contraindications, pharmacokinetics')
    .eq('id', drugId)
    .single();
  if (!drug) throw new Error('Drug not found');

  const { data: sources } = await admin
    .from('drug_sources')
    .select('url')
    .eq('drug_id', drugId)
    .not('url', 'is', null);

  const pkNotes =
    drug.pharmacokinetics && typeof drug.pharmacokinetics === 'object' && !Array.isArray(drug.pharmacokinetics)
      ? Object.entries(drug.pharmacokinetics as Record<string, unknown>)
          .filter(([, v]) => typeof v === 'string' && v)
          .map(([k, v]) => `${k}: ${v as string}`)
          .join(' | ')
      : null;

  const { generateDrugPipExtensions } = await import('@/lib/ai/drug-content-generator');
  const draft = await generateDrugPipExtensions({
    name: drug.name,
    generic_name: drug.generic_name,
    drug_class: drug.drug_class,
    administration_route: drug.administration_route,
    typical_dosing_schedule: drug.typical_dosing_schedule,
    short_description: drug.short_description,
    mechanism_summary: drug.mechanism_summary,
    contraindications: drug.contraindications,
    pharmacokinetics_notes: pkNotes,
    source_urls: (sources ?? []).map((s) => s.url).filter((u): u is string => !!u),
  });

  const dedup = await loadDedup(drugId, draft);

  return { drug_id: drugId, draft, dedup };
}

export type BatchPipResult = {
  drug_id: string;
  slug: string;
  name: string;
  status: 'ok' | 'skipped' | 'error';
  inserted?: {
    pk_fields_filled: number;
    warnings: number;
    missed_dose_rules: number;
    injection_sites: number;
    side_effect_windows: number;
    oral_administration: number;
  };
  error?: string;
};

export async function batchPipExtensionsAction(opts: { dryRun: boolean; publishedOnly: boolean }) {
  const { supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();

  let q = admin
    .from('peptides')
    .select('id, slug, name, publication_status')
    .order('name', { ascending: true });
  if (opts.publishedOnly) q = q.eq('publication_status', 'published');

  const { data: drugs } = await q;
  const results: BatchPipResult[] = [];

  for (const drug of drugs ?? []) {
    try {
      const draftResult = await draftPipExtensionsAction(drug.id);
      const d = draftResult.dedup;
      const wouldInsert = {
        pk_fields_filled:
          (d.pk.half_life_will_fill ? 1 : 0) +
          (d.pk.tmax_will_fill ? 1 : 0) +
          (d.pk.duration_will_fill ? 1 : 0),
        warnings: d.warnings_duplicate.filter((b) => !b).length,
        missed_dose_rules: d.missed_dose_rules_duplicate.filter((b) => !b).length,
        injection_sites: d.injection_sites_duplicate.filter((b) => !b).length,
        side_effect_windows: d.side_effect_windows_duplicate.filter((b) => !b).length,
        oral_administration: draftResult.draft.oral_administration.length,
      };
      const total = Object.values(wouldInsert).reduce((a, b) => a + b, 0);

      if (total === 0) {
        results.push({ drug_id: drug.id, slug: drug.slug, name: drug.name, status: 'skipped', inserted: wouldInsert });
        continue;
      }

      if (opts.dryRun) {
        results.push({ drug_id: drug.id, slug: drug.slug, name: drug.name, status: 'ok', inserted: wouldInsert });
      } else {
        const accepted = await acceptPipExtensionsDraftAction(drug.id, draftResult.draft);
        results.push({ drug_id: drug.id, slug: drug.slug, name: drug.name, status: 'ok', inserted: accepted.inserted });
      }
    } catch (e) {
      results.push({
        drug_id: drug.id, slug: drug.slug, name: drug.name,
        status: 'error', error: (e as Error).message,
      });
    }
  }

  if (!opts.dryRun) {
    await writeAuditLog(supabase, {
      action: 'drug.pip_extensions_batch_accepted',
      entity_type: 'drug',
      entity_id: null,
      meta: { results: results as unknown as Json },
    });
    revalidatePath('/admin/drugs/coverage');
  }

  return results;
}

export async function acceptPipExtensionsDraftAction(drugId: string, draft: GeneratedPipExtensions) {
  const { supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();

  // Re-run dedup at insert time — preview state may be stale.
  const dedup = await loadDedup(drugId, draft);

  // 1. Numeric PK
  const pkPatch: Record<string, number> = {};
  if (dedup.pk.half_life_will_fill && draft.pharmacokinetics.half_life_hours != null) {
    pkPatch.half_life_hours = draft.pharmacokinetics.half_life_hours;
  }
  if (dedup.pk.tmax_will_fill && draft.pharmacokinetics.tmax_hours != null) {
    pkPatch.tmax_hours = draft.pharmacokinetics.tmax_hours;
  }
  if (dedup.pk.duration_will_fill && draft.pharmacokinetics.duration_of_action_hours != null) {
    pkPatch.duration_of_action_hours = draft.pharmacokinetics.duration_of_action_hours;
  }
  if (Object.keys(pkPatch).length > 0) {
    await admin.from('peptides').update({ ...pkPatch, updated_at: new Date().toISOString() }).eq('id', drugId);
  }

  const newWarnings = draft.warnings
    .map((w, i) => ({ w, i }))
    .filter(({ i }) => !dedup.warnings_duplicate[i])
    .map(({ w, i }) => ({
      drug_id: drugId, severity: w.severity, title: w.title, body: w.body,
      is_red_flag: w.is_red_flag, ordinal: 100 + i,
    }));
  if (newWarnings.length > 0) await admin.from('drug_warnings').insert(newWarnings);

  const newMd = draft.missed_dose_rules
    .map((r, i) => ({ r, i }))
    .filter(({ i }) => !dedup.missed_dose_rules_duplicate[i])
    .map(({ r, i }) => ({
      drug_id: drugId, formulation: r.formulation, max_delay_hours: r.max_delay_hours,
      instruction: r.instruction, restart_guidance: r.restart_guidance, ordinal: 100 + i,
    }));
  if (newMd.length > 0) await admin.from('drug_missed_dose_rules').insert(newMd);

  const newSites = draft.injection_sites
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => !dedup.injection_sites_duplicate[i])
    .map(({ s, i }) => ({
      drug_id: drugId, site: s.site, preferred: s.preferred,
      rotation_guidance: s.rotation_guidance, avoid_notes: s.avoid_notes, ordinal: i,
    }));
  if (newSites.length > 0) await admin.from('drug_injection_sites').insert(newSites);

  const { data: drugSideEffects } = await admin.from('side_effects').select('id, effect').eq('peptide_id', drugId);
  const sideEffectLookup = new Map(
    (drugSideEffects ?? []).map((se) => [se.effect.toLowerCase(), se.id] as const),
  );
  const newWindows = draft.side_effect_windows
    .map((w, i) => ({ w, i }))
    .filter(({ i }) => !dedup.side_effect_windows_duplicate[i])
    .map(({ w, i }) => ({
      drug_id: drugId,
      side_effect_id: sideEffectLookup.get(w.effect.toLowerCase()) ?? null,
      effect: w.effect,
      onset_hours_min: w.onset_hours_min, onset_hours_max: w.onset_hours_max,
      peak_hours_min: w.peak_hours_min, peak_hours_max: w.peak_hours_max,
      resolution_days_typical: w.resolution_days_typical, notes: w.notes,
      ordinal: 100 + i,
    }));
  if (newWindows.length > 0) await admin.from('drug_side_effect_windows').insert(newWindows);

  const newOral = draft.oral_administration.map((o, i) => ({
    drug_id: drugId,
    formulation: o.formulation,
    with_water_ml: o.with_water_ml,
    swallow_whole: o.swallow_whole,
    time_of_day: o.time_of_day,
    fasting_window_before_min: o.fasting_window_before_min,
    fasting_window_after_min: o.fasting_window_after_min,
    interaction_notes: o.interaction_notes,
    ordinal: i,
  }));
  if (newOral.length > 0) await admin.from('drug_oral_administration').insert(newOral);

  await writeAuditLog(supabase, { action: 'drug.pip_extensions_accepted', entity_type: 'drug', entity_id: drugId });
  revalidatePath(`/admin/drugs/${drugId}/edit`);

  return {
    inserted: {
      pk_fields_filled: Object.keys(pkPatch).length,
      warnings: newWarnings.length,
      missed_dose_rules: newMd.length,
      injection_sites: newSites.length,
      side_effect_windows: newWindows.length,
      oral_administration: newOral.length,
    },
  };
}
