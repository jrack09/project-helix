-- ============================================================
-- 0012_seed_tirzepatide_clinical.sql
-- ============================================================
-- End-to-end seed for both tirzepatide products:
--   • tirzepatide-zepbound  (Zepbound — weight management)
--   • tirzepatide-mounjaro  (Mounjaro — type 2 diabetes)
--
-- Same molecule, different indications and approved dose ranges.
-- Studies: SURMOUNT series for Zepbound, SURPASS series for Mounjaro.
-- Idempotent: all inserts guarded by WHERE NOT EXISTS / ON CONFLICT.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION A — Tirzepatide (Zepbound)  slug: tirzepatide-zepbound
-- ─────────────────────────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'Tirzepatide is a dual agonist at both the GLP-1 (glucagon-like peptide-1) and GIP (glucose-dependent insulinotropic polypeptide) receptors. GIP is the other major incretin hormone; activating it alongside GLP-1 appears to produce additive effects on appetite suppression, energy expenditure, and fat metabolism. In clinical trials, tirzepatide has produced larger weight reductions than any previously approved single-receptor GLP-1 agonist. The 10 mg and 15 mg doses used in Zepbound are approved for chronic weight management.',
  receptor_targets      = '["GLP-1 receptor","GIP receptor"]'::jsonb,
  evidence_score        = 88,
  contraindications     = 'Zepbound is a prescription medicine. Do not use if you have:
• A personal or family history of medullary thyroid carcinoma (MTC)
• Multiple endocrine neoplasia syndrome type 2 (MEN2)
• A known allergy or hypersensitivity to tirzepatide or any ingredient in the product

Use with caution (discuss with your prescriber) if you have:
• A history of pancreatitis
• Diabetic retinopathy
• Severe kidney or liver disease
• Active or recent eating disorder

Not recommended during pregnancy or breastfeeding. Always disclose your full medical history to your prescriber.',
  drug_interactions     = '[
    {"drug":"Insulin and insulin secretagogues (e.g. sulfonylureas)","interaction":"Increased hypoglycaemia risk. Prescribers typically reduce insulin or sulfonylurea doses when starting tirzepatide.","severity":"significant"},
    {"drug":"Oral contraceptives","interaction":"Delayed gastric emptying may reduce oral contraceptive absorption around dose escalation. Consider additional non-hormonal contraception.","severity":"moderate"},
    {"drug":"Medicines with a narrow therapeutic index (warfarin, anti-epileptics, ciclosporin)","interaction":"Altered gastric emptying can change drug absorption. Additional monitoring may be warranted.","severity":"moderate"},
    {"drug":"Alcohol","interaction":"Worsens nausea and dehydration; increases hypoglycaemia risk when combined with insulin or sulfonylureas.","severity":"moderate"}
  ]'::jsonb,
  storage_handling      = 'Store the Zepbound pen in the refrigerator at 2–8°C (36–46°F).
• After removal from the fridge: use within 21 days, keeping below 30°C.
• Do not freeze — freezing destroys the active molecule.
• Store in the original carton to protect from light.
• Do not use if the liquid looks cloudy or discoloured.',
  pharmacokinetics      = '{
    "half_life":"Approximately 5 days, supporting once-weekly subcutaneous dosing.",
    "tmax":"8–72 hours after a subcutaneous injection.",
    "bioavailability_note":"~80% bioavailability after subcutaneous injection. Highly bound to albumin, which contributes to the long half-life.",
    "clearance":"Degraded via proteolytic pathways; renal and hepatic dose adjustments are not required for mild-to-moderate impairment."
  }'::jsonb
where slug = 'tirzepatide-zepbound';

