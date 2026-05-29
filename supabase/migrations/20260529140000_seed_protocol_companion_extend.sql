-- ============================================================
-- 20260529140000_seed_protocol_companion_extend.sql
-- ============================================================
-- Broadens protocol-companion coverage beyond the two flagship
-- drugs seeded in 20260529130000. Fills the remaining approved /
-- investigational incretins across all seven blocks.
--
-- Append-only and idempotent (every insert guards on `where not
-- exists` / `on conflict do nothing`), so it is safe to re-run and
-- never disturbs hand-edited or AI-generated rows already present.
--
-- BPC-157 and AOD-9604 remain intentionally untouched — no
-- characterised protocol/PK data exists for them.
-- ============================================================

-- ── 1. Protocol timeline ─────────────────────────────────────
-- Weekly incretins share the same escalation shape; daily liraglutide
-- gets its own cadence.

insert into public.drug_protocol_timeline (
  drug_id, protocol_label, week_start, week_end, phase_title,
  typical_dose_mg, cadence_days, expected_changes, common_adjustments, user_focus, source_id, ordinal
)
select p.id, v.protocol_label, v.week_start, v.week_end, v.phase_title,
  v.typical_dose_mg, v.cadence_days, v.expected_changes, v.common_adjustments, v.user_focus,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1),
  v.ordinal
from public.peptides p
join (values
  -- semaglutide (Ozempic) — weekly, T2D titration
  ('semaglutide-ozempic', 'Standard titration', 1, 4, 'Starter phase', 0.25::numeric, 7,
    array['early appetite reduction','possible nausea'],
    array['hold escalation if symptoms are difficult'],
    array['protein consistency','hydration','small meals'], 'Ozempic prescribing information', 0),
  ('semaglutide-ozempic', 'Standard titration', 5, 8, 'First step-up', 0.5::numeric, 7,
    array['glucose control improves','appetite suppression strengthens'],
    array['stay at dose longer if not tolerating'],
    array['protein-first meals','fibre for regularity'], 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic', 'Standard titration', 9, NULL, 'Maintenance', 1.0::numeric, 7,
    array['steady glucose and appetite control','side effects usually settle'],
    array['1 mg or 2 mg maintenance per prescriber'],
    array['consistent meal timing','hydration'], 'Ozempic prescribing information', 2),

  -- tirzepatide (Mounjaro) — weekly
  ('tirzepatide-mounjaro', 'Standard escalation', 1, 4, 'Starter phase', 2.5::numeric, 7,
    array['early appetite reduction','possible nausea'],
    array['hold escalation if symptoms are difficult'],
    array['protein consistency','hydration','small meals'], 'Mounjaro prescribing information', 0),
  ('tirzepatide-mounjaro', 'Standard escalation', 5, 8, 'First step-up', 5.0::numeric, 7,
    array['stronger appetite suppression','GI symptoms may return briefly'],
    array['stay at dose an extra 4 weeks if not tolerating'],
    array['protein-first meals','fibre for regularity'], 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro', 'Standard escalation', 9, NULL, 'Continued escalation / maintenance', 10.0::numeric, 7,
    array['progressive glucose and weight change'],
    array['escalate to 10/15 mg only if tolerated; reduce if not'],
    array['muscle-preserving protein','resistance activity'], 'Mounjaro prescribing information', 2),

  -- liraglutide (Saxenda) — daily
  ('liraglutide-saxenda', 'Standard daily escalation', 1, 1, 'Week 1', 0.6::numeric, 1,
    array['early appetite reduction','possible nausea'],
    array['extend a step if GI symptoms are difficult'],
    array['protein consistency','hydration','small meals'], 'Saxenda prescribing information', 0),
  ('liraglutide-saxenda', 'Standard daily escalation', 2, 4, 'Weekly step-ups', 1.8::numeric, 1,
    array['appetite suppression strengthens with each step'],
    array['slow the weekly increase if not tolerating'],
    array['protein-first meals','fibre for regularity'], 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda', 'Standard daily escalation', 5, NULL, 'Maintenance', 3.0::numeric, 1,
    array['steady appetite control at target dose'],
    array['stay at 2.4 mg if 3.0 mg is not tolerated'],
    array['daily routine','hydration'], 'Saxenda prescribing information', 2),

  -- mazdutide — trial
  ('mazdutide', 'Trial protocol', 1, 4, 'Starter phase', 3.0::numeric, 7,
    array['early appetite reduction','possible nausea'],
    array['hold escalation if symptoms are difficult'],
    array['protein consistency','hydration','small meals'], 'Mazdutide type 2 diabetes Phase 2 trial', 0),
  ('mazdutide', 'Trial protocol', 5, NULL, 'Escalation', 6.0::numeric, 7,
    array['appetite suppression strengthens','GI symptoms scale with each step'],
    array['slow escalation if GI symptoms are difficult'],
    array['protein-first meals','fibre','steady fluids'], 'Mazdutide type 2 diabetes Phase 2 trial', 1),

  -- cagrilintide — trial
  ('cagrilintide', 'Trial protocol', 1, 4, 'Starter phase', 0.3::numeric, 7,
    array['early appetite reduction','possible nausea'],
    array['hold escalation if symptoms are difficult'],
    array['protein consistency','hydration','small meals'], 'Cagrilintide Phase 2 dose-finding trial', 0),
  ('cagrilintide', 'Trial protocol', 5, NULL, 'Escalation', 1.2::numeric, 7,
    array['appetite suppression strengthens'],
    array['slow escalation if nausea or vomiting is difficult'],
    array['protein-first meals','steady fluids'], 'Cagrilintide Phase 2 dose-finding trial', 1)
) as v(slug, protocol_label, week_start, week_end, phase_title, typical_dose_mg, cadence_days,
       expected_changes, common_adjustments, user_focus, source_label, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_protocol_timeline t
  where t.drug_id = p.id and t.phase_title = v.phase_title and t.week_start = v.week_start
);

