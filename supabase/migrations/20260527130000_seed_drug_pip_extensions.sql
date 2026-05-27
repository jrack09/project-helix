-- ============================================================
-- 20260527130000_seed_drug_pip_extensions.sql
-- ============================================================
-- Backfills PIP-extension fields added in 20260527120000:
--   * numeric pharmacokinetics on peptides
--   * is_red_flag tagging on existing drug_warnings
--   * drug_side_effect_windows
--   * drug_injection_sites
--   * drug_oral_administration (currently empty - no oral
--     formulations in catalogue; table seeded only when added)
--
-- Numeric PK values are approximate, drawn from each drug's
-- prescribing information or published Phase 2 trial data.
-- Free-text pharmacokinetics JSON remains the source of nuance.
-- ============================================================

-- ── 1. Numeric pharmacokinetics ──────────────────────────────

update public.peptides set
  half_life_hours          = 165,  -- ~1 week
  tmax_hours               = 48,
  duration_of_action_hours = 168
where slug in ('semaglutide-ozempic','semaglutide-wegovy');

update public.peptides set
  half_life_hours          = 120,  -- ~5 days
  tmax_hours               = 48,
  duration_of_action_hours = 168
where slug in ('tirzepatide-zepbound','tirzepatide-mounjaro');

update public.peptides set
  half_life_hours          = 13,
  tmax_hours               = 10,
  duration_of_action_hours = 24
where slug = 'liraglutide-saxenda';

update public.peptides set
  half_life_hours          = 144,  -- ~6 days
  tmax_hours               = 48,
  duration_of_action_hours = 168
where slug = 'retatrutide';

update public.peptides set
  half_life_hours          = 168,  -- ~7 days
  tmax_hours               = 72,
  duration_of_action_hours = 168
where slug = 'cagrilintide';

update public.peptides set
  half_life_hours          = 84,   -- ~3.5 days
  tmax_hours               = 60,
  duration_of_action_hours = 168
where slug = 'mazdutide';

-- BPC-157 and AOD-9604: human PK not characterised; leave null.

-- ── 2. Tag red-flag warnings ─────────────────────────────────
-- Promotes existing boxed_warning + urgent warnings whose title
-- describes a symptom needing urgent escalation.

update public.drug_warnings
set is_red_flag = true
where severity in ('boxed_warning','urgent')
  and (
       lower(title) like '%pancreatitis%'
    or lower(title) like '%abdominal pain%'
    or lower(title) like '%allergic%'
    or lower(title) like '%gallbladder%'
    or lower(title) like '%thyroid%'
    or lower(title) like '%hypoglycaemia%'
    or lower(title) like '%hypoglycemia%'
    or lower(title) like '%dehydration%'
    or lower(title) like '%gi symptoms%'
  );

-- ── 3. Injection sites (subcutaneous GLP-1 / dual / triple) ──

