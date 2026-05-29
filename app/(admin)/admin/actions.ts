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

// Split a textarea value into a clean string[] (one item per non-empty line).
function toStrArray(v: string | undefined | null): string[] {
  if (!v) return [];
  return v
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
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

import type { GeneratedPipExtensions, GeneratedProtocolExtensions } from '@/lib/ai/drug-content-generator';
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

// ────────────────────────────────────────────────────────────
// Protocol-companion AI generation + accept
// ────────────────────────────────────────────────────────────

export type ProtocolDraftResult = {
  drug_id: string;
  draft: GeneratedProtocolExtensions;
};

export async function draftProtocolExtensionsAction(drugId: string): Promise<ProtocolDraftResult> {
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

  const { generateDrugProtocolExtensions } = await import('@/lib/ai/drug-content-generator');
  const draft = await generateDrugProtocolExtensions({
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

  return { drug_id: drugId, draft };
}

// Clean-replace accept: the protocol blocks are curated as a unit, so we
// clear this drug's existing rows then insert the draft. 1:1 tables upsert
// on drug_id. Child rows (bands, questions) cascade from their parents.
export async function acceptProtocolExtensionsDraftAction(
  drugId: string,
  draft: GeneratedProtocolExtensions,
) {
  const { supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();

  // 1. Protocol timeline (replace)
  await admin.from('drug_protocol_timeline').delete().eq('drug_id', drugId);
  if (draft.protocol_timeline.length > 0) {
    await admin.from('drug_protocol_timeline').insert(
      draft.protocol_timeline.map((p, i) => ({
        drug_id: drugId,
        protocol_label: p.protocol_label,
        week_start: p.week_start,
        week_end: p.week_end,
        phase_title: p.phase_title,
        typical_dose_mg: p.typical_dose_mg,
        cadence_days: p.cadence_days,
        expected_changes: p.expected_changes,
        common_adjustments: p.common_adjustments,
        user_focus: p.user_focus,
        ordinal: i,
      })),
    );
  }

  // 2. Dose-cycle profile (1:1 upsert)
  if (draft.dose_cycle_profile) {
    const c = draft.dose_cycle_profile;
    await admin
      .from('drug_dose_cycle_profile')
      .upsert(
        {
          drug_id: drugId,
          onset_hours: c.onset_hours,
          peak_effect_hours_min: c.peak_effect_hours_min,
          peak_effect_hours_max: c.peak_effect_hours_max,
          appetite_effect_window_min: c.appetite_effect_window_min,
          appetite_effect_window_max: c.appetite_effect_window_max,
          nausea_risk_window_min: c.nausea_risk_window_min,
          nausea_risk_window_max: c.nausea_risk_window_max,
          constipation_risk_window_min: c.constipation_risk_window_min,
          constipation_risk_window_max: c.constipation_risk_window_max,
          coverage_fades_after_hours: c.coverage_fades_after_hours,
          notes: c.notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'drug_id' },
      );
  }

  // 3. Symptom playbooks + bands (replace)
  await admin.from('drug_symptom_playbooks').delete().eq('drug_id', drugId);
  const { data: drugSideEffects } = await admin.from('side_effects').select('id, effect').eq('peptide_id', drugId);
  const seLookup = new Map((drugSideEffects ?? []).map((se) => [se.effect.toLowerCase(), se.id] as const));
  for (const [i, pb] of draft.symptom_playbooks.entries()) {
    const { data: inserted } = await admin
      .from('drug_symptom_playbooks')
      .insert({
        drug_id: drugId,
        symptom: pb.symptom,
        side_effect_id: seLookup.get(pb.symptom.toLowerCase()) ?? null,
        ordinal: i,
      })
      .select('id')
      .single();
    if (inserted && pb.bands.length > 0) {
      await admin.from('drug_symptom_playbook_bands').insert(
        pb.bands.map((b, j) => ({
          playbook_id: inserted.id,
          min_score: b.min_score,
          max_score: b.max_score,
          title: b.title,
          nutrition_strategy: b.nutrition_strategy,
          hydration_strategy: b.hydration_strategy,
          avoid: b.avoid,
          escalation: b.escalation,
          ordinal: j,
        })),
      );
    }
  }

  // 4. Food tolerance rules (replace)
  await admin.from('drug_food_tolerance_rules').delete().eq('drug_id', drugId);
  if (draft.food_tolerance_rules.length > 0) {
    await admin.from('drug_food_tolerance_rules').insert(
      draft.food_tolerance_rules.map((r, i) => ({
        drug_id: drugId,
        context: r.context,
        prefer: r.prefer,
        limit: r.limit,
        avoid: r.avoid,
        rationale: r.rationale,
        ordinal: i,
      })),
    );
  }

  // 5. Check-in protocol + questions (replace; questions cascade)
  await admin.from('drug_checkin_protocol').delete().eq('drug_id', drugId);
  if (draft.checkin_protocol) {
    const { data: cp } = await admin
      .from('drug_checkin_protocol')
      .insert({ drug_id: drugId, cadence: draft.checkin_protocol.cadence, notes: draft.checkin_protocol.notes })
      .select('id')
      .single();
    if (cp && draft.checkin_protocol.questions.length > 0) {
      await admin.from('drug_checkin_questions').insert(
        draft.checkin_protocol.questions.map((q, i) => ({
          protocol_id: cp.id,
          question_id: q.question_id,
          label: q.label,
          type: q.type,
          unit: q.unit,
          condition: q.condition,
          trigger_guidance_from_score: q.trigger_guidance_from_score,
          ordinal: i,
        })),
      );
    }
  }

  // 6. Red-flag rules (replace)
  await admin.from('drug_red_flag_rules').delete().eq('drug_id', drugId);
  if (draft.red_flag_rules.length > 0) {
    await admin.from('drug_red_flag_rules').insert(
      draft.red_flag_rules.map((r, i) => ({
        drug_id: drugId,
        symptom: r.symptom,
        action_level: r.action_level,
        display_copy: r.display_copy,
        related_risks: r.related_risks,
        ordinal: i,
      })),
    );
  }

  // 7. Clinician report template (1:1 upsert)
  if (draft.clinician_report_template) {
    const t = draft.clinician_report_template;
    await admin.from('drug_clinician_report_template').upsert(
      {
        drug_id: drugId,
        key_metrics: t.key_metrics,
        relevant_symptoms: t.relevant_symptoms,
        medication_context_label: t.medication_context_label,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'drug_id' },
    );
  }

  await writeAuditLog(supabase, { action: 'drug.protocol_extensions_accepted', entity_type: 'drug', entity_id: drugId });
  revalidatePath(`/admin/drugs/${drugId}/edit`);

  return {
    inserted: {
      protocol_timeline: draft.protocol_timeline.length,
      dose_cycle_profile: draft.dose_cycle_profile ? 1 : 0,
      symptom_playbooks: draft.symptom_playbooks.length,
      food_tolerance_rules: draft.food_tolerance_rules.length,
      checkin_protocol: draft.checkin_protocol ? 1 : 0,
      red_flag_rules: draft.red_flag_rules.length,
      clinician_report_template: draft.clinician_report_template ? 1 : 0,
    },
  };
}

// Convenience one-shot used by the admin edit "Generate protocol companion"
// button: draft then immediately accept.
export async function generateProtocolExtensionsAction(drugId: string) {
  const { draft } = await draftProtocolExtensionsAction(drugId);
  return acceptProtocolExtensionsDraftAction(drugId, draft);
}

// ────────────────────────────────────────────────────────────
// Protocol-companion manual CRUD (admin edit tabs)
// ────────────────────────────────────────────────────────────

// ── Protocol timeline ──────────────────────────────────────

const protocolTimelineSchema = z.object({
  drug_id: z.string().uuid(),
  protocol_label: z.string().optional(),
  week_start: z.coerce.number().int().nonnegative(),
  week_end: z.union([z.coerce.number().int().nonnegative(), z.literal('')]).optional(),
  phase_title: z.string().min(1),
  typical_dose_mg: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  cadence_days: z.union([z.coerce.number().int().positive(), z.literal('')]).optional(),
  expected_changes: z.string().optional(),
  common_adjustments: z.string().optional(),
  user_focus: z.string().optional(),
  ordinal: z.coerce.number().int().optional(),
});

export async function addProtocolTimelinePhase(formData: FormData) {
  await requireEditor();
  const parsed = protocolTimelineSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_protocol_timeline').insert({
    drug_id: d.drug_id,
    protocol_label: d.protocol_label || null,
    week_start: d.week_start,
    week_end: toNumOrNull(d.week_end),
    phase_title: d.phase_title,
    typical_dose_mg: toNumOrNull(d.typical_dose_mg),
    cadence_days: toNumOrNull(d.cadence_days),
    expected_changes: toStrArray(d.expected_changes),
    common_adjustments: toStrArray(d.common_adjustments),
    user_focus: toStrArray(d.user_focus),
    ordinal: d.ordinal ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteProtocolTimelinePhase(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_protocol_timeline').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Dose-cycle profile (1:1 upsert) ────────────────────────

const doseCycleSchema = z.object({
  drug_id: z.string().uuid(),
  onset_hours: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  peak_effect_hours_min: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  peak_effect_hours_max: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  appetite_effect_window_min: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  appetite_effect_window_max: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  nausea_risk_window_min: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  nausea_risk_window_max: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  constipation_risk_window_min: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  constipation_risk_window_max: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  coverage_fades_after_hours: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  notes: z.string().optional(),
});

export async function saveDoseCycleProfile(formData: FormData) {
  await requireEditor();
  const parsed = doseCycleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  if (d.notes) assertComplianceSafe(d.notes, 'notes');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_dose_cycle_profile').upsert(
    {
      drug_id: d.drug_id,
      onset_hours: toNumOrNull(d.onset_hours),
      peak_effect_hours_min: toNumOrNull(d.peak_effect_hours_min),
      peak_effect_hours_max: toNumOrNull(d.peak_effect_hours_max),
      appetite_effect_window_min: toNumOrNull(d.appetite_effect_window_min),
      appetite_effect_window_max: toNumOrNull(d.appetite_effect_window_max),
      nausea_risk_window_min: toNumOrNull(d.nausea_risk_window_min),
      nausea_risk_window_max: toNumOrNull(d.nausea_risk_window_max),
      constipation_risk_window_min: toNumOrNull(d.constipation_risk_window_min),
      constipation_risk_window_max: toNumOrNull(d.constipation_risk_window_max),
      coverage_fades_after_hours: toNumOrNull(d.coverage_fades_after_hours),
      notes: d.notes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'drug_id' },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

// ── Symptom playbooks + bands ──────────────────────────────

const symptomPlaybookSchema = z.object({
  drug_id: z.string().uuid(),
  symptom: z.string().min(1),
  side_effect_id: z.string().uuid().optional().or(z.literal('')),
  ordinal: z.coerce.number().int().optional(),
});

export async function addSymptomPlaybook(formData: FormData) {
  await requireEditor();
  const parsed = symptomPlaybookSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_symptom_playbooks').insert({
    drug_id: d.drug_id,
    symptom: d.symptom,
    side_effect_id: d.side_effect_id && d.side_effect_id !== '' ? d.side_effect_id : null,
    ordinal: d.ordinal ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteSymptomPlaybook(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_symptom_playbooks').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

const playbookBandSchema = z.object({
  drug_id: z.string().uuid(),
  playbook_id: z.string().uuid(),
  min_score: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  max_score: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
  title: z.string().min(1),
  nutrition_strategy: z.string().optional(),
  hydration_strategy: z.string().optional(),
  avoid: z.string().optional(),
  escalation: z.string().optional(),
  ordinal: z.coerce.number().int().optional(),
});

export async function addSymptomPlaybookBand(formData: FormData) {
  await requireEditor();
  const parsed = playbookBandSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  if (d.escalation) assertComplianceSafe(d.escalation, 'escalation');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_symptom_playbook_bands').insert({
    playbook_id: d.playbook_id,
    min_score: toNumOrNull(d.min_score),
    max_score: toNumOrNull(d.max_score),
    title: d.title,
    nutrition_strategy: toStrArray(d.nutrition_strategy),
    hydration_strategy: toStrArray(d.hydration_strategy),
    avoid: toStrArray(d.avoid),
    escalation: d.escalation || null,
    ordinal: d.ordinal ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteSymptomPlaybookBand(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_symptom_playbook_bands').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Food tolerance rules ───────────────────────────────────

const foodToleranceSchema = z.object({
  drug_id: z.string().uuid(),
  context: z.enum([
    'low_appetite', 'nausea', 'constipation', 'reflux', 'diarrhea',
    'dose_escalation_week', 'day_before_dose', 'post_dose_peak', 'post_dose_nausea_window',
  ]),
  prefer: z.string().optional(),
  limit: z.string().optional(),
  avoid: z.string().optional(),
  rationale: z.string().optional(),
  ordinal: z.coerce.number().int().optional(),
});

export async function addFoodToleranceRule(formData: FormData) {
  await requireEditor();
  const parsed = foodToleranceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  if (d.rationale) assertComplianceSafe(d.rationale, 'rationale');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_food_tolerance_rules').insert({
    drug_id: d.drug_id,
    context: d.context,
    prefer: toStrArray(d.prefer),
    limit: toStrArray(d.limit),
    avoid: toStrArray(d.avoid),
    rationale: d.rationale || null,
    ordinal: d.ordinal ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteFoodToleranceRule(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_food_tolerance_rules').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Check-in protocol (1:1 header) + questions ─────────────

const checkinProtocolSchema = z.object({
  drug_id: z.string().uuid(),
  cadence: z.string().min(1),
  notes: z.string().optional(),
});

export async function saveCheckinProtocol(formData: FormData) {
  await requireEditor();
  const parsed = checkinProtocolSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  if (d.notes) assertComplianceSafe(d.notes, 'notes');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_checkin_protocol').upsert(
    { drug_id: d.drug_id, cadence: d.cadence, notes: d.notes || null, updated_at: new Date().toISOString() },
    { onConflict: 'drug_id' },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

const checkinQuestionSchema = z.object({
  drug_id: z.string().uuid(),
  protocol_id: z.string().uuid(),
  question_id: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  unit: z.string().optional(),
  condition: z.string().optional(),
  trigger_guidance_from_score: z.union([z.coerce.number(), z.literal('')]).optional(),
  ordinal: z.coerce.number().int().optional(),
});

export async function addCheckinQuestion(formData: FormData) {
  await requireEditor();
  const parsed = checkinQuestionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_checkin_questions').insert({
    protocol_id: d.protocol_id,
    question_id: d.question_id,
    label: d.label,
    type: d.type,
    unit: d.unit || null,
    condition: d.condition || null,
    trigger_guidance_from_score: toNumOrNull(d.trigger_guidance_from_score),
    ordinal: d.ordinal ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteCheckinQuestion(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_checkin_questions').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Red-flag rules ─────────────────────────────────────────

const redFlagRuleSchema = z.object({
  drug_id: z.string().uuid(),
  symptom: z.string().min(1),
  action_level: z.enum(['monitor', 'contact_prescriber', 'urgent_care', 'emergency']),
  display_copy: z.string().min(1),
  related_risks: z.string().optional(),
  ordinal: z.coerce.number().int().optional(),
});

export async function addRedFlagRule(formData: FormData) {
  await requireEditor();
  const parsed = redFlagRuleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;
  assertComplianceSafe(d.display_copy, 'display_copy');

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_red_flag_rules').insert({
    drug_id: d.drug_id,
    symptom: d.symptom,
    action_level: d.action_level,
    display_copy: d.display_copy,
    related_risks: toStrArray(d.related_risks),
    ordinal: d.ordinal ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

export async function deleteRedFlagRule(id: string, drugId: string) {
  await requireEditor();
  const admin = createAdminSupabaseClient();
  await admin.from('drug_red_flag_rules').delete().eq('id', id);
  revalidatePath(`/admin/drugs/${drugId}/edit`);
}

// ── Clinician report template (1:1 upsert) ─────────────────

const clinicianReportSchema = z.object({
  drug_id: z.string().uuid(),
  key_metrics: z.string().optional(),
  relevant_symptoms: z.string().optional(),
  medication_context_label: z.string().optional(),
});

export async function saveClinicianReportTemplate(formData: FormData) {
  await requireEditor();
  const parsed = clinicianReportSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(', '));
  const d = parsed.data;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('drug_clinician_report_template').upsert(
    {
      drug_id: d.drug_id,
      key_metrics: toStrArray(d.key_metrics),
      relevant_symptoms: toStrArray(d.relevant_symptoms),
      medication_context_label: d.medication_context_label || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'drug_id' },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/drugs/${d.drug_id}/edit`);
}

// ── Batch protocol-companion generation across the catalogue ─

export type ProtocolInsertCounts = {
  protocol_timeline: number;
  dose_cycle_profile: number;
  symptom_playbooks: number;
  food_tolerance_rules: number;
  checkin_protocol: number;
  red_flag_rules: number;
  clinician_report_template: number;
};

export type BatchProtocolResult = {
  drug_id: string;
  slug: string;
  name: string;
  status: 'ok' | 'skipped' | 'error';
  inserted?: ProtocolInsertCounts;
  error?: string;
};

function countProtocolDraft(draft: GeneratedProtocolExtensions): ProtocolInsertCounts {
  return {
    protocol_timeline: draft.protocol_timeline.length,
    dose_cycle_profile: draft.dose_cycle_profile ? 1 : 0,
    symptom_playbooks: draft.symptom_playbooks.length,
    food_tolerance_rules: draft.food_tolerance_rules.length,
    checkin_protocol: draft.checkin_protocol ? 1 : 0,
    red_flag_rules: draft.red_flag_rules.length,
    clinician_report_template: draft.clinician_report_template ? 1 : 0,
  };
}

export async function batchProtocolExtensionsAction(opts: { dryRun: boolean; publishedOnly: boolean }) {
  const { supabase } = await requireEditor();
  const admin = createAdminSupabaseClient();

  let q = admin
    .from('peptides')
    .select('id, slug, name, publication_status')
    .order('name', { ascending: true });
  if (opts.publishedOnly) q = q.eq('publication_status', 'published');

  const { data: drugs } = await q;
  const results: BatchProtocolResult[] = [];

  for (const drug of drugs ?? []) {
    try {
      const { draft } = await draftProtocolExtensionsAction(drug.id);
      const counts = countProtocolDraft(draft);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      if (total === 0) {
        results.push({ drug_id: drug.id, slug: drug.slug, name: drug.name, status: 'skipped', inserted: counts });
        continue;
      }

      if (opts.dryRun) {
        results.push({ drug_id: drug.id, slug: drug.slug, name: drug.name, status: 'ok', inserted: counts });
      } else {
        const accepted = await acceptProtocolExtensionsDraftAction(drug.id, draft);
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
      action: 'drug.protocol_extensions_batch_accepted',
      entity_type: 'drug',
      entity_id: null,
      meta: { results: results as unknown as Json },
    });
    revalidatePath('/admin/drugs/coverage');
  }

  return results;
}