-- ── 2. Dose-cycle profile (fill the gaps) ────────────────────

insert into public.drug_dose_cycle_profile (
  drug_id, onset_hours, peak_effect_hours_min, peak_effect_hours_max,
  appetite_effect_window_min, appetite_effect_window_max,
  nausea_risk_window_min, nausea_risk_window_max,
  constipation_risk_window_min, constipation_risk_window_max,
  coverage_fades_after_hours, notes, source_id
)
select p.id, v.onset_hours, v.peak_min, v.peak_max,
  v.app_min, v.app_max, v.nau_min, v.nau_max, v.con_min, v.con_max,
  v.coverage, v.notes,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1)
from public.peptides p
join (values
  ('semaglutide-ozempic', 8::numeric, 24::numeric, 72::numeric, 12::numeric, 96::numeric, 12::numeric, 72::numeric, 48::numeric, 168::numeric, 120::numeric,
    'Once-weekly; symptom windows strongest in the 24-72h post-dose peak.', 'Ozempic prescribing information'),
  ('mazdutide', 8::numeric, 24::numeric, 72::numeric, 12::numeric, 96::numeric, 12::numeric, 72::numeric, 48::numeric, 168::numeric, 120::numeric,
    'Trial-derived; once-weekly dual agonist.', 'Mazdutide type 2 diabetes Phase 2 trial'),
  ('cagrilintide', 12::numeric, 24::numeric, 96::numeric, 24::numeric, 120::numeric, 12::numeric, 96::numeric, 48::numeric, 168::numeric, 144::numeric,
    'Trial-derived; long-acting amylin analogue with extended appetite coverage.', 'Cagrilintide Phase 2 dose-finding trial')
) as v(slug, onset_hours, peak_min, peak_max, app_min, app_max, nau_min, nau_max, con_min, con_max, coverage, notes, source_label)
  on p.slug = v.slug
on conflict (drug_id) do nothing;

-- ── 3. Symptom playbooks (+ generic bands) ───────────────────
-- Add Nausea + Constipation playbooks for the remaining incretins.

