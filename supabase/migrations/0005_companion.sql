-- ============================================================
-- 0005_companion.sql — Drug Companion Content Platform schema
-- ============================================================
-- Additive only. Extends peptides with drug-companion columns,
-- adds companion content tables, and introduces a publication_status
-- workflow for editorial review.
-- ============================================================

-- ── 1. Publication status ───────────────────────────────────

alter table public.peptides
  add column if not exists publication_status text not null default 'draft'
    check (publication_status in ('draft','in_review','published','archived'));

alter table public.studies
  add column if not exists publication_status text not null default 'draft'
    check (publication_status in ('draft','in_review','published','archived'));

-- Backfill existing rows to published so they remain visible.
update public.peptides set publication_status = 'published' where publication_status = 'draft';
update public.studies  set publication_status = 'published' where publication_status = 'draft';

-- ── 2. Drug-companion metadata columns on peptides ──────────

alter table public.peptides
  add column if not exists generic_name text,
  add column if not exists brand_names jsonb not null default '[]'::jsonb,
  add column if not exists drug_class text,
  add column if not exists administration_route text,
  add column if not exists typical_dosing_schedule text,
  add column if not exists prescription_required boolean not null default true;

-- ── 3. Companion content tables ─────────────────────────────

-- Week-by-week expectations
create table if not exists public.drug_expectations (
  id uuid primary key default gen_random_uuid(),
  drug_id uuid not null references public.peptides(id) on delete cascade,
  week_number integer not null check (week_number >= 0),
  milestone text not null,
  description text not null,
  is_common boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (drug_id, week_number, milestone)
);

-- Food guidance (prefer / limit / avoid / hydrate)
create table if not exists public.drug_food_guidance (
  id uuid primary key default gen_random_uuid(),
  drug_id uuid not null references public.peptides(id) on delete cascade,
  category text not null check (category in ('prefer','limit','avoid','hydrate')),
  item text not null,
  rationale text,
  evidence_level text not null default 'editorial'
    check (evidence_level in ('anecdotal','editorial','study_backed')),
  ordinal integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Coping strategies per existing side_effect row
create table if not exists public.drug_side_effect_tips (
  id uuid primary key default gen_random_uuid(),
  side_effect_id uuid not null references public.side_effects(id) on delete cascade,
  strategy text not null,
  when_to_seek_help text,
  ordinal integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- General companion tips (administration, timing, mindset, etc.)
create table if not exists public.drug_tips (
  id uuid primary key default gen_random_uuid(),
  drug_id uuid not null references public.peptides(id) on delete cascade,
  category text not null check (category in (
    'administration','timing','mindset','exercise','sleep','hydration','nutrition','other'
  )),
  title text not null,
  body_markdown text not null,
  ordinal integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Editorial review log
create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'drug','expectation','food_guidance','tip','side_effect_tip','ai_summary'
  )),
  entity_id uuid not null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('approved','rejected','requested_changes')),
  notes text,
  created_at timestamptz not null default now()
);

-- ── 4. Update public read policy on peptides ─────────────────

drop policy if exists "public_read_peptides" on public.peptides;

create policy "public_read_peptides"
on public.peptides for select
using (is_visible = true and publication_status = 'published');

-- ── 5. RLS on new tables ─────────────────────────────────────

alter table public.drug_expectations enable row level security;
alter table public.drug_food_guidance enable row level security;
alter table public.drug_side_effect_tips enable row level security;
alter table public.drug_tips enable row level security;
alter table public.content_reviews enable row level security;

-- Public can read companion content only for published drugs
create policy "public_read_drug_expectations"
on public.drug_expectations for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
    and p.is_visible = true
    and p.publication_status = 'published'
  )
);

create policy "public_read_drug_food_guidance"
on public.drug_food_guidance for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
    and p.is_visible = true
    and p.publication_status = 'published'
  )
);

create policy "public_read_drug_side_effect_tips"
on public.drug_side_effect_tips for select
using (true);

create policy "public_read_drug_tips"
on public.drug_tips for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
    and p.is_visible = true
    and p.publication_status = 'published'
  )
);

-- Only editors/admins can see the review log
create policy "content_reviews_staff_select"
on public.content_reviews for select
using (public.is_staff_editor());

create policy "content_reviews_staff_insert"
on public.content_reviews for insert
with check (public.is_staff_editor());

-- ── 6. Staff write policies for new tables ───────────────────

create policy "staff_insert_drug_expectations"
on public.drug_expectations for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_expectations"
on public.drug_expectations for update
using (public.is_staff_editor());

create policy "staff_delete_drug_expectations"
on public.drug_expectations for delete
using (public.is_staff_editor());

create policy "staff_insert_drug_food_guidance"
on public.drug_food_guidance for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_food_guidance"
on public.drug_food_guidance for update
using (public.is_staff_editor());

create policy "staff_delete_drug_food_guidance"
on public.drug_food_guidance for delete
using (public.is_staff_editor());

create policy "staff_insert_drug_side_effect_tips"
on public.drug_side_effect_tips for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_side_effect_tips"
on public.drug_side_effect_tips for update
using (public.is_staff_editor());

create policy "staff_delete_drug_side_effect_tips"
on public.drug_side_effect_tips for delete
using (public.is_staff_editor());

create policy "staff_insert_drug_tips"
on public.drug_tips for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_tips"
on public.drug_tips for update
using (public.is_staff_editor());

create policy "staff_delete_drug_tips"
on public.drug_tips for delete
using (public.is_staff_editor());