-- Expectations
insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'Starting Zepbound',
       'Zepbound begins at 2.5 mg weekly for 4 weeks — a tolerability step, not the therapeutic dose. Most people do not notice significant appetite suppression at this dose.',
       true),
  (4,  'First dose escalation to 5 mg',
       'The dose increases to 5 mg at week 5, held for 4 weeks. Nausea or mild GI effects may appear around escalation steps — they usually settle within 1–2 weeks.',
       true),
  (20, 'Reaching a maintenance dose',
       'After monthly escalation steps (2.5 → 5 → 7.5 → 10 → 12.5 → 15 mg), most people reach 10 or 15 mg by 20 weeks. Your prescriber may hold you at an intermediate dose if side effects persist.',
       true),
  (52, 'SURMOUNT-1 primary endpoint',
       'At 72 weeks, SURMOUNT-1 participants on 15 mg averaged 22.5% body-weight reduction versus 2.4% for placebo. At 52 weeks meaningful separation from placebo was well established across all dose arms.',
       true),
  (72, 'SURMOUNT-3 intensive lifestyle context',
       'SURMOUNT-3 showed that starting tirzepatide after an intensive low-calorie diet run-in amplified weight loss — participants averaged 26.6% at 72 weeks on 15 mg. Continued lifestyle support alongside the medicine makes a measurable difference.',
       true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'tirzepatide-zepbound'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- Food guidance
insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('prefer', 'Lean protein at every meal',        'Helps preserve muscle during caloric deficit — especially important given the magnitude of weight loss tirzepatide can produce.', 'editorial', 1),
  ('prefer', 'High-fibre vegetables',             'Supports gut health and helps manage constipation, a common effect.', 'editorial', 2),
  ('prefer', 'Slow-digesting carbohydrates',      'Legumes and whole grains provide sustained energy when total intake is reduced.', 'editorial', 3),
  ('prefer', 'Small, frequent meals',             'Slowed gastric emptying means large meals are less tolerable — spreading intake helps.', 'editorial', 4),
  ('limit',  'Fried and very fatty foods',        'A well-documented GI trigger with GIP/GLP-1 dual agonism; may exacerbate nausea.', 'editorial', 5),
  ('limit',  'Large meal portions',               'Satiety arrives faster — eating past comfort is a common driver of GI side effects.', 'editorial', 6),
  ('limit',  'Sugary drinks and desserts',        'Reduce their value to appetite cues the medicine is amplifying.', 'editorial', 7),
  ('avoid',  'Binge drinking',                    'Worsens dehydration and nausea; may increase hypoglycaemia risk with other diabetes medicines.', 'editorial', 8),
  ('hydrate','Water spread through the day',      'Inadequate fluids worsen constipation and dizziness — both reported AEs in SURMOUNT trials.', 'editorial', 9),
  ('hydrate','Electrolyte drinks if GI symptoms significant', 'Short-term electrolyte replacement can help during vomiting or diarrhoea — discuss with your prescriber.', 'editorial', 10)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'tirzepatide-zepbound'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- Tips
insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('administration', 'The escalation schedule exists for a reason',
   'Tirzepatide has six dose steps before reaching 15 mg. Each step is held for 4 weeks to let your GI system adapt. Skipping steps significantly increases nausea and vomiting risk. Your prescriber may keep you at a lower dose if it achieves your goals — higher is not automatically better.',
   1),
  ('nutrition', 'Protein targets matter more as weight loss accelerates',
   'SURMOUNT-1 participants losing 20%+ of body weight were also losing lean mass. Aim for 1.2–1.6 g protein per kg body weight daily. If appetite is very low, protein supplements (shakes, Greek yoghurt, cottage cheese) help hit the target without large portions.',
   2),
  ('other', 'GI side effects peak during dose escalation',
   'In SURMOUNT-1, discontinuation due to GI events was ~4–7%. Most GI adverse events were mild-to-moderate and resolved. If nausea or vomiting is severe or lasts more than a few days at a new dose, contact your prescriber — a dose hold is preferable to discontinuation.',
   3),
  ('timing', 'Inject on the same day each week',
   'If you need to change your injection day, take the dose on the new day and continue from there — as long as the gap between doses is at least 3 days. Do not double-dose.',
   4),
  ('mindset', 'Weight loss may continue slowly past the expected plateau',
   'SURMOUNT trial data showed weight loss curves that had not fully flattened by 72 weeks at the highest doses. Sustained treatment produced continued, slower reduction for many participants.',
   5),
  ('other', 'Tell every healthcare provider you are using Zepbound',
   'Delayed gastric emptying affects preparation for surgical procedures, anaesthesia, and the timing of some medications. Always declare it before any procedure, even a dental extraction.',
   6)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'tirzepatide-zepbound'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION B — Tirzepatide (Mounjaro)  slug: tirzepatide-mounjaro
-- ─────────────────────────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'Tirzepatide is a dual GLP-1 / GIP receptor agonist. GIP (glucose-dependent insulinotropic polypeptide) is the predominant incretin in healthy individuals; combining GIP and GLP-1 agonism produces greater glycaemic improvement and weight reduction than either target alone. In Mounjaro, doses of 5–15 mg weekly are used to improve blood sugar control in type 2 diabetes. Its glucose-dependent mechanism substantially reduces hypoglycaemia risk when used without additional insulin.',
  receptor_targets      = '["GLP-1 receptor","GIP receptor"]'::jsonb,
  evidence_score        = 90,
  contraindications     = 'Mounjaro is a prescription medicine. Do not use if you have:
• A personal or family history of medullary thyroid carcinoma (MTC)
• Multiple endocrine neoplasia syndrome type 2 (MEN2)
• A known allergy or hypersensitivity to tirzepatide or any ingredient in the product

Use with caution (discuss with your prescriber) if you have:
• A history of pancreatitis
• Diabetic retinopathy — discuss risk of transient worsening with rapid glycaemic improvement
• Severe kidney or liver disease

Not recommended during pregnancy or breastfeeding. Always disclose your full medical history.',
  drug_interactions     = '[
    {"drug":"Insulin and sulfonylureas","interaction":"Significantly increased hypoglycaemia risk in combination. Prescribers typically reduce insulin or sulfonylurea doses on initiation.","severity":"significant"},
    {"drug":"Oral contraceptives","interaction":"Slowed gastric emptying may reduce oral contraceptive absorption. Consider additional contraception around dose escalation.","severity":"moderate"},
    {"drug":"Narrow therapeutic index medicines","interaction":"Altered gastric emptying may affect drug absorption timing. Monitor INR or drug levels as appropriate.","severity":"moderate"},
    {"drug":"Alcohol","interaction":"Increases hypoglycaemia risk, especially with other diabetes medicines; worsens nausea.","severity":"moderate"}
  ]'::jsonb,
  storage_handling      = 'Store the Mounjaro pen in the refrigerator at 2–8°C (36–46°F).
