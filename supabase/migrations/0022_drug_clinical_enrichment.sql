-- ============================================================
-- 0022_drug_clinical_enrichment.sql
-- ============================================================
-- Adds structured clinical-support content for public companion
-- profiles: warnings, missed-dose rules, indication/region,
-- dose-escalation phases, formulation storage, side-effect
-- thresholds, and source citations.
-- ============================================================

-- ── 1. Source citations ──────────────────────────────────────

create table if not exists public.drug_sources (
  id            uuid primary key default gen_random_uuid(),
  drug_id       uuid not null references public.peptides(id) on delete cascade,
  source_type   text not null check (source_type in ('prescribing_information','regulator','study','editorial','other')),
  label         text not null,
  url           text,
  region        text,
  authority     text,
  citation_text text,
  retrieved_at  date,
  ordinal       integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.drug_sources enable row level security;

create policy "public_read_drug_sources"
on public.drug_sources for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_sources"
on public.drug_sources for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_sources"
on public.drug_sources for update
using (public.is_staff_editor());

create policy "staff_delete_drug_sources"
on public.drug_sources for delete
using (public.is_staff_editor());

-- ── 2. Safety warnings and urgent flags ──────────────────────

create table if not exists public.drug_warnings (
  id         uuid primary key default gen_random_uuid(),
  drug_id    uuid not null references public.peptides(id) on delete cascade,
  severity   text not null check (severity in ('info','caution','urgent','boxed_warning')),
  title      text not null,
  body       text not null,
  source_id  uuid references public.drug_sources(id) on delete set null,
  ordinal    integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drug_warnings enable row level security;

create policy "public_read_drug_warnings"
on public.drug_warnings for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_warnings"
on public.drug_warnings for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_warnings"
on public.drug_warnings for update
using (public.is_staff_editor());

create policy "staff_delete_drug_warnings"
on public.drug_warnings for delete
using (public.is_staff_editor());

-- ── 3. Missed-dose rules ─────────────────────────────────────

create table if not exists public.drug_missed_dose_rules (
  id               uuid primary key default gen_random_uuid(),
  drug_id          uuid not null references public.peptides(id) on delete cascade,
  formulation      text,
  max_delay_hours  integer,
  instruction      text not null,
  restart_guidance text,
  source_id        uuid references public.drug_sources(id) on delete set null,
  ordinal          integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.drug_missed_dose_rules enable row level security;

create policy "public_read_drug_missed_dose_rules"
on public.drug_missed_dose_rules for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_missed_dose_rules"
on public.drug_missed_dose_rules for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_missed_dose_rules"
on public.drug_missed_dose_rules for update
using (public.is_staff_editor());

create policy "staff_delete_drug_missed_dose_rules"
on public.drug_missed_dose_rules for delete
using (public.is_staff_editor());

-- ── 4. Approved indications by region ───────────────────────

create table if not exists public.drug_approved_indications (
  id              uuid primary key default gen_random_uuid(),
  drug_id         uuid not null references public.peptides(id) on delete cascade,
  region          text not null,
  authority       text,
  approval_status text not null default 'approved'
    check (approval_status in ('approved','off_label','investigational','not_approved')),
  indication      text not null,
  population      text,
  source_id       uuid references public.drug_sources(id) on delete set null,
  ordinal         integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.drug_approved_indications enable row level security;

create policy "public_read_drug_approved_indications"
on public.drug_approved_indications for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_approved_indications"
on public.drug_approved_indications for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_approved_indications"
on public.drug_approved_indications for update
using (public.is_staff_editor());

create policy "staff_delete_drug_approved_indications"
on public.drug_approved_indications for delete
using (public.is_staff_editor());

-- ── 5. Dose escalation templates ─────────────────────────────

create table if not exists public.drug_dose_escalation_phases (
  id                      uuid primary key default gen_random_uuid(),
  drug_id                 uuid not null references public.peptides(id) on delete cascade,
  protocol_label          text not null,
  phase_label             text not null,
  start_week              integer not null check (start_week >= 0),
  end_week                integer check (end_week is null or end_week >= start_week),
  dose_amount             numeric,
  dose_unit               text,
  frequency               text,
  route                   text,
  phase_purpose           text,
  hold_or_reduce_guidance text,
  source_id               uuid references public.drug_sources(id) on delete set null,
  ordinal                 integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.drug_dose_escalation_phases enable row level security;

create policy "public_read_drug_dose_escalation_phases"
on public.drug_dose_escalation_phases for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_dose_escalation_phases"
on public.drug_dose_escalation_phases for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_dose_escalation_phases"
on public.drug_dose_escalation_phases for update
using (public.is_staff_editor());

create policy "staff_delete_drug_dose_escalation_phases"
on public.drug_dose_escalation_phases for delete
using (public.is_staff_editor());

-- ── 6. Formulation-level storage and expiry ──────────────────

create table if not exists public.drug_formulation_storage (
  id                            uuid primary key default gen_random_uuid(),
  drug_id                       uuid not null references public.peptides(id) on delete cascade,
  formulation                   text not null,
  storage_state                 text,
  temperature                   text,
  protect_from_light            boolean not null default false,
  do_not_freeze                 boolean not null default true,
  expiry_after_opening          text,
  expiry_after_reconstitution   text,
  handling_notes                text,
  source_id                     uuid references public.drug_sources(id) on delete set null,
  ordinal                       integer not null default 0,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

alter table public.drug_formulation_storage enable row level security;

create policy "public_read_drug_formulation_storage"
on public.drug_formulation_storage for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_formulation_storage"
on public.drug_formulation_storage for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_formulation_storage"
on public.drug_formulation_storage for update
using (public.is_staff_editor());

create policy "staff_delete_drug_formulation_storage"
on public.drug_formulation_storage for delete
using (public.is_staff_editor());

-- ── 7. Side-effect escalation thresholds ─────────────────────

create table if not exists public.drug_side_effect_thresholds (
  id             uuid primary key default gen_random_uuid(),
  drug_id        uuid not null references public.peptides(id) on delete cascade,
  side_effect_id uuid references public.side_effects(id) on delete set null,
  effect         text not null,
  threshold      text not null,
  action         text not null check (action in ('self_monitor','contact_prescriber','urgent_care','emergency')),
  action_label   text not null,
  source_id      uuid references public.drug_sources(id) on delete set null,
  ordinal        integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.drug_side_effect_thresholds enable row level security;

create policy "public_read_drug_side_effect_thresholds"
on public.drug_side_effect_thresholds for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_side_effect_thresholds"
on public.drug_side_effect_thresholds for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_side_effect_thresholds"
on public.drug_side_effect_thresholds for update
using (public.is_staff_editor());

create policy "staff_delete_drug_side_effect_thresholds"
on public.drug_side_effect_thresholds for delete
using (public.is_staff_editor());

-- ── 8. Representative Wegovy seed ────────────────────────────

insert into public.drug_sources (drug_id, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal)
select p.id, v.source_type, v.label, v.url, v.region, v.authority, v.citation_text, v.retrieved_at::date, v.ordinal
from public.peptides p
cross join (values
  ('prescribing_information', 'Wegovy prescribing information', 'https://www.novo-pi.com/wegovy.pdf', 'US', 'FDA', 'Novo Nordisk. Wegovy (semaglutide) prescribing information.', '2026-04-27', 1),
  ('regulator', 'Wegovy product information', 'https://www.tga.gov.au/resources/artg/329481', 'AU', 'TGA', 'Therapeutic Goods Administration product information for Wegovy.', '2026-04-27', 2),
  ('study', 'STEP 1 trial', 'https://www.nejm.org/doi/full/10.1056/NEJMoa2032183', 'Global', 'NEJM', 'Wilding JPH et al. Once-weekly semaglutide in adults with overweight or obesity. N Engl J Med. 2021.', '2026-04-27', 3)
) as v(source_type, label, url, region, authority, citation_text, retrieved_at, ordinal)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_sources s
    where s.drug_id = p.id and s.label = v.label
  );

insert into public.drug_warnings (drug_id, severity, title, body, source_id, ordinal)
select p.id, v.severity, v.title, v.body, s.id, v.ordinal
from public.peptides p
cross join (values
  ('boxed_warning', 'Thyroid C-cell tumour warning', 'Do not use Wegovy if you or your family have a history of medullary thyroid carcinoma, or if you have multiple endocrine neoplasia syndrome type 2.', 'Wegovy prescribing information', 1),
  ('urgent', 'Possible pancreatitis', 'Seek urgent medical advice for severe, persistent abdominal pain, especially if it radiates to the back or is accompanied by vomiting.', 'Wegovy prescribing information', 2),
  ('urgent', 'Severe allergic reaction', 'Stop using the medicine and seek urgent care for swelling of the face, lips, tongue or throat, breathing difficulty, fainting, or widespread rash.', 'Wegovy prescribing information', 3),
  ('caution', 'Pregnancy planning', 'Wegovy is not recommended during pregnancy. Discuss stopping semaglutide at least 2 months before a planned pregnancy because of its long half-life.', 'Wegovy prescribing information', 4)
) as v(severity, title, body, source_label, ordinal)
join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_warnings w
    where w.drug_id = p.id and w.title = v.title
  );

insert into public.drug_missed_dose_rules (drug_id, formulation, max_delay_hours, instruction, restart_guidance, source_id, ordinal)
select p.id, v.formulation, v.max_delay_hours, v.instruction, v.restart_guidance, s.id, v.ordinal
from public.peptides p
cross join (values
  ('pen', 120, 'If a once-weekly dose is missed and the next scheduled dose is more than 2 days away, take the missed dose as soon as possible.', 'Resume once-weekly dosing on the regular scheduled day.', 'Wegovy prescribing information', 1),
  ('pen', null, 'If the next scheduled dose is less than 2 days away, skip the missed dose.', 'Do not take two doses within 48 hours. Resume on the next regular scheduled day.', 'Wegovy prescribing information', 2),
  ('pen', null, 'If more than 2 consecutive doses are missed, contact the prescriber before restarting.', 'The prescriber may restart at a lower dose to reduce gastrointestinal side effects.', 'Wegovy prescribing information', 3)
) as v(formulation, max_delay_hours, instruction, restart_guidance, source_label, ordinal)
join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_missed_dose_rules r
    where r.drug_id = p.id and r.instruction = v.instruction
  );

insert into public.drug_approved_indications (drug_id, region, authority, approval_status, indication, population, source_id, ordinal)
select p.id, v.region, v.authority, v.approval_status, v.indication, v.population, s.id, v.ordinal
from public.peptides p
cross join (values
  ('AU', 'TGA', 'approved', 'Chronic weight management as an adjunct to reduced-calorie diet and increased physical activity.', 'Adults and adolescents meeting product-information eligibility criteria.', 'Wegovy product information', 1),
  ('US', 'FDA', 'approved', 'Chronic weight management and reduction of major adverse cardiovascular events in selected adults with established cardiovascular disease and obesity or overweight.', 'Adults and adolescents meeting label eligibility criteria.', 'Wegovy prescribing information', 2)
) as v(region, authority, approval_status, indication, population, source_label, ordinal)
join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_approved_indications i
    where i.drug_id = p.id and i.region = v.region and i.indication = v.indication
  );

insert into public.drug_dose_escalation_phases (
  drug_id, protocol_label, phase_label, start_week, end_week, dose_amount, dose_unit,
  frequency, route, phase_purpose, hold_or_reduce_guidance, source_id, ordinal
)
select p.id, v.protocol_label, v.phase_label, v.start_week, v.end_week, v.dose_amount, v.dose_unit,
  v.frequency, v.route, v.phase_purpose, v.hold_or_reduce_guidance, s.id, v.ordinal
from public.peptides p
cross join (values
  ('Standard Wegovy escalation', 'Weeks 1-4', 1, 4, 0.25::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Tolerability initiation dose.', 'If not tolerated, discuss delaying escalation rather than self-adjusting.', 'Wegovy prescribing information', 1),
  ('Standard Wegovy escalation', 'Weeks 5-8', 5, 8, 0.5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'First escalation step.', 'Hold at current tolerated dose only under prescriber guidance.', 'Wegovy prescribing information', 2),
  ('Standard Wegovy escalation', 'Weeks 9-12', 9, 12, 1::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Intermediate escalation step.', 'If gastrointestinal symptoms are significant, contact prescriber before escalating.', 'Wegovy prescribing information', 3),
  ('Standard Wegovy escalation', 'Weeks 13-16', 13, 16, 1.7::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Pre-maintenance escalation step.', 'Dose holds may be considered if tolerability limits escalation.', 'Wegovy prescribing information', 4),
  ('Standard Wegovy escalation', 'Week 17 onward', 17, null, 2.4::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Maintenance dose for chronic weight management.', 'If maintenance is not tolerated, prescriber may consider alternatives or dose adjustment.', 'Wegovy prescribing information', 5)
) as v(protocol_label, phase_label, start_week, end_week, dose_amount, dose_unit, frequency, route, phase_purpose, hold_or_reduce_guidance, source_label, ordinal)
join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_dose_escalation_phases d
    where d.drug_id = p.id and d.protocol_label = v.protocol_label and d.phase_label = v.phase_label
  );

insert into public.drug_formulation_storage (
  drug_id, formulation, storage_state, temperature, protect_from_light, do_not_freeze,
  expiry_after_opening, expiry_after_reconstitution, handling_notes, source_id, ordinal
)
select p.id, v.formulation, v.storage_state, v.temperature, v.protect_from_light, v.do_not_freeze,
  v.expiry_after_opening, v.expiry_after_reconstitution, v.handling_notes, s.id, v.ordinal
from public.peptides p
cross join (values
  ('single-dose pen', 'before use', 'Refrigerate at 2-8C', true, true, null, null, 'Keep in the original carton. Do not use if frozen, exposed to excessive heat, cloudy, discoloured, or particulate.', 'Wegovy prescribing information', 1),
  ('single-dose pen', 'room temperature allowance', 'Below 30C', true, true, 'Use within 28 days if stored out of refrigeration.', null, 'Keep cap on until use and store away from children.', 'Wegovy prescribing information', 2)
) as v(formulation, storage_state, temperature, protect_from_light, do_not_freeze, expiry_after_opening, expiry_after_reconstitution, handling_notes, source_label, ordinal)
join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_formulation_storage fs
    where fs.drug_id = p.id and fs.formulation = v.formulation and fs.storage_state = v.storage_state
  );

insert into public.drug_side_effect_thresholds (drug_id, side_effect_id, effect, threshold, action, action_label, source_id, ordinal)
select p.id, se.id, v.effect, v.threshold, v.action, v.action_label, s.id, v.ordinal
from public.peptides p
cross join (values
  ('Vomiting', 'Repeated vomiting, vomiting lasting more than 24-48 hours, or inability to keep fluids down.', 'contact_prescriber', 'Contact your prescriber promptly; seek urgent care if dehydration symptoms occur.', 'Wegovy prescribing information', 1),
  ('Abdominal pain', 'Severe or persistent abdominal pain, especially with vomiting or pain radiating to the back.', 'urgent_care', 'Seek urgent medical advice to rule out pancreatitis or gallbladder disease.', 'Wegovy prescribing information', 2),
  ('Hypoglycaemia symptoms', 'Shaking, sweating, confusion, faintness, or low glucose readings when used with insulin or sulfonylureas.', 'urgent_care', 'Treat low glucose according to your diabetes plan and seek urgent help if severe or not improving.', 'Wegovy prescribing information', 3),
  ('Injection-site reaction', 'Spreading redness, warmth, pus, severe pain, or systemic symptoms such as fever.', 'contact_prescriber', 'Contact your prescriber to assess possible infection or allergic reaction.', 'Wegovy prescribing information', 4)
) as v(effect, threshold, action, action_label, source_label, ordinal)
join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
left join lateral (
  select id
  from public.side_effects
  where peptide_id = p.id and lower(effect) = lower(v.effect)
  order by created_at
  limit 1
) se on true
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_side_effect_thresholds t
    where t.drug_id = p.id and t.effect = v.effect and t.threshold = v.threshold
  );
