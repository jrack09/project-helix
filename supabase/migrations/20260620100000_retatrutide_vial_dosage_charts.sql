-- ============================================================
-- 20260620100000_retatrutide_vial_dosage_charts.sql
-- ============================================================
-- Adds per-vial "Dosage Chart" summary cards (intro + four
-- highlight bullets) and seeds Retatrutide for 5, 10, 20, and
-- 30 mg PeptideDosages editorial protocols.
-- ============================================================

-- ── 1. drug_dosage_chart_summary ─────────────────────────────

create table if not exists public.drug_dosage_chart_summary (
  id                      uuid primary key default gen_random_uuid(),
  drug_id                 uuid not null references public.peptides(id) on delete cascade,
  vial_size_mg            numeric not null,
  intro_text              text not null,
  highlight_reconstitute  text not null,
  highlight_weekly_range  text not null,
  highlight_measuring     text not null,
  highlight_storage       text not null,
  bac_water_ml            numeric not null,
  concentration_mg_per_ml numeric not null,
  source_id               uuid references public.drug_sources(id) on delete set null,
  ordinal                 integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (drug_id, vial_size_mg)
);

alter table public.drug_dosage_chart_summary enable row level security;

create policy "public_read_drug_dosage_chart_summary"
on public.drug_dosage_chart_summary for select
using (
  exists (
    select 1 from public.peptides p
    where p.id = drug_id
      and p.is_visible = true
      and p.publication_status = 'published'
  )
);

create policy "staff_insert_drug_dosage_chart_summary"
on public.drug_dosage_chart_summary for insert
with check (public.is_staff_editor());

create policy "staff_update_drug_dosage_chart_summary"
on public.drug_dosage_chart_summary for update
using (public.is_staff_editor());

create policy "staff_delete_drug_dosage_chart_summary"
on public.drug_dosage_chart_summary for delete
using (public.is_staff_editor());

-- ── 2. PeptideDosages source links (all four vial sizes) ─────

-- Align legacy 20 mg source label with vial protocol naming.
update public.drug_sources s
set label = 'Retatrutide 20 mg vial PeptideDosages protocol'
from public.peptides p
where s.drug_id = p.id
  and p.slug = 'retatrutide'
  and s.label = 'Retatrutide 20 mg dosage protocol';

insert into public.drug_sources (
  drug_id, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal
)
select p.id, v.source_type, v.label, v.url, v.region, v.authority, v.citation_text, v.retrieved_at::date, v.ordinal
from public.peptides p
join (values
  ('retatrutide', 'editorial', 'Retatrutide 5 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/retatrutide-5-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for Retatrutide 5 mg vial; not a prescribing label.', '2026-06-20', 4),
  ('retatrutide', 'editorial', 'Retatrutide 10 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/retatrutide-10-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for Retatrutide 10 mg vial; not a prescribing label.', '2026-06-20', 5),
  ('retatrutide', 'editorial', 'Retatrutide 30 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/retatrutide-30-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for Retatrutide 30 mg vial; not a prescribing label.', '2026-06-20', 6)
) as v(slug, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_sources s
  where s.drug_id = p.id and s.label = v.label
);

-- ── 3. Dosage chart summary cards ────────────────────────────

insert into public.drug_dosage_chart_summary (
  drug_id, vial_size_mg, intro_text,
  highlight_reconstitute, highlight_weekly_range, highlight_measuring, highlight_storage,
  bac_water_ml, concentration_mg_per_ml, source_id, ordinal
)
select p.id, v.vial_size_mg, v.intro_text,
  v.highlight_reconstitute, v.highlight_weekly_range, v.highlight_measuring, v.highlight_storage,
  v.bac_water_ml, v.concentration_mg_per_ml, s.id, v.ordinal