• After removal: use within 21 days at room temperature below 30°C.
• Do not freeze.
• Store in the original carton protected from light.
• Discard the pen after single use — do not share.',
  pharmacokinetics      = '{
    "half_life":"Approximately 5 days, which supports once-weekly subcutaneous dosing.",
    "tmax":"8–72 hours after subcutaneous injection.",
    "bioavailability_note":"~80% after subcutaneous injection; highly albumin-bound.",
    "clearance":"Proteolytic degradation; not primarily hepatically or renally cleared as intact drug — no dose adjustment for mild-moderate renal or hepatic impairment."
  }'::jsonb
where slug = 'tirzepatide-mounjaro';

-- Expectations
insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'Starting at 2.5 mg',
       'Mounjaro begins at 2.5 mg weekly for 4 weeks — a tolerability step. Blood sugar improvement becomes more noticeable from 5 mg onward.',
       true),
  (8,  'HbA1c and fasting glucose begin responding',
       'In SURPASS-2, meaningful fasting glucose reductions were seen within the first 8 weeks at the lower doses. Your prescriber will likely check HbA1c at around 3 months.',
       true),
  (20, 'Reaching therapeutic maintenance dose',
       'Most people are at 10–15 mg by 20 weeks. Your prescriber may keep you at a lower dose if glycaemic targets are met — tolerability matters more than reaching maximum dose.',
       true),
  (52, 'One-year glycaemic review',
       'In SURPASS-2, HbA1c reductions of up to −2.3% were maintained at 40 weeks with 15 mg, significantly exceeding semaglutide 1 mg. Annual HbA1c review will help your prescriber decide whether dose adjustments are needed.',
       true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'tirzepatide-mounjaro'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- Food guidance (diabetes-context version)
insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('prefer', 'Low-GI carbohydrates',               'Legumes, rolled oats, and most vegetables minimise post-meal glucose excursions alongside Mounjaro.', 'editorial', 1),
  ('prefer', 'Lean protein at each meal',          'Supports satiety and lean mass; minimally affects blood glucose.', 'editorial', 2),
  ('prefer', 'Consistent meal timing',             'Helps stabilise blood glucose patterns and aids GI tolerability.', 'editorial', 3),
  ('prefer', 'High-fibre foods',                   'Supports gut motility, especially if constipation is a problem.', 'editorial', 4),
  ('limit',  'Refined carbohydrates and sweets',   'Can produce large glucose peaks even with tirzepatide present.', 'editorial', 5),
  ('limit',  'Large, high-fat meals',              'Can worsen nausea; a common trigger during dose escalation.', 'editorial', 6),
  ('limit',  'Skipping meals if using insulin or sulfonylureas', 'Increases hypoglycaemia risk when other glucose-lowering agents are present.', 'editorial', 7),
  ('avoid',  'Binge drinking',                     'Masks hypoglycaemia symptoms and worsens GI side effects.', 'editorial', 8),
  ('hydrate','Water and unsweetened fluids',        'Supports kidney function and GI tolerability.', 'editorial', 9)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'tirzepatide-mounjaro'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- Tips
insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('other', 'Know your hypoglycaemia risk profile',
   'On its own, Mounjaro rarely causes low blood sugar because it only stimulates insulin in response to elevated glucose. However, if you are also taking insulin or a sulfonylurea, the combination significantly increases that risk. Your prescriber should adjust those doses — do not adjust them yourself.',
   1),
  ('administration', 'Stick to the four-week escalation steps',
   'Each dose step is four weeks because it takes time for steady-state blood levels to be reached (half-life ~5 days). Rushing escalation increases GI side effects without improving efficacy.',
   2),
  ('other', 'Have your eyes checked before and during treatment',
   'Rapid blood sugar improvement — especially from a high HbA1c baseline — can occasionally cause transient worsening of diabetic retinopathy. Attend your scheduled retinal screening and tell your ophthalmologist you have started Mounjaro.',
   3),
  ('nutrition', 'Distribute carbohydrates evenly across meals',
   'Spreading carbohydrate intake rather than loading one meal produces smoother glucose curves alongside the incretin mechanism of Mounjaro. A dietitian experienced in diabetes can help personalise this.',
   4),
  ('other', 'Inform all medical teams including surgeons and anaesthetists',
   'Delayed gastric emptying matters for procedures requiring fasting. Declare Mounjaro use before any procedure, elective or emergency.',
   5)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'tirzepatide-mounjaro'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION C — Studies
-- ─────────────────────────────────────────────────────────────

-- C1. SURMOUNT-1 — Jastreboff, NEJM 2022 (Zepbound obesity)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Tirzepatide Once Weekly for the Treatment of Obesity (SURMOUNT-1)',
  'New England Journal of Medicine',
  '2022-06-04',
  'human', 2539,
  'Adults with obesity (BMI ≥30) or overweight (BMI ≥27) with ≥1 weight-related condition, without type 2 diabetes',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2206038',
  '10.1056/NEJMoa2206038',
  '2,539 adults were randomised to tirzepatide 5, 10, or 15 mg once weekly or placebo for 72 weeks. Mean body-weight change was −15.0%, −19.5%, and −20.9% at 5, 10, and 15 mg respectively, versus −3.1% for placebo. More than 89% of participants on 15 mg achieved ≥5% weight loss. Adverse events were predominantly mild-to-moderate GI events.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1056/NEJMoa2206038');

