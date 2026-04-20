-- ============================================================
-- 0017_reconstitution_dose_reference.sql
-- ============================================================
-- Adds three things:
--
-- 1. drug_reconstitution_guide — per-vial-size mixing instructions
--    (BAC water volume, resulting concentration, technique, storage)
--
-- 2. drug_dose_reference — mg → U-100 units → mL lookup tables
--    supporting both simple concentration references and phased
--    protocol reference tables drawn from published trial data
--
-- 3. formulation column on drug_injection_guide — distinguishes
--    'pen' (pre-filled autoinjector) from 'lyophilized' (compounded
--    powder requiring reconstitution) so supplies and steps can
--    differ by delivery form
-- ============================================================

-- ── 1. Add formulation to drug_injection_guide ───────────────

alter table public.drug_injection_guide
  add column if not exists formulation text not null default 'pen'
    check (formulation in ('pen','lyophilized'));

-- Backfill existing pen-drug rows (already inserted by 0016)
update public.drug_injection_guide set formulation = 'pen'
where formulation = 'pen'; -- no-op; default already correct

-- ── 2. drug_reconstitution_guide ─────────────────────────────

create table if not exists public.drug_reconstitution_guide (
  id                      uuid primary key default gen_random_uuid(),
  drug_id                 uuid not null references public.peptides(id) on delete cascade,
  vial_size_mg            numeric not null,
  bac_water_ml            numeric not null,
  concentration_mg_per_ml numeric not null,
  technique_notes         text,
  measurement_note        text,
  storage_lyophilized     text,
  storage_reconstituted   text,
  use_within              text,
  ordinal                 integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.drug_reconstitution_guide enable row level security;

create policy "public_read_drug_reconstitution_guide"
on public.drug_reconstitution_guide for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_reconstitution_guide"
on public.drug_reconstitution_guide for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_reconstitution_guide"
on public.drug_reconstitution_guide for update
using (public.is_staff_editor());

create policy "staff_delete_drug_reconstitution_guide"
on public.drug_reconstitution_guide for delete
using (public.is_staff_editor());

-- ── 3. drug_dose_reference ───────────────────────────────────

create table if not exists public.drug_dose_reference (
  id             uuid primary key default gen_random_uuid(),
  drug_id        uuid not null references public.peptides(id) on delete cascade,
  protocol_label text not null,
  phase_label    text,
  dose_mg        numeric not null,
  units_u100     integer not null,
  volume_ml      numeric not null,
  ordinal        integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- protocol_label groups rows into a named table, e.g.:
--   'Concentration reference (10 mg/mL)' — simple lookup
--   'Standard escalation (Phase 2 reference)' — phased titration
-- phase_label is the row descriptor: 'Weeks 1–4', 'Weeks 5–8', etc.
-- For a concentration-only table, phase_label is the dose description.

alter table public.drug_dose_reference enable row level security;

create policy "public_read_drug_dose_reference"
on public.drug_dose_reference for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_dose_reference"
on public.drug_dose_reference for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_dose_reference"
on public.drug_dose_reference for update
using (public.is_staff_editor());

create policy "staff_delete_drug_dose_reference"
on public.drug_dose_reference for delete
using (public.is_staff_editor());