from public.peptides p
join (values
  (
    5::numeric,
    'Retatrutide is dosed at 2 mg–8 mg weekly by subcutaneous injection in educational protocols, starting low and titrating monthly. A 5 mg vial reconstituted with bacteriostatic water yields about 5.0 mg/mL. This information is for research and educational use only.',
    'Add 1.0 mL bacteriostatic water → ~5.0 mg/mL concentration.',
    '2–8 mg once weekly (gradual escalation over 8–12 weeks).',
    'At 5.0 mg/mL, 1 unit = 0.01 mL ≈ 50 mcg on a U-100 insulin syringe.',
    'Lyophilized: freeze at −20 °C (−4 °F); after reconstitution, refrigerate at 2–8 °C (35.6–46.4 °F) for up to 4 weeks.',
    1.0::numeric, 5.0::numeric,
    'Retatrutide 5 mg vial PeptideDosages protocol', 1
  ),
  (
    10::numeric,
    'Retatrutide is dosed at 2 mg–8 mg weekly by subcutaneous injection in educational protocols, starting low and titrating monthly. A 10 mg vial reconstituted with bacteriostatic water yields about 10.0 mg/mL. This information is for research and educational use only.',
    'Add 1.0 mL bacteriostatic water → ~10.0 mg/mL concentration.',
    '2–8 mg once weekly (gradual escalation over 8–12 weeks).',
    'At 10.0 mg/mL, 1 unit = 0.01 mL ≈ 100 mcg on a U-100 insulin syringe.',
    'Lyophilized: freeze at −20 °C (−4 °F); after reconstitution, refrigerate at 2–8 °C (35.6–46.4 °F) for up to 4 weeks.',
    1.0::numeric, 10.0::numeric,
    'Retatrutide 10 mg vial PeptideDosages protocol', 2
  ),
  (
    20::numeric,
    'Retatrutide is dosed at 2 mg–8 mg weekly by subcutaneous injection in educational protocols, starting low and titrating monthly. A 20 mg vial reconstituted with bacteriostatic water yields about 10.0 mg/mL. This information is for research and educational use only.',
    'Add 2.0 mL bacteriostatic water → ~10.0 mg/mL concentration.',
    '2–8 mg once weekly (gradual escalation over 8–12 weeks).',
    'At 10.0 mg/mL, 1 unit = 0.01 mL ≈ 100 mcg on a U-100 insulin syringe.',
    'Lyophilized: freeze at −20 °C (−4 °F); after reconstitution, refrigerate at 2–8 °C (35.6–46.4 °F) for up to 4 weeks.',
    2.0::numeric, 10.0::numeric,
    'Retatrutide 20 mg vial PeptideDosages protocol', 3
  ),
  (
    30::numeric,
    'Retatrutide is dosed at 2 mg–8 mg weekly by subcutaneous injection in educational protocols, starting low and titrating monthly. A 30 mg vial reconstituted with bacteriostatic water yields about 10.0 mg/mL. This information is for research and educational use only.',
    'Add 3.0 mL bacteriostatic water → ~10.0 mg/mL concentration.',
    '2–8 mg once weekly (gradual escalation over 8–12 weeks).',
    'At 10.0 mg/mL, 1 unit = 0.01 mL ≈ 100 mcg on a U-100 insulin syringe.',
    'Lyophilized: freeze at −20 °C (−4 °F); after reconstitution, refrigerate at 2–8 °C (35.6–46.4 °F) for up to 4 weeks.',
    3.0::numeric, 10.0::numeric,
    'Retatrutide 30 mg vial PeptideDosages protocol', 4
  )
) as v(
  vial_size_mg, intro_text,
  highlight_reconstitute, highlight_weekly_range, highlight_measuring, highlight_storage,
  bac_water_ml, concentration_mg_per_ml, source_label, ordinal
)
  on p.slug = 'retatrutide'
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_dosage_chart_summary d
  where d.drug_id = p.id and d.vial_size_mg = v.vial_size_mg
);

-- ── 4. Reconstitution guide (add 5 mg + 30 mg; keep 10/20) ───

insert into public.drug_reconstitution_guide (
  drug_id, vial_size_mg, bac_water_ml, concentration_mg_per_ml,
  technique_notes, measurement_note,
  storage_lyophilized, storage_reconstituted, use_within, ordinal
)
select p.id, v.vial_size_mg, v.bac_water_ml, v.concentration_mg_per_ml,
  v.technique_notes, v.measurement_note,
  v.storage_lyophilized, v.storage_reconstituted, v.use_within, v.ordinal