-- C2. SURMOUNT-3 — Wadden, Nature Medicine 2023 (intensified lifestyle + tirzepatide)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Randomized Trial of Tirzepatide after Intensive Lifestyle Intervention (SURMOUNT-3)',
  'Nature Medicine',
  '2023-10-13',
  'human', 806,
  'Adults with obesity or overweight plus comorbidity, without type 2 diabetes; after 12-week intensive lifestyle run-in',
  'https://www.nature.com/articles/s41591-023-02597-w',
  '10.1038/s41591-023-02597-w',
  '806 adults who had completed a 12-week intensive lifestyle intervention were randomised to tirzepatide 15 mg weekly or placebo for 72 weeks. Mean total weight loss from before the lifestyle run-in was −26.6% with tirzepatide versus −3.8% with placebo, demonstrating additive effects of combining intensive lifestyle support with pharmacotherapy.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1038/s41591-023-02597-w');

-- C3. SURPASS-2 — Frías, NEJM 2021 (Mounjaro vs semaglutide in T2D)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Tirzepatide versus Semaglutide Once Weekly in Patients with Type 2 Diabetes (SURPASS-2)',
  'New England Journal of Medicine',
  '2021-06-25',
  'human', 1879,
  'Adults with type 2 diabetes inadequately controlled on metformin',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2107519',
  '10.1056/NEJMoa2107519',
  '1,879 adults with type 2 diabetes on metformin were randomised to tirzepatide 5, 10, or 15 mg weekly or semaglutide 1 mg weekly for 40 weeks. HbA1c reductions were −2.01%, −2.24%, and −2.30% for tirzepatide versus −1.86% for semaglutide 1 mg. Body-weight reductions were −7.6, −9.3, and −11.2 kg versus −5.7 kg. All tirzepatide doses were non-inferior; 10 mg and 15 mg were superior to semaglutide.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1056/NEJMoa2107519');

