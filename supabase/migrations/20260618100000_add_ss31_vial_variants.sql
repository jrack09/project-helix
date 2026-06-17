-- ============================================================
-- 20260618100000_add_ss31_vial_variants.sql
-- ============================================================
-- SS-31 is one peptide/drug identity, but the editorial protocols
-- are published for several vial sizes. Keep a single `ss-31` slug
-- and expose vial-specific reconstitution and syringe conversion
-- rows so clients can render a vial selector instead of creating
-- duplicate peptides.
-- ============================================================

alter table public.drug_dose_reference
  add column if not exists vial_size_mg numeric,
  add column if not exists concentration_mg_per_ml numeric,
  add column if not exists source_id uuid references public.drug_sources(id) on delete set null;

-- Sources for the additional SS-31 vial-size protocols.
insert into public.drug_sources (
  drug_id, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal
)
select p.id, v.source_type, v.label, v.url, v.region, v.authority, v.citation_text, v.retrieved_at::date, v.ordinal
from public.peptides p
join (values
  ('ss-31', 'editorial', 'SS-31 30 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/ss-31-30-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for SS-31 30 mg vial; not the FDA-approved Forzinity label.', '2026-06-18', 3),
  ('ss-31', 'editorial', 'SS-31 50 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/ss-31-50-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for SS-31 50 mg vial; not the FDA-approved Forzinity label.', '2026-06-18', 4)
) as v(slug, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_sources s
  where s.drug_id = p.id and s.label = v.label
);

-- Backfill metadata on the SS-31 dose-reference rows from the first
-- SS-31 migration. These rows are for the 10 mg research vial unless
-- they describe the approved Forzinity ready-to-use reference.
update public.drug_dose_reference d
set
  vial_size_mg = 10,
  concentration_mg_per_ml = 10,
  source_id = s.id
from public.peptides p
left join public.drug_sources s
  on s.drug_id = p.id
 and s.label = 'SS-31 10 mg vial PeptideDosages protocol'
where d.drug_id = p.id
  and p.slug = 'ss-31'
  and d.protocol_label in (
    'Editorial 10 mg vial standard protocol (10 mg/mL)',
    'Editorial 10 mg vial advanced protocol (10 mg/mL)'
  );

update public.drug_dose_reference d
set
  vial_size_mg = null,
  concentration_mg_per_ml = 80,
  source_id = s.id
from public.peptides p
left join public.drug_sources s
  on s.drug_id = p.id
 and s.label = 'Forzinity prescribing information'
where d.drug_id = p.id
  and p.slug = 'ss-31'
  and d.protocol_label = 'Forzinity label reference (80 mg/mL ready-to-use)';

-- Reconstitution variants. 10 mg already exists from the first SS-31
-- seed; add the 30 mg and 50 mg editorial vial sizes.
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
  ('ss-31', 30::numeric, 3.0::numeric, 10.0::numeric,
    'Editorial 30 mg vial protocol: add 3.0 mL bacteriostatic water slowly down the vial wall, avoid vigorous shaking, gently swirl or roll until clear, label with reconstitution date, protect from light, and refrigerate.',
    'At 10 mg/mL, 1 U-100 unit = 0.01 mL = 0.1 mg (100 mcg). This matches the 10 mg vial concentration, but the vial contains more total doses.',
    'Editorial protocol describes frozen lyophilized storage around -20 C, protected from light and moisture.',
    'Refrigerate reconstituted solution at 2-8 C and protect from light.',
    'Editorial page describes use within 4 weeks.',
    2),
  ('ss-31', 50::numeric, 3.0::numeric, 16.67::numeric,
    'Editorial 50 mg vial protocol: add 3.0 mL bacteriostatic water slowly down the vial wall, avoid vigorous shaking, gently swirl or roll until clear, label with reconstitution date, protect from light, and refrigerate.',
    'At about 16.67 mg/mL, 1 U-100 unit = 0.01 mL = about 0.167 mg (167 mcg). This changes the units for the same mg dose versus 10 mg/mL vials.',
    'Editorial protocol describes frozen lyophilized storage around -20 C, protected from light and moisture.',
    'Refrigerate reconstituted solution at 2-8 C and protect from light.',
    'Editorial page describes use within 4 weeks.',
    3)
) as v(slug, vial_size_mg, bac_water_ml, concentration_mg_per_ml,
       technique_notes, measurement_note, storage_lyophilized, storage_reconstituted, use_within, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_reconstitution_guide r
  where r.drug_id = p.id
    and r.vial_size_mg = v.vial_size_mg
    and r.bac_water_ml = v.bac_water_ml
);

