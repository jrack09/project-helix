-- ============================================================
-- 20260529130000_seed_protocol_companion.sql
-- ============================================================
-- Seeds the protocol-companion blocks for the approved incretins.
-- Idempotent: every insert guards with `where not exists` / unique
-- conflict so the migration is safe to re-run.
--
-- BPC-157 and AOD-9604 are deliberately left empty - no characterised
-- protocol / PK data exists for these non-approved peptides, so the
-- API correctly returns empty arrays / null profiles for them.
--
-- Helper convention used throughout:
--   * resolve drug:   join public.peptides p on p.slug = v.slug
--   * resolve source: scalar subquery on drug_sources by (drug_id,label)
-- ============================================================

-- ── 1. Protocol timeline ─────────────────────────────────────

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
  ('semaglutide-wegovy', 'Standard escalation', 1, 4, 'Starter phase', 0.25::numeric, 7,
    array['early appetite reduction','possible nausea','mild fatigue'],
    array['hold escalation if symptoms are difficult'],
    array['protein consistency','hydration','small meals'],
    'Wegovy prescribing information', 0),
  ('semaglutide-wegovy', 'Standard escalation', 5, 8, 'First step-up', 0.5::numeric, 7,
    array['stronger appetite suppression','GI symptoms may return briefly'],
    array['stay at dose an extra 4 weeks if not tolerating'],
    array['protein-first meals','fibre for regularity','steady fluids'],
    'Wegovy prescribing information', 1),
  ('semaglutide-wegovy', 'Standard escalation', 9, 16, 'Continued escalation', 1.0::numeric, 7,
    array['progressive weight change','appetite changes more stable'],
    array['escalate only if previous dose is well tolerated'],
    array['muscle-preserving protein','resistance activity','hydration'],
    'Wegovy prescribing information', 2),
  ('semaglutide-wegovy', 'Standard escalation', 17, NULL, 'Maintenance', 2.4::numeric, 7,
    array['weight change plateaus toward maintenance','side effects usually settle'],
    array['dose can be reduced if 2.4 mg is not tolerated'],
    array['long-term protein and fibre habits','sustainable routine'],
    'Wegovy prescribing information', 3),

  ('tirzepatide-zepbound', 'Standard escalation', 1, 4, 'Starter phase', 2.5::numeric, 7,
    array['early appetite reduction','possible nausea'],
    array['hold escalation if symptoms are difficult'],
    array['protein consistency','hydration','small meals'],
    'Zepbound prescribing information', 0),
  ('tirzepatide-zepbound', 'Standard escalation', 5, 8, 'First step-up', 5.0::numeric, 7,
    array['stronger appetite suppression','GI symptoms may return briefly'],
    array['stay at dose an extra 4 weeks if not tolerating'],
    array['protein-first meals','fibre for regularity'],
    'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'Standard escalation', 9, NULL, 'Continued escalation / maintenance', 10.0::numeric, 7,
    array['progressive weight change','appetite suppression stabilises'],
    array['escalate to 10/15 mg only if tolerated; reduce if not'],
    array['muscle-preserving protein','resistance activity','hydration'],
    'Zepbound prescribing information', 2),

  ('retatrutide', 'Trial protocol', 1, 4, 'Starter phase', 2.0::numeric, 7,
    array['early appetite reduction','possible nausea'],
    array['hold escalation if symptoms are difficult'],
    array['protein consistency','hydration','small meals'],
    'Retatrutide obesity Phase 2 trial', 0),
  ('retatrutide', 'Trial protocol', 5, 12, 'Escalation', 4.0::numeric, 7,
    array['appetite suppression strengthens','GI symptoms scale with each step'],
    array['slow escalation if GI symptoms are difficult'],
    array['protein-first meals','fibre','steady fluids'],
    'Retatrutide obesity Phase 2 trial', 1)
) as v(slug, protocol_label, week_start, week_end, phase_title, typical_dose_mg, cadence_days,
       expected_changes, common_adjustments, user_focus, source_label, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_protocol_timeline t
  where t.drug_id = p.id and t.phase_title = v.phase_title and t.week_start = v.week_start
);

-- ── 2. Dose-cycle profile (1:1) ──────────────────────────────

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
  ('semaglutide-wegovy',   8::numeric, 24::numeric, 72::numeric, 12::numeric, 96::numeric, 12::numeric, 72::numeric, 48::numeric, 168::numeric, 120::numeric,
    'Once-weekly coverage; symptom windows are population typicals, strongest in the 24-72h post-dose peak.', 'Wegovy prescribing information'),
  ('tirzepatide-zepbound', 8::numeric, 24::numeric, 72::numeric, 12::numeric, 96::numeric, 12::numeric, 72::numeric, 48::numeric, 168::numeric, 120::numeric,
    'Once-weekly dual agonist; appetite effect spans most of the weekly cycle.', 'Zepbound prescribing information'),
  ('tirzepatide-mounjaro', 8::numeric, 24::numeric, 72::numeric, 12::numeric, 96::numeric, 12::numeric, 72::numeric, 48::numeric, 168::numeric, 120::numeric,
    'Once-weekly dual agonist.', 'Mounjaro prescribing information'),
  ('retatrutide',          8::numeric, 24::numeric, 72::numeric, 12::numeric, 96::numeric, 12::numeric, 72::numeric, 48::numeric, 168::numeric, 120::numeric,
    'Trial-derived; once-weekly triple agonist.', 'Retatrutide obesity Phase 2 trial'),
  ('liraglutide-saxenda',  4::numeric, 8::numeric,  14::numeric, 4::numeric,  24::numeric, 4::numeric,  24::numeric, 12::numeric, 48::numeric,  24::numeric,
    'Daily dosing; each dose has its own short cycle, so windows are compressed.', 'Saxenda prescribing information')
) as v(slug, onset_hours, peak_min, peak_max, app_min, app_max, nau_min, nau_max, con_min, con_max, coverage, notes, source_label)
  on p.slug = v.slug
