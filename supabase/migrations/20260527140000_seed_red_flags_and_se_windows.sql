-- ============================================================
-- 20260527140000_seed_red_flags_and_se_windows.sql
-- ============================================================
-- Closes the gaps surfaced by the /admin/drugs/coverage page:
--   1. Adds explicit red-flag warnings (is_red_flag=true) for the
--      investigational / unapproved drugs whose existing warnings
--      didn't match the symptom-keyword tagger.
--   2. Extends side-effect timing windows so every approved
--      incretin has at least nausea + vomiting + diarrhoea seeded
--      (filling out the matrix beyond first-pass nausea-only rows).
--
-- BPC-157 and AOD-9604 PK columns remain null deliberately - no
-- characterised human pharmacokinetic data exists.
-- ============================================================

-- ── 1. Red-flag warnings for investigational drugs ───────────

insert into public.drug_warnings (drug_id, severity, title, body, is_red_flag, source_id, ordinal)
select p.id, v.severity, v.title, v.body, true, s.id, v.ordinal
from public.peptides p
join (values
  ('retatrutide',  'urgent', 'Severe abdominal pain',         'Stop dosing and seek urgent medical assessment for severe or persistent abdominal pain, especially if it radiates to the back or is accompanied by repeated vomiting - possible pancreatitis.', 'Retatrutide obesity Phase 2 trial', 10),
  ('retatrutide',  'urgent', 'Signs of severe allergic reaction', 'Seek emergency care for swelling of the face, lips, tongue or throat, breathing difficulty, fainting, or widespread rash after dosing.', 'Retatrutide obesity Phase 2 trial', 11),

  ('cagrilintide', 'urgent', 'Severe persistent vomiting or dehydration', 'Repeated vomiting, inability to keep fluids down, lightheadedness or reduced urine output needs urgent assessment - trial sites monitor dehydration closely on amylin-pathway therapies.', 'Cagrilintide Phase 2 dose-finding trial', 10),
  ('cagrilintide', 'urgent', 'Severe abdominal pain',         'Seek urgent medical advice for severe or persistent abdominal pain, especially with vomiting or pain radiating to the back.', 'CagriSema Phase 2 trial', 11),

  ('mazdutide',    'urgent', 'Severe allergic reaction',      'Seek emergency care for swelling of the face, lips, tongue or throat, breathing difficulty, fainting, or widespread rash.', 'Mazdutide type 2 diabetes Phase 2 trial', 10),
  ('mazdutide',    'urgent', 'Severe persistent abdominal pain', 'Severe or persistent abdominal pain, especially with vomiting or pain radiating to the back, needs urgent medical assessment - possible pancreatitis or gallbladder disease.', 'Mazdutide type 2 diabetes Phase 2 trial', 11),

  ('bpc-157',      'urgent', 'Any unexpected systemic reaction', 'Any unexpected systemic reaction (rash, swelling, breathing difficulty, severe pain) after using a non-approved peptide is a red flag - stop use and seek urgent medical care. Bring the vial and any lot/batch information.', 'FDA warning on compounding BPC-157', 10),

  ('aod-9604',     'urgent', 'Any unexpected systemic reaction', 'Any unexpected systemic reaction (rash, swelling, breathing difficulty, chest pain, fainting) after using a non-approved peptide is a red flag - stop use and seek urgent medical care.', 'TGA AOD-9604 scheduling and food context', 10)
) as v(slug, severity, title, body, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_warnings w
  where w.drug_id = p.id and w.title = v.title
);

-- Belt-and-braces: re-run the keyword tagger so any newly seeded
-- warnings that happen to match also get the flag set.

update public.drug_warnings
set is_red_flag = true
where is_red_flag = false
  and severity in ('boxed_warning','urgent')
  and (
       lower(title) like '%pancreatitis%'
    or lower(title) like '%abdominal pain%'
    or lower(title) like '%allergic%'
    or lower(title) like '%gallbladder%'
    or lower(title) like '%thyroid%'
    or lower(title) like '%hypoglycaemia%'
    or lower(title) like '%hypoglycemia%'
    or lower(title) like '%dehydration%'
    or lower(title) like '%systemic reaction%'
  );

-- ── 2. Extend side-effect timing windows ─────────────────────
-- Adds vomiting + diarrhoea for the incretins that only had
-- nausea seeded in the first pass.

insert into public.drug_side_effect_windows (
  drug_id, side_effect_id, effect,
  onset_hours_min, onset_hours_max,
  peak_hours_min, peak_hours_max,
  resolution_days_typical, notes, source_id, ordinal
)
select p.id, se.id, v.effect,
  v.onset_hours_min, v.onset_hours_max,
  v.peak_hours_min, v.peak_hours_max,
  v.resolution_days_typical, v.notes, s.id, v.ordinal
from public.peptides p
join (values
  ('semaglutide-wegovy',   'Diarrhoea',    4, 48, 24, 96, 7::numeric,  'May alternate with constipation across the weekly cycle.', 'Wegovy prescribing information', 3),
  ('semaglutide-wegovy',   'Constipation', 24, 96, 48, 168, 14::numeric, 'Driven by slowed gastric emptying.', 'Wegovy prescribing information', 4),

  ('tirzepatide-zepbound', 'Vomiting',     2, 24, 24, 72, 7::numeric,  null, 'Zepbound prescribing information', 3),
  ('tirzepatide-mounjaro', 'Vomiting',     2, 24, 24, 72, 7::numeric,  null, 'Mounjaro prescribing information', 3),

  ('retatrutide',          'Diarrhoea',    4, 48, 24, 96, 7::numeric,  'Trial data; scales with dose escalation step.', 'Retatrutide obesity Phase 2 trial', 3),

  ('cagrilintide',         'Vomiting',     2, 24, 24, 72, 7::numeric,  'Trial data.', 'Cagrilintide Phase 2 dose-finding trial', 2),

  ('mazdutide',            'Vomiting',     2, 24, 24, 72, 7::numeric,  'Trial data; pattern resembles other dual agonists.', 'Mazdutide type 2 diabetes Phase 2 trial', 2),

  ('liraglutide-saxenda',  'Diarrhoea',    4, 24, 12, 48, 7::numeric,  'Daily dosing means each escalation step has its own tolerance window.', 'Saxenda prescribing information', 3)
) as v(slug, effect, onset_hours_min, onset_hours_max, peak_hours_min, peak_hours_max, resolution_days_typical, notes, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
left join lateral (
  select id from public.side_effects
  where peptide_id = p.id and lower(effect) = lower(v.effect)
  order by created_at limit 1
) se on true
where not exists (
  select 1 from public.drug_side_effect_windows w
  where w.drug_id = p.id and w.effect = v.effect
);