-- Vial-specific dose conversion tables. The dose schedule is the same
-- editorial protocol; the syringe units/volume change with concentration.
insert into public.drug_dose_reference (
  drug_id, protocol_label, phase_label, dose_mg, units_u100, volume_ml,
  vial_size_mg, concentration_mg_per_ml, source_id, ordinal
)
select p.id, v.protocol_label, v.phase_label, v.dose_mg, v.units_u100, v.volume_ml,
  v.vial_size_mg, v.concentration_mg_per_ml, s.id, v.ordinal
from public.peptides p
join (values
  ('ss-31', 'Editorial 30 mg vial standard protocol (10 mg/mL)', 'Weeks 1-2', 5::numeric, 50, 0.50::numeric, 30::numeric, 10.0::numeric, 'SS-31 30 mg vial PeptideDosages protocol', 110),
  ('ss-31', 'Editorial 30 mg vial standard protocol (10 mg/mL)', 'Weeks 3-8', 10::numeric, 100, 1.00::numeric, 30::numeric, 10.0::numeric, 'SS-31 30 mg vial PeptideDosages protocol', 120),
  ('ss-31', 'Editorial 30 mg vial advanced protocol (10 mg/mL)', 'Weeks 1-2', 5::numeric, 50, 0.50::numeric, 30::numeric, 10.0::numeric, 'SS-31 30 mg vial PeptideDosages protocol', 130),
  ('ss-31', 'Editorial 30 mg vial advanced protocol (10 mg/mL)', 'Weeks 3-4', 10::numeric, 100, 1.00::numeric, 30::numeric, 10.0::numeric, 'SS-31 30 mg vial PeptideDosages protocol', 140),
  ('ss-31', 'Editorial 30 mg vial advanced protocol (10 mg/mL)', 'Weeks 5-8 split injection reference', 15::numeric, 150, 1.50::numeric, 30::numeric, 10.0::numeric, 'SS-31 30 mg vial PeptideDosages protocol', 150),
  ('ss-31', 'Editorial 30 mg vial advanced protocol (10 mg/mL)', 'Optional weeks 9-12 split injection reference', 20::numeric, 200, 2.00::numeric, 30::numeric, 10.0::numeric, 'SS-31 30 mg vial PeptideDosages protocol', 160),

  ('ss-31', 'Editorial 50 mg vial standard protocol (16.67 mg/mL)', 'Weeks 1-2', 5::numeric, 30, 0.30::numeric, 50::numeric, 16.67::numeric, 'SS-31 50 mg vial PeptideDosages protocol', 210),
  ('ss-31', 'Editorial 50 mg vial standard protocol (16.67 mg/mL)', 'Weeks 3-8', 10::numeric, 60, 0.60::numeric, 50::numeric, 16.67::numeric, 'SS-31 50 mg vial PeptideDosages protocol', 220),
  ('ss-31', 'Editorial 50 mg vial advanced protocol (16.67 mg/mL)', 'Weeks 1-2', 5::numeric, 30, 0.30::numeric, 50::numeric, 16.67::numeric, 'SS-31 50 mg vial PeptideDosages protocol', 230),
  ('ss-31', 'Editorial 50 mg vial advanced protocol (16.67 mg/mL)', 'Weeks 3-4', 10::numeric, 60, 0.60::numeric, 50::numeric, 16.67::numeric, 'SS-31 50 mg vial PeptideDosages protocol', 240),
  ('ss-31', 'Editorial 50 mg vial advanced protocol (16.67 mg/mL)', 'Weeks 5-8', 15::numeric, 90, 0.90::numeric, 50::numeric, 16.67::numeric, 'SS-31 50 mg vial PeptideDosages protocol', 250),
  ('ss-31', 'Editorial 50 mg vial advanced protocol (16.67 mg/mL)', 'Optional weeks 9-12 split injection reference (2 x 60 units)', 20::numeric, 120, 1.20::numeric, 50::numeric, 16.67::numeric, 'SS-31 50 mg vial PeptideDosages protocol', 260)
) as v(slug, protocol_label, phase_label, dose_mg, units_u100, volume_ml,
       vial_size_mg, concentration_mg_per_ml, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_dose_reference d
  where d.drug_id = p.id
    and d.protocol_label = v.protocol_label
    and d.phase_label = v.phase_label
);