from public.peptides p
join (values
  (
    5::numeric, 1.0::numeric, 5.0::numeric,
    'Draw 1.0 mL bacteriostatic water with a sterile syringe. Inject slowly down the vial wall; avoid foaming. Gently swirl or roll until dissolved (do not shake). Label with date and refrigerate at 2–8 °C (35.6–46.4 °F), protected from light.',
    'At 5.0 mg/mL, 1 U-100 unit = 0.01 mL = 0.05 mg (50 mcg).',
    'Store lyophilized vials at −20 °C (−4 °F) or colder. Allow to reach room temperature before reconstituting.',
    'Refrigerate at 2–8 °C (35.6–46.4 °F). Protect from light.',
    'Use within 4 weeks of reconstitution.',
    0
  ),
  (
    30::numeric, 3.0::numeric, 10.0::numeric,
    'Draw 3.0 mL bacteriostatic water with a sterile syringe. Inject slowly down the vial wall; avoid foaming. Gently swirl or roll until dissolved (do not shake). Label with date and refrigerate at 2–8 °C (35.6–46.4 °F), protected from light.',
    'At 10.0 mg/mL, 1 U-100 unit = 0.01 mL = 0.1 mg (100 mcg).',
    'Store lyophilized vials at −20 °C (−4 °F) or colder. Allow to reach room temperature before reconstituting.',
    'Refrigerate at 2–8 °C (35.6–46.4 °F). Protect from light.',
    'Use within 4 weeks of reconstitution.',
    4
  )
) as v(vial_size_mg, bac_water_ml, concentration_mg_per_ml,
       technique_notes, measurement_note, storage_lyophilized, storage_reconstituted, use_within, ordinal)
  on p.slug = 'retatrutide'
where not exists (
  select 1 from public.drug_reconstitution_guide r
  where r.drug_id = p.id and r.vial_size_mg = v.vial_size_mg
);

-- ── 5. Vial-specific dose reference tables ───────────────────

insert into public.drug_dose_reference (
  drug_id, protocol_label, phase_label, dose_mg, units_u100, volume_ml,
  vial_size_mg, concentration_mg_per_ml, source_id, ordinal
)
select p.id, v.protocol_label, v.phase_label, v.dose_mg, v.units_u100, v.volume_ml,
  v.vial_size_mg, v.concentration_mg_per_ml, s.id, v.ordinal