insert into public.drug_symptom_playbooks (drug_id, side_effect_id, symptom, source_id, ordinal)
select p.id,
  (select se.id from public.side_effects se where se.peptide_id = p.id and lower(se.effect) = lower(v.symptom) order by se.created_at limit 1),
  v.symptom,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1),
  v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic',  'Nausea',       'Ozempic prescribing information', 0),
  ('semaglutide-ozempic',  'Constipation', 'Ozempic prescribing information', 1),
  ('tirzepatide-mounjaro', 'Nausea',       'Mounjaro prescribing information', 0),
  ('tirzepatide-mounjaro', 'Constipation', 'Mounjaro prescribing information', 1),
  ('retatrutide',          'Nausea',       'Retatrutide obesity Phase 2 trial', 0),
  ('liraglutide-saxenda',  'Nausea',       'Saxenda prescribing information', 0),
  ('liraglutide-saxenda',  'Constipation', 'Saxenda prescribing information', 1),
  ('mazdutide',            'Nausea',       'Mazdutide type 2 diabetes Phase 2 trial', 0),
  ('cagrilintide',         'Nausea',       'Cagrilintide Phase 2 dose-finding trial', 0)
) as v(slug, symptom, source_label, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_symptom_playbooks pb where pb.drug_id = p.id and pb.symptom = v.symptom
);

-- Generic, source-agnostic bands applied to ANY playbook (across the
-- whole catalogue) that matches the symptom and has no bands yet. This
-- backfills bands for both the rows above and any AI-seeded playbooks.

insert into public.drug_symptom_playbook_bands (
  playbook_id, min_score, max_score, title, nutrition_strategy, hydration_strategy, avoid, escalation, ordinal
)
select pb.id, v.min_score, v.max_score, v.title, v.nutrition, v.hydration, v.avoid, v.escalation, v.ordinal
from public.drug_symptom_playbooks pb
join (values
  ('Nausea', 1::numeric, 3::numeric, 'Mild nausea',
    array['smaller meals','lower-fat foods','bland carbohydrates'],
    array['sip fluids steadily'],
    array['large greasy meals'],
    NULL, 0),
  ('Nausea', 4::numeric, 6::numeric, 'Moderate nausea',
    array['protein-first small meals','cold or room-temperature foods','ginger'],
    array['small frequent sips','oral rehydration if not eating well'],
    array['high-fat meals','strong cooking smells','lying down right after eating'],
    'If you cannot keep fluids down for more than 24 hours, contact your prescriber.', 1),
  ('Nausea', 7::numeric, 10::numeric, 'Severe nausea',
    array['focus on fluids over food until it settles'],
    array['oral rehydration solution'],
    array['solid heavy meals'],
    'Persistent vomiting, inability to keep fluids down, or signs of dehydration need prompt medical advice.', 2),
  ('Constipation', 1::numeric, 4::numeric, 'Mild constipation',
    array['gradually increase fibre','prunes / kiwifruit','regular meal timing'],
    array['increase water intake'],
    array['low-fibre processed foods'],
    NULL, 0),
  ('Constipation', 5::numeric, 10::numeric, 'Marked constipation',
    array['soluble fibre','consider a prescriber-approved gentle laxative'],
    array['increase fluids further'],
    array['ignoring the urge to go'],
    'Severe abdominal pain, no bowel movement for several days, or vomiting needs medical assessment.', 1)
) as v(symptom, min_score, max_score, title, nutrition, hydration, avoid, escalation, ordinal)
  on pb.symptom = v.symptom
where not exists (
  select 1 from public.drug_symptom_playbook_bands b where b.playbook_id = pb.id and b.title = v.title
);

-- ── 4. Food tolerance rules ──────────────────────────────────

