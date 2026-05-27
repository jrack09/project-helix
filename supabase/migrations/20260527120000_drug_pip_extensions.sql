-- ============================================================
-- 20260527120000_drug_pip_extensions.sql
-- ============================================================
-- Additive PIP catalogue expansion. Adds structured fields for:
--   * numeric pharmacokinetics (half-life, tmax, duration)
--   * red-flag tagging on drug_warnings
--   * side-effect onset / peak / resolution windows
--   * approved injection sites with rotation guidance
--   * oral administration instructions
-- ============================================================

-- ── 1. Numeric pharmacokinetics on peptides ──────────────────
-- Keeps the existing free-text `pharmacokinetics` JSON intact for
-- prose explanations; adds machine-readable hour values alongside.

alter table public.peptides
  add column if not exists half_life_hours          numeric,
  add column if not exists tmax_hours               numeric,
  add column if not exists duration_of_action_hours numeric;

-- ── 2. Red-flag tag on existing warnings ─────────────────────
-- Lets consumers pull a clean "red flag symptoms" list without
-- having to infer from severity strings.

alter table public.drug_warnings
  add column if not exists is_red_flag boolean not null default false;

-- ── 3. Side-effect timing windows ────────────────────────────

create table if not exists public.drug_side_effect_windows (
  id                       uuid primary key default gen_random_uuid(),
  drug_id                  uuid not null references public.peptides(id) on delete cascade,
  side_effect_id           uuid references public.side_effects(id) on delete set null,
  effect                   text not null,
  onset_hours_min          numeric,
  onset_hours_max          numeric,
  peak_hours_min           numeric,
  peak_hours_max           numeric,
  resolution_days_typical  numeric,
  notes                    text,
  source_id                uuid references public.drug_sources(id) on delete set null,
  ordinal                  integer not null default 0,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.drug_side_effect_windows enable row level security;

create policy "public_read_drug_side_effect_windows"
on public.drug_side_effect_windows for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_side_effect_windows"
on public.drug_side_effect_windows for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_side_effect_windows"
on public.drug_side_effect_windows for update
using (public.is_staff_editor());

create policy "staff_delete_drug_side_effect_windows"
on public.drug_side_effect_windows for delete
using (public.is_staff_editor());

-- ── 4. Approved injection sites ──────────────────────────────

create table if not exists public.drug_injection_sites (
  id                 uuid primary key default gen_random_uuid(),
  drug_id            uuid not null references public.peptides(id) on delete cascade,
  site               text not null check (site in ('abdomen','thigh','upper_arm','buttock','other')),
  preferred          boolean not null default false,
  rotation_guidance  text,
  avoid_notes        text,
  source_id          uuid references public.drug_sources(id) on delete set null,
  ordinal            integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (drug_id, site)
);

alter table public.drug_injection_sites enable row level security;

create policy "public_read_drug_injection_sites"
on public.drug_injection_sites for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_injection_sites"
on public.drug_injection_sites for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_injection_sites"
on public.drug_injection_sites for update
using (public.is_staff_editor());

create policy "staff_delete_drug_injection_sites"
on public.drug_injection_sites for delete
using (public.is_staff_editor());

-- ── 5. Oral administration instructions ──────────────────────

create table if not exists public.drug_oral_administration (
  id                          uuid primary key default gen_random_uuid(),
  drug_id                     uuid not null references public.peptides(id) on delete cascade,
  formulation                 text not null,
  with_water_ml               integer,
  swallow_whole               boolean not null default false,
  time_of_day                 text,
  fasting_window_before_min   integer,
  fasting_window_after_min    integer,
  interaction_notes           text,
  source_id                   uuid references public.drug_sources(id) on delete set null,
  ordinal                     integer not null default 0,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

alter table public.drug_oral_administration enable row level security;

create policy "public_read_drug_oral_administration"
on public.drug_oral_administration for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_oral_administration"
on public.drug_oral_administration for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_oral_administration"
on public.drug_oral_administration for update
using (public.is_staff_editor());

create policy "staff_delete_drug_oral_administration"
on public.drug_oral_administration for delete
using (public.is_staff_editor());