insert into public.drug_injection_sites (
  drug_id, site, preferred, rotation_guidance, avoid_notes, source_id, ordinal
)
select p.id, v.site, v.preferred, v.rotation_guidance, v.avoid_notes, s.id, v.ordinal
from public.peptides p
join (values
  -- abdomen (preferred), thigh, upper arm for all weekly GLP-1 / dual / triple agonists
  ('semaglutide-ozempic',   'abdomen',   true,  'Rotate weekly between abdomen, thigh and upper arm. Keep at least 2 cm from the navel and at least 2.5 cm from the previous site.', 'Avoid skin that is bruised, tender, scarred or hardened.', 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic',   'thigh',     false, 'Front of the thigh, midway between hip and knee.', 'Avoid the inner thigh.', 'Ozempic prescribing information', 2),
  ('semaglutide-ozempic',   'upper_arm', false, 'Back of the upper arm; usually needs a helper to inject.', 'Avoid the muscle - use the fatty layer just under the skin.', 'Ozempic prescribing information', 3),

  ('semaglutide-wegovy',    'abdomen',   true,  'Rotate weekly between abdomen, thigh and upper arm. Keep at least 2 cm from the navel and at least 2.5 cm from the previous site.', 'Avoid skin that is bruised, tender, scarred or hardened.', 'Wegovy prescribing information', 1),
  ('semaglutide-wegovy',    'thigh',     false, 'Front of the thigh, midway between hip and knee.', 'Avoid the inner thigh.', 'Wegovy prescribing information', 2),
  ('semaglutide-wegovy',    'upper_arm', false, 'Back of the upper arm; usually needs a helper to inject.', 'Avoid the muscle - use the fatty layer just under the skin.', 'Wegovy prescribing information', 3),

  ('tirzepatide-zepbound',  'abdomen',   true,  'Rotate weekly between abdomen, thigh and upper arm.', 'Avoid skin that is bruised, tender, scarred or hardened.', 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound',  'thigh',     false, 'Front of the thigh, midway between hip and knee.', null, 'Zepbound prescribing information', 2),
  ('tirzepatide-zepbound',  'upper_arm', false, 'Back of the upper arm; usually needs a helper.', null, 'Zepbound prescribing information', 3),

  ('tirzepatide-mounjaro',  'abdomen',   true,  'Rotate weekly between abdomen, thigh and upper arm.', 'Avoid skin that is bruised, tender, scarred or hardened.', 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro',  'thigh',     false, 'Front of the thigh, midway between hip and knee.', null, 'Mounjaro prescribing information', 2),
  ('tirzepatide-mounjaro',  'upper_arm', false, 'Back of the upper arm; usually needs a helper.', null, 'Mounjaro prescribing information', 3),

  ('liraglutide-saxenda',   'abdomen',   true,  'Rotate daily between abdomen, thigh and upper arm. Move at least 2.5 cm from the prior site each day.', 'Avoid skin that is bruised, tender, scarred or hardened.', 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda',   'thigh',     false, 'Front of the thigh.', null, 'Saxenda prescribing information', 2),
  ('liraglutide-saxenda',   'upper_arm', false, 'Back of the upper arm.', null, 'Saxenda prescribing information', 3),

  ('retatrutide',           'abdomen',   true,  'Trial protocol rotates weekly across abdomen, thigh and upper arm; follow trial-site instruction.', 'Investigational use only - follow trial-site rotation directions.', 'Retatrutide obesity Phase 2 trial', 1),
  ('retatrutide',           'thigh',     false, 'Front of the thigh.', null, 'Retatrutide obesity Phase 2 trial', 2),
  ('retatrutide',           'upper_arm', false, 'Back of the upper arm.', null, 'Retatrutide obesity Phase 2 trial', 3),

  ('cagrilintide',          'abdomen',   true,  'Trial protocol rotates weekly across abdomen, thigh and upper arm; follow trial-site instruction.', 'Investigational use only.', 'Cagrilintide Phase 2 dose-finding trial', 1),
  ('cagrilintide',          'thigh',     false, 'Front of the thigh.', null, 'Cagrilintide Phase 2 dose-finding trial', 2),

  ('mazdutide',             'abdomen',   true,  'Trial protocol rotates weekly across abdomen, thigh and upper arm.', 'Investigational outside approved regions.', 'Mazdutide type 2 diabetes Phase 2 trial', 1),
  ('mazdutide',             'thigh',     false, 'Front of the thigh.', null, 'Mazdutide type 2 diabetes Phase 2 trial', 2)
) as v(slug, site, preferred, rotation_guidance, avoid_notes, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
on conflict (drug_id, site) do nothing;

-- ── 4. Side-effect timing windows ────────────────────────────
-- Captures typical onset / peak / resolution for the dominant
-- GI side effects of incretin therapies. Numbers are population
-- typicals from trial pharmacology, not individual predictions.

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
  -- Weekly GLP-1 / dual / triple agonists: GI effects cluster
  -- in the first 24-72h post-dose and after each escalation step.
  ('semaglutide-ozempic',  'Nausea',          1,  24, 24, 72, 14::numeric, 'Most pronounced after the first dose and after each escalation step; usually settles within 1-2 weeks at a stable dose.', 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic',  'Vomiting',        2,  24, 24, 72, 7::numeric,  'Typically follows the same window as nausea; if persistent beyond 48h or unable to keep fluids down, contact prescriber.', 'Ozempic prescribing information', 2),
  ('semaglutide-ozempic',  'Diarrhoea',       4,  48, 24, 96, 7::numeric,  'May alternate with constipation across the weekly cycle.', 'Ozempic prescribing information', 3),
  ('semaglutide-ozempic',  'Constipation',    24, 96, 48, 168, 14::numeric, 'Driven by slowed gastric emptying; usually improves with hydration and fibre.', 'Ozempic prescribing information', 4),

  ('semaglutide-wegovy',   'Nausea',          1,  24, 24, 72, 14::numeric, 'Most pronounced after first dose and each escalation step.', 'Wegovy prescribing information', 1),
  ('semaglutide-wegovy',   'Vomiting',        2,  24, 24, 72, 7::numeric,  'Same window as nausea; persistent vomiting needs prescriber contact.', 'Wegovy prescribing information', 2),

  ('tirzepatide-zepbound', 'Nausea',          1,  24, 24, 72, 14::numeric, 'Typically peaks 1-3 days post-injection; eases at stable maintenance dose.', 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'Diarrhoea',       4,  48, 24, 96, 7::numeric,  null, 'Zepbound prescribing information', 2),

  ('tirzepatide-mounjaro', 'Nausea',          1,  24, 24, 72, 14::numeric, null, 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro', 'Diarrhoea',       4,  48, 24, 96, 7::numeric,  null, 'Mounjaro prescribing information', 2),

  ('liraglutide-saxenda',  'Nausea',          1,  12, 6,  24, 28::numeric, 'Daily dosing means each escalation step has its own settling period; full tolerance can take ~4 weeks.', 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda',  'Vomiting',        2,  12, 6,  24, 14::numeric, null, 'Saxenda prescribing information', 2),

  ('retatrutide',          'Nausea',          1,  24, 24, 72, 14::numeric, 'Trial data; intensity scales with dose escalation step.', 'Retatrutide obesity Phase 2 trial', 1),
  ('retatrutide',          'Vomiting',        2,  24, 24, 72, 7::numeric,  null, 'Retatrutide obesity Phase 2 trial', 2),

  ('cagrilintide',         'Nausea',          1,  24, 24, 72, 14::numeric, 'Amylin-pathway nausea typically settles faster than GLP-1 nausea once tolerated.', 'Cagrilintide Phase 2 dose-finding trial', 1),

  ('mazdutide',            'Nausea',          1,  24, 24, 72, 14::numeric, 'Trial data; pattern resembles other GLP-1/glucagon agonists.', 'Mazdutide type 2 diabetes Phase 2 trial', 1)
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