insert into public.drug_food_tolerance_rules (drug_id, context, prefer, "limit", avoid, rationale, source_id, ordinal)
select p.id, v.context, v.prefer, v.lim, v.avoid, v.rationale,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1),
  v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic',  'post_dose_nausea_window',
    array['lean protein','soups','Greek yoghurt','bland carbohydrates'], array['large portions'], array['fried foods','high-fat meals'],
    'Lower-fat smaller meals may be easier during nausea windows.', 'Ozempic prescribing information', 0),
  ('semaglutide-ozempic',  'low_appetite',
    array['protein-dense foods','nutrient-dense smoothies'], array['empty-calorie snacks'], array['skipping protein'],
    'Protein-first eating protects muscle while appetite is suppressed.', 'Ozempic prescribing information', 1),
  ('tirzepatide-mounjaro', 'post_dose_nausea_window',
    array['lean protein','soups','Greek yoghurt'], array['large portions','high-fat meals'], array['fried foods'],
    'Lower-fat smaller meals may be easier during nausea windows.', 'Mounjaro prescribing information', 0),
  ('tirzepatide-mounjaro', 'constipation',
    array['fibre-rich vegetables','prunes','whole grains'], array['heavily processed low-fibre foods'], array['inadequate fluids'],
    'Fibre plus fluids supports regularity while gastric emptying is slowed.', 'Mounjaro prescribing information', 1),
  ('liraglutide-saxenda',  'post_dose_nausea_window',
    array['lean protein','soups','bland carbohydrates'], array['large portions'], array['fried foods','high-fat meals'],
    'Daily dosing means smaller lower-fat meals help most in the hours after each dose.', 'Saxenda prescribing information', 0),
  ('retatrutide',          'post_dose_nausea_window',
    array['lean protein','soups','Greek yoghurt'], array['large portions','high-fat meals'], array['fried foods'],
    'Lower-fat smaller meals may be easier during nausea windows.', 'Retatrutide obesity Phase 2 trial', 0),
  ('mazdutide',            'post_dose_nausea_window',
    array['lean protein','soups','Greek yoghurt'], array['large portions','high-fat meals'], array['fried foods'],
    'Lower-fat smaller meals may be easier during nausea windows.', 'Mazdutide type 2 diabetes Phase 2 trial', 0),
  ('cagrilintide',         'post_dose_nausea_window',
    array['lean protein','soups','Greek yoghurt'], array['large portions','high-fat meals'], array['fried foods'],
    'Lower-fat smaller meals may be easier during nausea windows.', 'Cagrilintide Phase 2 dose-finding trial', 0)
) as v(slug, context, prefer, lim, avoid, rationale, source_label, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_food_tolerance_rules r where r.drug_id = p.id and r.context = v.context
);

-- ── 5. Check-in protocol (+ standard questions) ──────────────

insert into public.drug_checkin_protocol (drug_id, cadence, notes, source_id)
select p.id, v.cadence, v.notes,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1)
from public.peptides p
join (values
  ('semaglutide-ozempic',  'dose_day_plus_2', 'Check in two days after each weekly dose, near the symptom peak.', 'Ozempic prescribing information'),
  ('tirzepatide-mounjaro', 'dose_day_plus_2', 'Check in two days after each weekly dose.', 'Mounjaro prescribing information'),
  ('liraglutide-saxenda',  'daily',           'Daily dosing — a short daily check-in fits the cadence.', 'Saxenda prescribing information'),
  ('mazdutide',            'dose_day_plus_2', 'Trial-style check-in two days after each weekly dose.', 'Mazdutide type 2 diabetes Phase 2 trial'),
  ('cagrilintide',         'dose_day_plus_2', 'Trial-style check-in two days after each weekly dose.', 'Cagrilintide Phase 2 dose-finding trial')
) as v(slug, cadence, notes, source_label)
  on p.slug = v.slug
on conflict (drug_id) do nothing;

insert into public.drug_checkin_questions (
  protocol_id, question_id, label, type, unit, condition, trigger_guidance_from_score, ordinal
)
select cp.id, v.question_id, v.label, v.type, v.unit, v.condition, v.trigger, v.ordinal
from public.drug_checkin_protocol cp
join public.peptides p on p.id = cp.drug_id
join (values
  ('nausea_0_10',    'Nausea',          'scale_0_10', NULL, NULL,                        7::numeric, 0),
  ('appetite_0_10',  'Appetite',        'scale_0_10', NULL, NULL,                        NULL,       1),
  ('hydration_l',    'Hydration',       'decimal',    'L',  'if_constipation_or_nausea', NULL,       2),
  ('bowel_0_10',     'Bowel regularity','scale_0_10', NULL, NULL,                        NULL,       3),
  ('weight_kg',      'Weight',          'decimal',    'kg', NULL,                        NULL,       4)
) as v(question_id, label, type, unit, condition, trigger, ordinal)
  on true
where p.slug in ('semaglutide-ozempic','tirzepatide-mounjaro','liraglutide-saxenda','mazdutide','cagrilintide')
  and not exists (
    select 1 from public.drug_checkin_questions q where q.protocol_id = cp.id and q.question_id = v.question_id
  );