on conflict (drug_id) do nothing;

-- ── 3. Symptom playbooks (+ bands) ───────────────────────────

insert into public.drug_symptom_playbooks (drug_id, side_effect_id, symptom, source_id, ordinal)
select p.id,
  (select se.id from public.side_effects se where se.peptide_id = p.id and lower(se.effect) = lower(v.symptom) order by se.created_at limit 1),
  v.symptom,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1),
  v.ordinal
from public.peptides p
join (values
  ('semaglutide-wegovy',   'Nausea',       'Wegovy prescribing information', 0),
  ('semaglutide-wegovy',   'Constipation', 'Wegovy prescribing information', 1),
  ('tirzepatide-zepbound', 'Nausea',       'Zepbound prescribing information', 0),
  ('tirzepatide-zepbound', 'Constipation', 'Zepbound prescribing information', 1)
) as v(slug, symptom, source_label, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_symptom_playbooks pb where pb.drug_id = p.id and pb.symptom = v.symptom
);

insert into public.drug_symptom_playbook_bands (
  playbook_id, min_score, max_score, title, nutrition_strategy, hydration_strategy, avoid, escalation, ordinal
)
select pb.id, v.min_score, v.max_score, v.title, v.nutrition, v.hydration, v.avoid, v.escalation, v.ordinal
from public.drug_symptom_playbooks pb
join public.peptides p on p.id = pb.drug_id
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
where p.slug in ('semaglutide-wegovy','tirzepatide-zepbound')
  and not exists (
    select 1 from public.drug_symptom_playbook_bands b
    where b.playbook_id = pb.id and b.title = v.title
  );

-- ── 4. Food tolerance rules ──────────────────────────────────

insert into public.drug_food_tolerance_rules (drug_id, context, prefer, "limit", avoid, rationale, source_id, ordinal)
select p.id, v.context, v.prefer, v.lim, v.avoid, v.rationale,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1),
  v.ordinal
from public.peptides p
join (values
  ('semaglutide-wegovy', 'post_dose_nausea_window',
    array['lean protein','soups','Greek yoghurt','bland carbohydrates'],
    array['large portions'],
    array['fried foods','high-fat meals'],
    'Lower-fat smaller meals may be easier during nausea windows.',
    'Wegovy prescribing information', 0),
  ('semaglutide-wegovy', 'low_appetite',
    array['protein-dense foods','nutrient-dense smoothies','regular small meals'],
    array['empty-calorie snacks'],
    array['skipping protein'],
    'Protecting protein intake helps preserve muscle when appetite is low.',
    'Wegovy prescribing information', 1),
  ('semaglutide-wegovy', 'constipation',
    array['fibre-rich vegetables','prunes','whole grains'],
    array['heavily processed low-fibre foods'],
    array['inadequate fluids'],
    'Fibre plus fluids supports regularity while gastric emptying is slowed.',
    'Wegovy prescribing information', 2),
  ('tirzepatide-zepbound', 'post_dose_nausea_window',
    array['lean protein','soups','Greek yoghurt'],
    array['large portions','high-fat meals'],
    array['fried foods'],
    'Lower-fat smaller meals may be easier during nausea windows.',
    'Zepbound prescribing information', 0),
  ('tirzepatide-zepbound', 'low_appetite',
    array['protein-dense foods','nutrient-dense smoothies'],
    array['empty-calorie snacks'],
    array['skipping protein'],
    'Protein-first eating protects muscle while appetite is suppressed.',
    'Zepbound prescribing information', 1)
) as v(slug, context, prefer, lim, avoid, rationale, source_label, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_food_tolerance_rules r where r.drug_id = p.id and r.context = v.context
);

-- ── 5. Check-in protocol (+ questions) ───────────────────────

