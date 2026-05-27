-- ============================================================
-- 0015_drug_injection_guide.sql
-- ============================================================
-- Adds a drug_injection_guide table for structured injection
-- protocol content: supplies checklist, numbered steps,
-- warnings, and AU-specific disposal guidance.
--
-- step_type values:
--   supply   — items needed before injecting
--   step     — ordered injection procedure steps
--   warning  — important safety notes
--   disposal — sharps / waste disposal guidance
-- ============================================================

create table if not exists public.drug_injection_guide (
  id        uuid primary key default gen_random_uuid(),
  drug_id   uuid not null references public.peptides(id) on delete cascade,
  step_type text not null check (step_type in ('supply','step','warning','disposal')),
  ordinal   integer not null default 0,
  title     text not null,
  body      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drug_injection_guide enable row level security;

-- Public can read guides for published, visible drugs
create policy "public_read_drug_injection_guide"
on public.drug_injection_guide for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_injection_guide"
on public.drug_injection_guide for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_injection_guide"
on public.drug_injection_guide for update
using (public.is_staff_editor());

create policy "staff_delete_drug_injection_guide"
on public.drug_injection_guide for delete
using (public.is_staff_editor());