-- ── 6. Red-flag rules ────────────────────────────────────────

insert into public.drug_red_flag_rules (drug_id, symptom, action_level, display_copy, related_risks, source_id, ordinal)
select p.id, v.symptom, v.action_level, v.display_copy, v.related_risks,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1),
  v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic',  'Severe abdominal pain', 'urgent_care',
    'Seek urgent medical care for severe or persistent abdominal pain, especially if it radiates to the back or comes with repeated vomiting.',
    array['pancreatitis'], 'Ozempic prescribing information', 0),
  ('semaglutide-ozempic',  'Signs of a severe allergic reaction', 'emergency',
    'Call emergency services for swelling of the face, lips, tongue or throat, trouble breathing, or fainting.',
    array['anaphylaxis'], 'Ozempic prescribing information', 1),
  ('tirzepatide-mounjaro', 'Severe abdominal pain', 'urgent_care',
    'Seek urgent medical care for severe or persistent abdominal pain, especially with vomiting or pain radiating to the back.',
    array['pancreatitis'], 'Mounjaro prescribing information', 0),
  ('tirzepatide-mounjaro', 'Signs of a severe allergic reaction', 'emergency',
    'Call emergency services for swelling of the face, lips, tongue or throat, trouble breathing, or fainting.',
    array['anaphylaxis'], 'Mounjaro prescribing information', 1),
  ('liraglutide-saxenda',  'Severe abdominal pain', 'urgent_care',
    'Seek urgent medical care for severe or persistent abdominal pain, especially with vomiting or pain radiating to the back.',
    array['pancreatitis'], 'Saxenda prescribing information', 0),
  ('retatrutide',          'Severe abdominal pain', 'urgent_care',
    'Stop dosing and seek urgent medical assessment for severe or persistent abdominal pain, especially if it radiates to the back.',
    array['pancreatitis'], 'Retatrutide obesity Phase 2 trial', 0),
  ('retatrutide',          'Signs of a severe allergic reaction', 'emergency',
    'Seek emergency care for swelling of the face, lips, tongue or throat, breathing difficulty, fainting, or widespread rash.',
    array['anaphylaxis'], 'Retatrutide obesity Phase 2 trial', 1),
  ('mazdutide',            'Severe persistent abdominal pain', 'urgent_care',
    'Severe or persistent abdominal pain, especially with vomiting, needs urgent medical assessment.',
    array['pancreatitis','gallbladder disease'], 'Mazdutide type 2 diabetes Phase 2 trial', 0),
  ('cagrilintide',         'Severe persistent vomiting or dehydration', 'contact_prescriber',
    'Contact your prescriber for repeated vomiting, inability to keep fluids down, lightheadedness or reduced urine output.',
    array['dehydration'], 'Cagrilintide Phase 2 dose-finding trial', 0)
) as v(slug, symptom, action_level, display_copy, related_risks, source_label, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_red_flag_rules r where r.drug_id = p.id and r.symptom = v.symptom
);

-- ── 7. Clinician report template (fill the gaps) ─────────────

insert into public.drug_clinician_report_template (
  drug_id, key_metrics, relevant_symptoms, medication_context_label, source_id
)
select p.id, v.key_metrics, v.relevant_symptoms, v.label,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1)
from public.peptides p
join (values
  ('semaglutide-ozempic',
    array['dose_adherence','glucose_trend','weight_change','nausea_trend'],
    array['nausea','constipation','reflux','fatigue'],
    'GLP-1 receptor agonist', 'Ozempic prescribing information'),
  ('mazdutide',
    array['dose_adherence','weight_change','glucose_trend','nausea_trend'],
    array['nausea','vomiting','diarrhoea'],
    'GLP-1/glucagon dual agonist (investigational)', 'Mazdutide type 2 diabetes Phase 2 trial'),
  ('cagrilintide',
    array['dose_adherence','weight_change','nausea_trend','missed_doses'],
    array['nausea','vomiting','reduced appetite'],
    'Long-acting amylin analogue (investigational)', 'Cagrilintide Phase 2 dose-finding trial')
) as v(slug, key_metrics, relevant_symptoms, label, source_label)
  on p.slug = v.slug
on conflict (drug_id) do nothing;