-- ─────────────────────────────────────────────────────────────
-- SECTION D — Link studies to peptides
-- ─────────────────────────────────────────────────────────────

insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'tirzepatide-zepbound'
  and s.doi in ('10.1056/NEJMoa2206038', '10.1038/s41591-023-02597-w', '10.1056/NEJMoa2107519')
  and not exists (select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id);

insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'tirzepatide-mounjaro'
  and s.doi in ('10.1056/NEJMoa2107519')
  and not exists (select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id);

-- ─────────────────────────────────────────────────────────────
-- SECTION E — Study dosages
-- ─────────────────────────────────────────────────────────────

-- SURMOUNT-1 arms (Zepbound)
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, v.dosage_value, 'mg', 'once weekly subcutaneous', '72 weeks', v.context_note
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2206038'
cross join (values
  (2.5,  'Starting dose for all arms; held 4 weeks as tolerability run-in.'),
  (5.0,  '5 mg maintenance arm — or escalation step 2 for higher arms.'),
  (10.0, '10 mg maintenance arm.'),
  (15.0, 'Highest dose arm in SURMOUNT-1; reached via 2.5→5→7.5→10→12.5→15 mg escalation.')
) as v(dosage_value, context_note)
where p.slug = 'tirzepatide-zepbound'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = v.dosage_value
  );

-- SURPASS-2 arms (Mounjaro)
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, v.dosage_value, 'mg', 'once weekly subcutaneous', '40 weeks', v.context_note
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2107519'
cross join (values
  (5.0,  'Lowest tirzepatide arm in SURPASS-2; after 2.5 mg run-in.'),
  (10.0, 'Mid dose arm.'),
  (15.0, 'Highest dose arm — superior to semaglutide 1 mg on both HbA1c and weight.')
) as v(dosage_value, context_note)
where p.slug = 'tirzepatide-mounjaro'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = v.dosage_value
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION F — Study outcomes
-- ─────────────────────────────────────────────────────────────