insert into public.drug_checkin_protocol (drug_id, cadence, notes, source_id)
select p.id, v.cadence, v.notes,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1)
from public.peptides p
join (values
  ('semaglutide-wegovy',   'dose_day_plus_2', 'Check in two days after each weekly dose, near the symptom peak.', 'Wegovy prescribing information'),
  ('tirzepatide-zepbound', 'dose_day_plus_2', 'Check in two days after each weekly dose.', 'Zepbound prescribing information'),
  ('retatrutide',          'dose_day_plus_2', 'Trial-style check-in two days after each weekly dose.', 'Retatrutide obesity Phase 2 trial')
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
  ('nausea_0_10',    'Nausea',          'scale_0_10', NULL,  NULL,                          7::numeric, 0),
  ('appetite_0_10',  'Appetite',        'scale_0_10', NULL,  NULL,                          NULL,       1),
  ('hydration_l',    'Hydration',       'decimal',    'L',   'if_constipation_or_nausea',   NULL,       2),
  ('bowel_0_10',     'Bowel regularity','scale_0_10', NULL,  NULL,                          NULL,       3),
  ('weight_kg',      'Weight',          'decimal',    'kg',  NULL,                          NULL,       4)
) as v(question_id, label, type, unit, condition, trigger, ordinal)
  on true
where p.slug in ('semaglutide-wegovy','tirzepatide-zepbound','retatrutide')
  and not exists (
    select 1 from public.drug_checkin_questions q
    where q.protocol_id = cp.id and q.question_id = v.question_id
  );

-- ── 6. Red-flag rules ────────────────────────────────────────

insert into public.drug_red_flag_rules (drug_id, symptom, action_level, display_copy, related_risks, source_id, ordinal)
select p.id, v.symptom, v.action_level, v.display_copy, v.related_risks,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1),
  v.ordinal
from public.peptides p
join (values
  ('semaglutide-wegovy', 'Severe abdominal pain', 'urgent_care',
    'Seek urgent medical care for severe or persistent abdominal pain, especially if it radiates to the back or comes with repeated vomiting.',
    array['pancreatitis'], 'Wegovy prescribing information', 0),
  ('semaglutide-wegovy', 'Signs of a severe allergic reaction', 'emergency',
    'Call emergency services for swelling of the face, lips, tongue or throat, trouble breathing, or fainting.',
    array['anaphylaxis'], 'Wegovy prescribing information', 1),
  ('semaglutide-wegovy', 'Persistent vomiting or signs of dehydration', 'contact_prescriber',
    'Contact your prescriber if you cannot keep fluids down, have reduced urine output, or feel lightheaded.',
    array['dehydration','acute kidney injury'], 'Wegovy prescribing information', 2),
  ('tirzepatide-zepbound', 'Severe abdominal pain', 'urgent_care',
    'Seek urgent medical care for severe or persistent abdominal pain, especially with vomiting or pain radiating to the back.',
    array['pancreatitis'], 'Zepbound prescribing information', 0),
  ('tirzepatide-zepbound', 'Signs of a severe allergic reaction', 'emergency',
    'Call emergency services for swelling of the face, lips, tongue or throat, trouble breathing, or fainting.',
    array['anaphylaxis'], 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'Persistent vomiting or signs of dehydration', 'contact_prescriber',
    'Contact your prescriber if you cannot keep fluids down, have reduced urine output, or feel lightheaded.',
    array['dehydration','acute kidney injury'], 'Zepbound prescribing information', 2)
) as v(slug, symptom, action_level, display_copy, related_risks, source_label, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_red_flag_rules r where r.drug_id = p.id and r.symptom = v.symptom
);

-- ── 7. Clinician report template (1:1) ───────────────────────

insert into public.drug_clinician_report_template (
  drug_id, key_metrics, relevant_symptoms, medication_context_label, source_id
)
select p.id, v.key_metrics, v.relevant_symptoms, v.label,
  (select s.id from public.drug_sources s where s.drug_id = p.id and s.label = v.source_label limit 1)
from public.peptides p
join (values
  ('semaglutide-wegovy',
    array['dose_adherence','weight_change','nausea_trend','missed_doses'],
    array['nausea','constipation','reflux','fatigue'],
    'GLP-1 receptor agonist', 'Wegovy prescribing information'),
  ('tirzepatide-zepbound',
    array['dose_adherence','weight_change','nausea_trend','missed_doses'],
    array['nausea','vomiting','constipation','fatigue'],
    'GIP/GLP-1 receptor agonist', 'Zepbound prescribing information'),
  ('tirzepatide-mounjaro',
    array['dose_adherence','weight_change','glucose_trend','nausea_trend'],
    array['nausea','vomiting','constipation'],
    'GIP/GLP-1 receptor agonist', 'Mounjaro prescribing information'),
  ('retatrutide',
    array['dose_adherence','weight_change','nausea_trend','missed_doses'],
    array['nausea','diarrhoea','fatigue'],
    'GIP/GLP-1/glucagon triple agonist (investigational)', 'Retatrutide obesity Phase 2 trial'),
  ('liraglutide-saxenda',
    array['dose_adherence','weight_change','nausea_trend','missed_doses'],
    array['nausea','constipation','diarrhoea'],
    'GLP-1 receptor agonist', 'Saxenda prescribing information')
) as v(slug, key_metrics, relevant_symptoms, label, source_label)
  on p.slug = v.slug
on conflict (drug_id) do nothing;