from public.peptides p
join (values
  -- 5 mg vial @ 5 mg/mL
  ('Standard / Gradual Approach (5 mg vial, 5 mg/mL)', 'Weeks 1–4',  2::numeric,  40, 0.40::numeric, 5::numeric, 5.0::numeric, 'Retatrutide 5 mg vial PeptideDosages protocol', 501),
  ('Standard / Gradual Approach (5 mg vial, 5 mg/mL)', 'Weeks 5–8',  4::numeric,  80, 0.80::numeric, 5::numeric, 5.0::numeric, 'Retatrutide 5 mg vial PeptideDosages protocol', 502),
  ('Standard / Gradual Approach (5 mg vial, 5 mg/mL)', 'Weeks 9–12', 6::numeric, 120, 1.20::numeric, 5::numeric, 5.0::numeric, 'Retatrutide 5 mg vial PeptideDosages protocol', 503),
  ('Standard / Gradual Approach (5 mg vial, 5 mg/mL)', 'Weeks 13+',  8::numeric, 160, 1.60::numeric, 5::numeric, 5.0::numeric, 'Retatrutide 5 mg vial PeptideDosages protocol', 504),
  ('Advanced / Aggressive Protocol (5 mg vial, 5 mg/mL)', 'Weeks 1–4',  2::numeric,  40, 0.40::numeric, 5::numeric, 5.0::numeric, 'Retatrutide 5 mg vial PeptideDosages protocol', 511),
  ('Advanced / Aggressive Protocol (5 mg vial, 5 mg/mL)', 'Weeks 5–8',  4::numeric,  80, 0.80::numeric, 5::numeric, 5.0::numeric, 'Retatrutide 5 mg vial PeptideDosages protocol', 512),
  ('Advanced / Aggressive Protocol (5 mg vial, 5 mg/mL)', 'Weeks 9–12', 8::numeric, 160, 1.60::numeric, 5::numeric, 5.0::numeric, 'Retatrutide 5 mg vial PeptideDosages protocol', 513),
  ('Advanced / Aggressive Protocol (5 mg vial, 5 mg/mL)', 'Weeks 13+', 12::numeric, 240, 2.40::numeric, 5::numeric, 5.0::numeric, 'Retatrutide 5 mg vial PeptideDosages protocol', 514),

  -- 10 mg vial @ 10 mg/mL
  ('Standard / Gradual Approach (10 mg vial, 10 mg/mL)', 'Weeks 1–4',  2::numeric,  20, 0.20::numeric, 10::numeric, 10.0::numeric, 'Retatrutide 10 mg vial PeptideDosages protocol', 601),
  ('Standard / Gradual Approach (10 mg vial, 10 mg/mL)', 'Weeks 5–8',  4::numeric,  40, 0.40::numeric, 10::numeric, 10.0::numeric, 'Retatrutide 10 mg vial PeptideDosages protocol', 602),
  ('Standard / Gradual Approach (10 mg vial, 10 mg/mL)', 'Weeks 9–12', 6::numeric,  60, 0.60::numeric, 10::numeric, 10.0::numeric, 'Retatrutide 10 mg vial PeptideDosages protocol', 603),
  ('Standard / Gradual Approach (10 mg vial, 10 mg/mL)', 'Weeks 13+',  8::numeric,  80, 0.80::numeric, 10::numeric, 10.0::numeric, 'Retatrutide 10 mg vial PeptideDosages protocol', 604),
  ('Advanced / Aggressive Protocol (10 mg vial, 10 mg/mL)', 'Weeks 1–4',  2::numeric,  20, 0.20::numeric, 10::numeric, 10.0::numeric, 'Retatrutide 10 mg vial PeptideDosages protocol', 611),
  ('Advanced / Aggressive Protocol (10 mg vial, 10 mg/mL)', 'Weeks 5–8',  4::numeric,  40, 0.40::numeric, 10::numeric, 10.0::numeric, 'Retatrutide 10 mg vial PeptideDosages protocol', 612),
  ('Advanced / Aggressive Protocol (10 mg vial, 10 mg/mL)', 'Weeks 9–12', 8::numeric,  80, 0.80::numeric, 10::numeric, 10.0::numeric, 'Retatrutide 10 mg vial PeptideDosages protocol', 613),
  ('Advanced / Aggressive Protocol (10 mg vial, 10 mg/mL)', 'Weeks 13+', 12::numeric, 120, 1.20::numeric, 10::numeric, 10.0::numeric, 'Retatrutide 10 mg vial PeptideDosages protocol', 614),

  -- 20 mg vial @ 10 mg/mL
  ('Standard / Gradual Approach (20 mg vial, 10 mg/mL)', 'Weeks 1–4',  2::numeric,  20, 0.20::numeric, 20::numeric, 10.0::numeric, 'Retatrutide 20 mg vial PeptideDosages protocol', 701),
  ('Standard / Gradual Approach (20 mg vial, 10 mg/mL)', 'Weeks 5–8',  4::numeric,  40, 0.40::numeric, 20::numeric, 10.0::numeric, 'Retatrutide 20 mg vial PeptideDosages protocol', 702),
  ('Standard / Gradual Approach (20 mg vial, 10 mg/mL)', 'Weeks 9–12', 6::numeric,  60, 0.60::numeric, 20::numeric, 10.0::numeric, 'Retatrutide 20 mg vial PeptideDosages protocol', 703),
  ('Standard / Gradual Approach (20 mg vial, 10 mg/mL)', 'Weeks 13+',  8::numeric,  80, 0.80::numeric, 20::numeric, 10.0::numeric, 'Retatrutide 20 mg vial PeptideDosages protocol', 704),
  ('Advanced / Aggressive Protocol (20 mg vial, 10 mg/mL)', 'Weeks 1–4',  2::numeric,  20, 0.20::numeric, 20::numeric, 10.0::numeric, 'Retatrutide 20 mg vial PeptideDosages protocol', 711),
  ('Advanced / Aggressive Protocol (20 mg vial, 10 mg/mL)', 'Weeks 5–8',  4::numeric,  40, 0.40::numeric, 20::numeric, 10.0::numeric, 'Retatrutide 20 mg vial PeptideDosages protocol', 712),
  ('Advanced / Aggressive Protocol (20 mg vial, 10 mg/mL)', 'Weeks 9–12', 8::numeric,  80, 0.80::numeric, 20::numeric, 10.0::numeric, 'Retatrutide 20 mg vial PeptideDosages protocol', 713),
  ('Advanced / Aggressive Protocol (20 mg vial, 10 mg/mL)', 'Weeks 13+', 12::numeric, 120, 1.20::numeric, 20::numeric, 10.0::numeric, 'Retatrutide 20 mg vial PeptideDosages protocol', 714),

  -- 30 mg vial @ 10 mg/mL
  ('Standard / Gradual Approach (30 mg vial, 10 mg/mL)', 'Weeks 1–4',  2::numeric,  20, 0.20::numeric, 30::numeric, 10.0::numeric, 'Retatrutide 30 mg vial PeptideDosages protocol', 801),
  ('Standard / Gradual Approach (30 mg vial, 10 mg/mL)', 'Weeks 5–8',  4::numeric,  40, 0.40::numeric, 30::numeric, 10.0::numeric, 'Retatrutide 30 mg vial PeptideDosages protocol', 802),
  ('Standard / Gradual Approach (30 mg vial, 10 mg/mL)', 'Weeks 9–12', 6::numeric,  60, 0.60::numeric, 30::numeric, 10.0::numeric, 'Retatrutide 30 mg vial PeptideDosages protocol', 803),
  ('Standard / Gradual Approach (30 mg vial, 10 mg/mL)', 'Weeks 13+',  8::numeric,  80, 0.80::numeric, 30::numeric, 10.0::numeric, 'Retatrutide 30 mg vial PeptideDosages protocol', 804),
  ('Advanced / Aggressive Protocol (30 mg vial, 10 mg/mL)', 'Weeks 1–4',  2::numeric,  20, 0.20::numeric, 30::numeric, 10.0::numeric, 'Retatrutide 30 mg vial PeptideDosages protocol', 811),
  ('Advanced / Aggressive Protocol (30 mg vial, 10 mg/mL)', 'Weeks 5–8',  4::numeric,  40, 0.40::numeric, 30::numeric, 10.0::numeric, 'Retatrutide 30 mg vial PeptideDosages protocol', 812),
  ('Advanced / Aggressive Protocol (30 mg vial, 10 mg/mL)', 'Weeks 9–12', 8::numeric,  80, 0.80::numeric, 30::numeric, 10.0::numeric, 'Retatrutide 30 mg vial PeptideDosages protocol', 813),
  ('Advanced / Aggressive Protocol (30 mg vial, 10 mg/mL)', 'Weeks 13+', 12::numeric, 120, 1.20::numeric, 30::numeric, 10.0::numeric, 'Retatrutide 30 mg vial PeptideDosages protocol', 814)
) as v(protocol_label, phase_label, dose_mg, units_u100, volume_ml,
       vial_size_mg, concentration_mg_per_ml, source_label, ordinal)
  on p.slug = 'retatrutide'
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_dose_reference d
  where d.drug_id = p.id
    and d.protocol_label = v.protocol_label
    and d.phase_label = v.phase_label
);

-- Backfill vial metadata on legacy retatrutide dose-reference rows
-- (Phase 2 trial tables assumed 10 mg/mL compounding math).
update public.drug_dose_reference d
set
  vial_size_mg = 10,
  concentration_mg_per_ml = 10
from public.peptides p
where d.drug_id = p.id
  and p.slug = 'retatrutide'
  and d.vial_size_mg is null
  and d.protocol_label in (
    'Concentration reference (10 mg/mL)',
    'Standard escalation (Phase 2 reference)',
    'Advanced escalation (Phase 2 high-dose arm)'
  );