-- SURMOUNT-1 (Zepbound)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2206038'
cross join (values
  ('weight_loss',   'Mean body-weight reductions of 15.0%, 19.5%, and 20.9% at 5, 10, and 15 mg respectively at 72 weeks, versus 3.1% with placebo.', 'Primary outcome'),
  ('responder_rate','More than 89% of participants on 15 mg achieved ≥5% weight loss; 56% achieved ≥20%.', 'Secondary'),
  ('cardiometabolic','Improvements in waist circumference, blood pressure, lipids, and fasting glucose observed across all dose arms.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'tirzepatide-zepbound'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- SURMOUNT-3 (Zepbound)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1038/s41591-023-02597-w'
cross join (values
  ('weight_loss', 'Total mean body-weight loss of 26.6% from pre-run-in baseline with tirzepatide 15 mg at 72 weeks, versus 3.8% with placebo.', 'Primary outcome'),
  ('weight_loss', 'Intensive lifestyle intervention prior to starting tirzepatide amplified total weight loss beyond pharmacotherapy alone.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'tirzepatide-zepbound'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- SURPASS-2 (Mounjaro)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2107519'
cross join (values
  ('hba1c_reduction','HbA1c reductions of −2.01%, −2.24%, −2.30% at 5, 10, 15 mg tirzepatide, versus −1.86% for semaglutide 1 mg at 40 weeks.', 'Primary outcome'),
  ('weight_loss',    'Body-weight reductions of 7.6, 9.3, and 11.2 kg at 5, 10, 15 mg versus 5.7 kg for semaglutide 1 mg.', 'Secondary'),
  ('comparator',     'Tirzepatide 10 mg and 15 mg were superior to semaglutide 1 mg on both HbA1c reduction and body weight; all doses met non-inferiority.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'tirzepatide-mounjaro'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION G — Side effects
-- ─────────────────────────────────────────────────────────────

-- Zepbound: from SURMOUNT-1 (15 mg arm)
insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, v.effect, v.severity, v.frequency
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2206038'
cross join (values
  ('Nausea',                    'mild-to-moderate', '~35% at 15 mg; most common during dose escalation'),
  ('Diarrhoea',                 'mild-to-moderate', '~30%'),
  ('Vomiting',                  'mild-to-moderate', '~25%'),
  ('Constipation',              'mild',             '~25%'),
  ('Abdominal pain',            'mild',             '~20%'),
  ('Decreased appetite',        'mild',             'Frequently reported — often the intended effect'),
  ('Injection-site reaction',   'mild',             'Mild; generally transient'),
  ('Increased heart rate',      'mild',             'Small average increase across dose arms'),
  ('Dyspepsia',                 'mild',             'Reported; dose-related'),
  ('Alopecia (hair thinning)',  'mild',             'Reported in weight-loss trials; believed to be related to rapid weight loss rather than the drug itself')
) as v(effect, severity, frequency)
where p.slug = 'tirzepatide-zepbound'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = v.effect
  );

-- Mounjaro: from SURPASS-2
insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, v.effect, v.severity, v.frequency
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2107519'
cross join (values
  ('Nausea',                 'mild-to-moderate', 'Common; most frequent during dose escalation'),
  ('Diarrhoea',              'mild-to-moderate', 'Common'),
  ('Vomiting',               'mild',             'Reported'),
  ('Constipation',           'mild',             'Reported'),
  ('Decreased appetite',     'mild',             'Common; generally an intended effect for weight management'),
  ('Hypoglycaemia',          'mild-to-moderate', 'Higher incidence when combined with insulin or sulfonylurea'),
  ('Injection-site reaction','mild',             'Generally mild and transient')
) as v(effect, severity, frequency)
where p.slug = 'tirzepatide-mounjaro'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = v.effect
  );
