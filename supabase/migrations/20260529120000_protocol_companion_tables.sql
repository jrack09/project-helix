-- ============================================================
-- 20260529120000_protocol_companion_tables.sql
-- ============================================================
-- "Protocol companion" expansion for the public drugs API.
-- Adds the seven Viora-priority structured blocks:
--   1. protocol_timeline        (journey-map phases)
--   2. dose_cycle_profile       (consolidated "right now" windows, 1:1)
--   3. symptom_playbooks         (+ severity bands)
--   4. food_tolerance_rules     (contextual prefer/limit/avoid)
--   5. checkin_protocol          (+ questions, 1:1 header)
--   6. red_flag_rules           (explicit urgent-escalation rules)
--   7. clinician_report_template (report-friendly labels, 1:1)
--
-- All tables follow the existing drug_* convention:
--   * drug_id -> peptides(id) on delete cascade
--   * source_id -> drug_sources(id) on delete set null (where applicable)
--   * ordinal for stable ordering
--   * RLS: public read when the drug is visible+published; staff write.
-- List-shaped fields use text[]; numeric windows use _min/_max pairs to
-- match drug_side_effect_windows.
-- ============================================================

-- ── 1. Protocol timeline (journey map) ───────────────────────

create table if not exists public.drug_protocol_timeline (
  id                 uuid primary key default gen_random_uuid(),
  drug_id            uuid not null references public.peptides(id) on delete cascade,
  protocol_label     text,
  week_start         integer not null,
  week_end           integer,
  phase_title        text not null,
  typical_dose_mg    numeric,
  cadence_days       integer,
  expected_changes   text[] not null default '{}',
  common_adjustments text[] not null default '{}',
  user_focus         text[] not null default '{}',
  source_id          uuid references public.drug_sources(id) on delete set null,
  ordinal            integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists drug_protocol_timeline_drug_id_idx
  on public.drug_protocol_timeline (drug_id);

alter table public.drug_protocol_timeline enable row level security;

create policy "public_read_drug_protocol_timeline"
on public.drug_protocol_timeline for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_protocol_timeline"
on public.drug_protocol_timeline for insert with check (public.is_staff_editor());
create policy "staff_update_drug_protocol_timeline"
on public.drug_protocol_timeline for update using (public.is_staff_editor());
create policy "staff_delete_drug_protocol_timeline"
on public.drug_protocol_timeline for delete using (public.is_staff_editor());

-- ── 2. Dose-cycle profile (1:1) ──────────────────────────────
-- The consolidated "right now" summary. Numeric PK (onset/coverage)
-- continues to live on peptides.*; this row adds the symptom windows.

create table if not exists public.drug_dose_cycle_profile (
  id                               uuid primary key default gen_random_uuid(),
  drug_id                          uuid not null references public.peptides(id) on delete cascade,
  onset_hours                      numeric,
  peak_effect_hours_min            numeric,
  peak_effect_hours_max            numeric,
  appetite_effect_window_min       numeric,
  appetite_effect_window_max       numeric,
  nausea_risk_window_min           numeric,
  nausea_risk_window_max           numeric,
  constipation_risk_window_min     numeric,
  constipation_risk_window_max     numeric,
  coverage_fades_after_hours       numeric,
  notes                            text,
  source_id                        uuid references public.drug_sources(id) on delete set null,
  created_at                       timestamptz not null default now(),
  updated_at                       timestamptz not null default now(),
  unique (drug_id)
);

alter table public.drug_dose_cycle_profile enable row level security;

create policy "public_read_drug_dose_cycle_profile"
on public.drug_dose_cycle_profile for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_dose_cycle_profile"
on public.drug_dose_cycle_profile for insert with check (public.is_staff_editor());
create policy "staff_update_drug_dose_cycle_profile"
on public.drug_dose_cycle_profile for update using (public.is_staff_editor());
create policy "staff_delete_drug_dose_cycle_profile"
on public.drug_dose_cycle_profile for delete using (public.is_staff_editor());

-- ── 3. Symptom playbooks (+ severity bands) ──────────────────

create table if not exists public.drug_symptom_playbooks (
  id              uuid primary key default gen_random_uuid(),
  drug_id         uuid not null references public.peptides(id) on delete cascade,
  side_effect_id  uuid references public.side_effects(id) on delete set null,
  symptom         text not null,
  source_id       uuid references public.drug_sources(id) on delete set null,
  ordinal         integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (drug_id, symptom)
);

create index if not exists drug_symptom_playbooks_drug_id_idx
  on public.drug_symptom_playbooks (drug_id);

create table if not exists public.drug_symptom_playbook_bands (
  id                  uuid primary key default gen_random_uuid(),
  playbook_id         uuid not null references public.drug_symptom_playbooks(id) on delete cascade,
  min_score           numeric,
  max_score           numeric,
  title               text not null,
  nutrition_strategy  text[] not null default '{}',
  hydration_strategy  text[] not null default '{}',
  avoid               text[] not null default '{}',
  escalation          text,
  ordinal             integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists drug_symptom_playbook_bands_playbook_id_idx
  on public.drug_symptom_playbook_bands (playbook_id);

alter table public.drug_symptom_playbooks enable row level security;
alter table public.drug_symptom_playbook_bands enable row level security;

create policy "public_read_drug_symptom_playbooks"
on public.drug_symptom_playbooks for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_symptom_playbooks"
on public.drug_symptom_playbooks for insert with check (public.is_staff_editor());
create policy "staff_update_drug_symptom_playbooks"
on public.drug_symptom_playbooks for update using (public.is_staff_editor());
create policy "staff_delete_drug_symptom_playbooks"
on public.drug_symptom_playbooks for delete using (public.is_staff_editor());

create policy "public_read_drug_symptom_playbook_bands"
on public.drug_symptom_playbook_bands for select
using (
  exists (
    select 1 from public.drug_symptom_playbooks pb
    join public.peptides p on p.id = pb.drug_id
    where pb.id = playbook_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_symptom_playbook_bands"
on public.drug_symptom_playbook_bands for insert with check (public.is_staff_editor());
create policy "staff_update_drug_symptom_playbook_bands"
on public.drug_symptom_playbook_bands for update using (public.is_staff_editor());
create policy "staff_delete_drug_symptom_playbook_bands"
on public.drug_symptom_playbook_bands for delete using (public.is_staff_editor());

-- ── 4. Food tolerance rules (contextual) ─────────────────────

create table if not exists public.drug_food_tolerance_rules (
  id          uuid primary key default gen_random_uuid(),
  drug_id     uuid not null references public.peptides(id) on delete cascade,
  context     text not null check (context in (
                'low_appetite','nausea','constipation','reflux','diarrhea',
                'dose_escalation_week','day_before_dose','post_dose_peak',
                'post_dose_nausea_window')),
  prefer      text[] not null default '{}',
  "limit"     text[] not null default '{}',
  avoid       text[] not null default '{}',
  rationale   text,
  source_id   uuid references public.drug_sources(id) on delete set null,
  ordinal     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (drug_id, context)
);

create index if not exists drug_food_tolerance_rules_drug_id_idx
  on public.drug_food_tolerance_rules (drug_id);

alter table public.drug_food_tolerance_rules enable row level security;

create policy "public_read_drug_food_tolerance_rules"
on public.drug_food_tolerance_rules for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_food_tolerance_rules"
on public.drug_food_tolerance_rules for insert with check (public.is_staff_editor());
create policy "staff_update_drug_food_tolerance_rules"
on public.drug_food_tolerance_rules for update using (public.is_staff_editor());
create policy "staff_delete_drug_food_tolerance_rules"
on public.drug_food_tolerance_rules for delete using (public.is_staff_editor());

-- ── 5. Check-in protocol (1:1 header + questions) ────────────

create table if not exists public.drug_checkin_protocol (
  id          uuid primary key default gen_random_uuid(),
  drug_id     uuid not null references public.peptides(id) on delete cascade,
  cadence     text not null,
  notes       text,
  source_id   uuid references public.drug_sources(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (drug_id)
);

create table if not exists public.drug_checkin_questions (
  id                          uuid primary key default gen_random_uuid(),
  protocol_id                 uuid not null references public.drug_checkin_protocol(id) on delete cascade,
  question_id                 text not null,
  label                       text not null,
  type                        text not null,
  unit                        text,
  condition                   text,
  trigger_guidance_from_score numeric,
  ordinal                     integer not null default 0,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists drug_checkin_questions_protocol_id_idx
  on public.drug_checkin_questions (protocol_id);

alter table public.drug_checkin_protocol enable row level security;
alter table public.drug_checkin_questions enable row level security;

create policy "public_read_drug_checkin_protocol"
on public.drug_checkin_protocol for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_checkin_protocol"
on public.drug_checkin_protocol for insert with check (public.is_staff_editor());
create policy "staff_update_drug_checkin_protocol"
on public.drug_checkin_protocol for update using (public.is_staff_editor());
create policy "staff_delete_drug_checkin_protocol"
on public.drug_checkin_protocol for delete using (public.is_staff_editor());

create policy "public_read_drug_checkin_questions"
on public.drug_checkin_questions for select
using (
  exists (
    select 1 from public.drug_checkin_protocol cp
    join public.peptides p on p.id = cp.drug_id
    where cp.id = protocol_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_checkin_questions"
on public.drug_checkin_questions for insert with check (public.is_staff_editor());
create policy "staff_update_drug_checkin_questions"
on public.drug_checkin_questions for update using (public.is_staff_editor());
create policy "staff_delete_drug_checkin_questions"
on public.drug_checkin_questions for delete using (public.is_staff_editor());

-- ── 6. Red-flag decision rules ───────────────────────────────

create table if not exists public.drug_red_flag_rules (
  id            uuid primary key default gen_random_uuid(),
  drug_id       uuid not null references public.peptides(id) on delete cascade,
  symptom       text not null,
  action_level  text not null check (action_level in ('monitor','contact_prescriber','urgent_care','emergency')),
  display_copy  text not null,
  related_risks text[] not null default '{}',
  source_id     uuid references public.drug_sources(id) on delete set null,
  ordinal       integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists drug_red_flag_rules_drug_id_idx
  on public.drug_red_flag_rules (drug_id);

alter table public.drug_red_flag_rules enable row level security;

create policy "public_read_drug_red_flag_rules"
on public.drug_red_flag_rules for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_red_flag_rules"
on public.drug_red_flag_rules for insert with check (public.is_staff_editor());
create policy "staff_update_drug_red_flag_rules"
on public.drug_red_flag_rules for update using (public.is_staff_editor());
create policy "staff_delete_drug_red_flag_rules"
on public.drug_red_flag_rules for delete using (public.is_staff_editor());

-- ── 7. Clinician report template (1:1) ───────────────────────

create table if not exists public.drug_clinician_report_template (
  id                       uuid primary key default gen_random_uuid(),
  drug_id                  uuid not null references public.peptides(id) on delete cascade,
  key_metrics              text[] not null default '{}',
  relevant_symptoms        text[] not null default '{}',
  medication_context_label text,
  source_id                uuid references public.drug_sources(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (drug_id)
);

alter table public.drug_clinician_report_template enable row level security;

create policy "public_read_drug_clinician_report_template"
on public.drug_clinician_report_template for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id and p.is_visible = true and p.publication_status = 'published'
  )
);
create policy "staff_insert_drug_clinician_report_template"
on public.drug_clinician_report_template for insert with check (public.is_staff_editor());
create policy "staff_update_drug_clinician_report_template"
on public.drug_clinician_report_template for update using (public.is_staff_editor());
create policy "staff_delete_drug_clinician_report_template"
on public.drug_clinician_report_template for delete using (public.is_staff_editor());
