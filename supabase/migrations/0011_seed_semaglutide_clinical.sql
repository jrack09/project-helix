-- ============================================================
-- 0011_seed_semaglutide_clinical.sql
-- ============================================================
-- End-to-end seed for both semaglutide products:
--   • semaglutide-wegovy  (Wegovy 2.4 mg — weight management)
--   • semaglutide-ozempic (Ozempic 0.5/1/2 mg — type 2 diabetes)
--
-- They share the same molecule, so mechanism/PK/contraindications
-- are consistent. Studies are product-specific (STEP for Wegovy,
-- SUSTAIN for Ozempic). Companion content (expectations, food,
-- tips) is variant-specific where doses and indications differ.
--
-- Idempotent: all inserts guarded by WHERE NOT EXISTS / ON CONFLICT.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION A — Semaglutide (Wegovy)  slug: semaglutide-wegovy
-- ─────────────────────────────────────────────────────────────

-- ── A1. Peptide row ──────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'Semaglutide is a GLP-1 (glucagon-like peptide-1) receptor agonist — a synthetic analogue of the naturally occurring gut hormone GLP-1. It binds to GLP-1 receptors in the pancreas, brain, and gut, which increases glucose-dependent insulin secretion, suppresses glucagon, slows gastric emptying, and reduces appetite via central hypothalamic pathways. The 2.4 mg once-weekly dose used in Wegovy delivers higher receptor exposure than the lower doses used for type 2 diabetes, producing larger and more sustained reductions in appetite and body weight.',
  receptor_targets      = '["GLP-1 receptor"]'::jsonb,
  evidence_score        = 85,
  contraindications     = 'Wegovy is a prescription medicine. Do not use if you have:
• A personal or family history of medullary thyroid carcinoma (MTC)
• Multiple endocrine neoplasia syndrome type 2 (MEN2)
• A known allergy or hypersensitivity to semaglutide or any ingredient in the product
• Had serious hypersensitivity reactions to other GLP-1 receptor agonists

Use with caution (discuss with your prescriber) if you have:
• A history of pancreatitis
• Diabetic retinopathy — rapid glucose improvement can transiently worsen retinal changes
• Severe kidney or liver disease
• Active or recent eating disorder

Not recommended during pregnancy or breastfeeding. Always provide your full medical history to your prescriber before starting.',
  drug_interactions     = '[
    {"drug":"Insulin and insulin secretagogues (e.g. sulfonylureas)","interaction":"Increased risk of hypoglycaemia. Your prescriber may reduce your insulin or sulfonylurea dose when starting or escalating Wegovy.","severity":"significant"},
    {"drug":"Oral contraceptives","interaction":"Semaglutide slows gastric emptying, which may transiently reduce the absorption of oral contraceptives during dose escalation. Consider additional non-hormonal contraception around dose changes.","severity":"moderate"},
    {"drug":"Medicines with narrow therapeutic index (e.g. warfarin, ciclosporin, some anti-epileptics)","interaction":"Delayed gastric emptying can alter the absorption rate of orally administered medicines. Monitoring of drug levels or INR may be warranted.","severity":"moderate"},
    {"drug":"Alcohol","interaction":"Alcohol can worsen nausea (already a common GLP-1 effect) and increase the risk of hypoglycaemia.","severity":"moderate"}
  ]'::jsonb,
  storage_handling      = 'Store the Wegovy pen in the refrigerator at 2–8°C (36–46°F) until first use.
• After first use, or if stored out of the refrigerator: use within 28 days, keeping below 30°C and away from direct heat and light.
• Never freeze the pen — freezing destroys the active molecule.
• Keep the cap on the pen when not in use.
• Store away from children.
• Do not use the pen if it has been dropped, damaged, or if the liquid looks cloudy, discoloured, or contains particles.',
  pharmacokinetics      = '{
    "half_life":"Approximately 1 week (7 days), which is why it is dosed once weekly.",
    "tmax":"24–72 hours after a subcutaneous injection — peak concentration typically occurs 1–3 days post-dose.",
    "bioavailability_note":"High systemic exposure after subcutaneous injection; approximately 89% bound to albumin in plasma, which contributes to the long half-life.",
    "clearance":"Degraded via proteolytic cleavage and fatty acid oxidation — not primarily renally or hepatically cleared as an intact molecule. Dose adjustment for mild-moderate renal impairment is not required."
  }'::jsonb
where slug = 'semaglutide-wegovy';

-- ── A2. Expectations ─────────────────────────────────────────

insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'Starting your first injection',
       'Wegovy begins at 0.25 mg weekly for the first four weeks — lower than the long-term target dose. This period is about tolerability, not weight loss. Many people notice reduced appetite within the first week.',
       true),
  (4,  'First dose escalation',
       'The dose steps up to 0.5 mg weekly in weeks 5–8. Some people experience mild nausea or reduced appetite around each dose increase — this usually settles within a week or two.',
       true),
  (16, 'Reaching the target maintenance dose',
       'After four escalation steps over 16 weeks, the target dose is 2.4 mg weekly. Not everyone reaches 2.4 mg — your prescriber may hold you at an intermediate dose if side effects persist.',
       true),
  (20, 'Meaningful weight changes',
       'In the STEP 1 trial, participants were seeing clear separation from placebo by 20 weeks. Many people report that appetite suppression feels more settled at the maintenance dose — smaller portions, less drive to snack.',
       true),
  (68, 'STEP 1 trial primary endpoint',
       'At 68 weeks, STEP 1 participants on 2.4 mg averaged a 15.0% body-weight reduction versus 2.4% for placebo. The STEP 5 trial showed this was largely maintained at 2 years (104 weeks) with continued treatment.',
       true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- ── A3. Food guidance ────────────────────────────────────────

insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('prefer', 'Lean protein at every meal',          'Supports lean muscle mass during appetite-driven weight loss, and helps with satiety.', 'editorial', 1),
  ('prefer', 'Non-starchy vegetables',              'Provides volume, fibre, and micronutrients at low kilojoule cost when appetite is small.', 'editorial', 2),
  ('prefer', 'Slow-digesting carbohydrates',        'Oats, legumes, and wholegrain foods provide sustained energy without large glucose swings.', 'editorial', 3),
  ('prefer', 'Small, frequent meals',               'Easier to tolerate than large portions when gastric emptying is slowed.', 'editorial', 4),
  ('limit',  'Large, high-fat meals',               'Fatty food combined with slowed gastric emptying is a common nausea trigger on GLP-1 medicines.', 'editorial', 5),
  ('limit',  'Carbonated and fizzy drinks',         'Can worsen bloating and nausea, particularly during dose escalation.', 'editorial', 6),
  ('limit',  'Ultra-processed and fast foods',      'Tend to blunt the natural appetite cues that Wegovy amplifies.', 'editorial', 7),
  ('avoid',  'Binge drinking',                      'Alcohol worsens nausea and dehydration, and can trigger hypoglycaemia if also taking insulin or sulfonylureas.', 'editorial', 8),
  ('hydrate','Water throughout the day',            'Reduced appetite can quietly reduce fluid intake; staying hydrated eases constipation and fatigue.', 'editorial', 9),
  ('hydrate','Oral rehydration salts if vomiting',  'If vomiting or diarrhoea is significant, electrolyte replacement helps — check with your prescriber before routine use.', 'editorial', 10)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- ── A4. Tips ─────────────────────────────────────────────────

insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('administration', 'Use the same day each week, at a consistent time',
   'A weekly rhythm is easier to maintain than guessing. Set a phone reminder on your chosen injection day. If you miss a dose by fewer than five days, take it as soon as you remember. If more than five days have passed, skip that dose and resume on your next scheduled day.',
   1),
  ('nutrition', 'Protein-first plating',
   'When your appetite is small, lead every meal with protein — chicken, fish, legumes, eggs, tofu — before eating carbs or vegetables. This helps you meet protein targets (roughly 1.2–1.5 g/kg body weight) even with reduced overall intake.',
   2),
  ('other', 'Nausea during escalation is usually temporary',
   'Most nausea with Wegovy occurs during dose-escalation weeks, then improves. Eating bland, small amounts, avoiding greasy foods, and staying upright after meals helps. If nausea is severe or persistent, contact your prescriber — they may hold your dose rather than escalate.',
   3),
  ('administration', 'Rotate injection sites',
   'Use the abdomen (at least 5 cm from the navel), thigh, or upper arm. Rotating sites within each area and not injecting into sore, bruised, or hardened skin reduces injection-site reactions.',
   4),
  ('mindset', 'Weight loss may slow before plateauing',
   'The rate of loss typically slows as your body weight stabilises at a new set point. A slower rate is not a sign of treatment failure — STEP 5 showed continued effect through 2 years with ongoing treatment. Do not self-escalate dose if progress slows.',
   5),
  ('other', 'Tell your prescriber about any vomiting',
   'Severe or repeated vomiting can cause dehydration and, if prolonged, may indicate a rare adverse reaction requiring evaluation. Contact your prescriber if vomiting lasts more than a day or two at a dose.',
   6)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION B — Semaglutide (Ozempic)  slug: semaglutide-ozempic
-- ─────────────────────────────────────────────────────────────

-- ── B1. Peptide row ──────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'Semaglutide is a GLP-1 (glucagon-like peptide-1) receptor agonist. It mimics the gut hormone GLP-1 to increase glucose-dependent insulin secretion, suppress glucagon, slow gastric emptying, and reduce appetite. In Ozempic, doses of 0.5–2 mg once weekly are used primarily to improve glycaemic control in type 2 diabetes. The glucose-dependent insulin effect means the risk of hypoglycaemia is low when semaglutide is used without other glucose-lowering agents.',
  receptor_targets      = '["GLP-1 receptor"]'::jsonb,
  evidence_score        = 90,
  contraindications     = 'Ozempic is a prescription medicine. Do not use if you have:
• A personal or family history of medullary thyroid carcinoma (MTC)
• Multiple endocrine neoplasia syndrome type 2 (MEN2)
• A known allergy or hypersensitivity to semaglutide or any ingredient in the product

Use with caution (discuss with your prescriber) if you have:
• A history of pancreatitis
• Diabetic retinopathy — discuss the risk of acute worsening during rapid glucose improvement
• Severe kidney or liver disease
• Active or recent eating disorder

Not recommended during pregnancy or breastfeeding. Always disclose your full medical history to your prescriber.',
  drug_interactions     = '[
    {"drug":"Insulin and insulin secretagogues (e.g. sulfonylureas)","interaction":"Combination significantly increases hypoglycaemia risk. Prescribers typically reduce insulin or sulfonylurea doses when starting or escalating Ozempic.","severity":"significant"},
    {"drug":"Oral contraceptives","interaction":"Gastric slowing may reduce the absorption of oral contraceptives, particularly around dose escalation. Discuss contraception options with your prescriber.","severity":"moderate"},
    {"drug":"Medicines with narrow therapeutic index","interaction":"Delayed gastric emptying may alter absorption of warfarin, some anti-epileptics, and ciclosporin. Additional monitoring may be warranted.","severity":"moderate"},
    {"drug":"Alcohol","interaction":"Increases nausea and the risk of hypoglycaemia when combined with insulin or sulfonylureas.","severity":"moderate"}
  ]'::jsonb,
  storage_handling      = 'Store the Ozempic pen in the refrigerator at 2–8°C (36–46°F) until first use.
• After first use: keep below 30°C and use within 56 days (8 weeks).
• Do not freeze — freezing damages the active molecule.
• Keep the cap on between injections to protect from light.
• Store away from children.',
  pharmacokinetics      = '{
    "half_life":"Approximately 1 week (7 days), supporting once-weekly dosing.",
    "tmax":"24–72 hours after subcutaneous injection.",
    "bioavailability_note":"High systemic absorption after subcutaneous injection; ~89% albumin-bound, which extends the half-life.",
    "clearance":"Degraded via proteolytic and fatty acid oxidation pathways; renal dose adjustment is not required for mild-to-moderate impairment."
  }'::jsonb
where slug = 'semaglutide-ozempic';

-- ── B2. Expectations ─────────────────────────────────────────

insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'Starting Ozempic',
       'Ozempic begins at 0.25 mg weekly for four weeks, then escalates to 0.5 mg. The starting dose is a tolerability step, not a therapeutic dose — blood sugar improvement and appetite change are more noticeable from 0.5 mg onward.',
       true),
  (8,  'Reaching 0.5 mg maintenance (or continuing escalation)',
       'Many people remain on 0.5 mg long term if glycaemic goals are met. If HbA1c targets are not reached after 12 weeks at 0.5 mg, your prescriber may escalate to 1 mg.',
       true),
  (16, 'Assessing glycaemic response',
       'HbA1c is typically reviewed around 12–16 weeks. In SUSTAIN-6, participants had meaningful HbA1c reductions as early as week 8. Weight reduction is often an appreciated secondary effect.',
       true),
  (52, 'Long-term glycaemic management',
       'SUSTAIN-6 and SUSTAIN-7 demonstrated sustained HbA1c improvements beyond 1–2 years with continued treatment. The cardiovascular outcomes benefit from the SELECT trial also applies to patients with established cardiovascular disease.',
       true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'semaglutide-ozempic'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- ── B3. Food guidance ────────────────────────────────────────

insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('prefer', 'Low glycaemic index carbohydrates',  'Legumes, whole grains, and most vegetables produce slower, smaller glucose rises — aligned with the glucose-dependent action of semaglutide.', 'editorial', 1),
  ('prefer', 'Lean protein at each meal',          'Helps with satiety and lean mass, especially if weight loss is also a goal.', 'editorial', 2),
  ('prefer', 'Non-starchy vegetables',             'Fibre and micronutrients with minimal glucose impact.', 'editorial', 3),
  ('prefer', 'Regular meal pattern',               'Consistent meal timing helps with both glycaemic stability and tolerability.', 'editorial', 4),
  ('limit',  'High glycaemic foods (white bread, sugary drinks)', 'Can produce large post-meal glucose excursions even with semaglutide present.', 'editorial', 5),
  ('limit',  'Large high-fat meals',               'Can worsen nausea, particularly around dose escalation.', 'editorial', 6),
  ('limit',  'Skipping meals',                     'Increases the risk of hypoglycaemia if also taking insulin or sulfonylureas.', 'editorial', 7),
  ('avoid',  'Binge drinking',                     'Alcohol can mask hypoglycaemia symptoms and increase risk, particularly with insulin or sulfonylurea co-use.', 'editorial', 8),
  ('hydrate','Water and unsweetened drinks',       'Helps manage GI side effects and supports kidney function.', 'editorial', 9)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'semaglutide-ozempic'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- ── B4. Tips ─────────────────────────────────────────────────

insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('administration', 'Inject on the same day each week',
   'Keeping a consistent injection schedule prevents accidental double-dosing or long gaps. A gap of more than 14 days between doses requires restarting the escalation protocol — contact your prescriber if that happens.',
   1),
  ('other', 'Know the symptoms of low blood sugar if using other diabetes medicines',
   'On its own, semaglutide rarely causes hypoglycaemia because its insulin-stimulating effect is glucose-dependent. However, if you are also using insulin or sulfonylureas, hypoglycaemia is a real risk. Know the signs: shakiness, sweating, confusion, rapid heartbeat.',
   2),
  ('other', 'Diabetic eye screening',
   'Rapid improvement in blood sugar can occasionally cause transient worsening of diabetic eye changes. Attend your scheduled retinal screenings and let your ophthalmologist know you have started Ozempic.',
   3),
  ('nutrition', 'Consistent carbohydrate distribution helps',
   'Spreading carbohydrate intake evenly across meals, rather than loading at one meal, produces more stable glucose levels and can reduce post-meal nausea.',
   4),
  ('other', 'Inform any medical or dental team',
   'Delayed gastric emptying affects the timing and preparation for procedures requiring fasting or nil-by-mouth instructions. Tell every medical professional you see that you are on semaglutide.',
   5)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'semaglutide-ozempic'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION C — Studies (Wegovy: STEP 1, STEP 5, SELECT;
--             Ozempic: SUSTAIN-6, SUSTAIN-7)
-- ─────────────────────────────────────────────────────────────

-- C1. STEP 1 — Wilding, NEJM 2021 (Wegovy obesity)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Once-Weekly Semaglutide in Adults with Overweight or Obesity (STEP 1)',
  'New England Journal of Medicine',
  '2021-03-18',
  'human', 1961,
  'Adults with obesity (BMI ≥30) or overweight (BMI ≥27) with ≥1 weight-related condition, without type 2 diabetes',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2032183',
  '10.1056/NEJMoa2032183',
  '1961 adults were randomised to once-weekly subcutaneous semaglutide 2.4 mg or placebo for 68 weeks, alongside lifestyle intervention. Mean body-weight change was −14.9% with semaglutide versus −2.4% with placebo; 86.4% of semaglutide participants achieved ≥5% weight loss. Nausea and diarrhoea were the most common adverse events.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1056/NEJMoa2032183');

-- C2. STEP 5 — Garvey, Nat Med 2022 (Wegovy 2-year)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Two-Year Effects of Semaglutide in Adults with Overweight or Obesity (STEP 5)',
  'Nature Medicine',
  '2022-10-10',
  'human', 304,
  'Adults with obesity or overweight plus comorbidity, without type 2 diabetes',
  'https://www.nature.com/articles/s41591-022-01893-7',
  '10.1038/s41591-022-01893-7',
  '304 adults received once-weekly semaglutide 2.4 mg or placebo for 104 weeks (2 years). Mean body-weight change was −15.2% with semaglutide versus −2.6% with placebo. Cardiometabolic risk markers improved across lipids, blood pressure, and inflammatory markers.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1038/s41591-022-01893-7');

-- C3. SELECT — Lincoff, NEJM 2023 (CV outcomes, relevant to both products)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT)',
  'New England Journal of Medicine',
  '2023-11-11',
  'human', 17604,
  'Adults with overweight or obesity, established cardiovascular disease, without type 2 diabetes at baseline',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2307563',
  '10.1056/NEJMoa2307563',
  '17,604 adults with established cardiovascular disease were randomised to semaglutide 2.4 mg weekly or placebo over ~33 months. Semaglutide reduced the risk of major adverse cardiovascular events (MACE — cardiovascular death, non-fatal MI, or non-fatal stroke) by 20% versus placebo (HR 0.80, 95% CI 0.72–0.90).',
  'published'
where not exists (select 1 from public.studies where doi = '10.1056/NEJMoa2307563');

-- C4. SUSTAIN-6 — Marso, NEJM 2016 (Ozempic CV outcomes T2D)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes (SUSTAIN-6)',
  'New England Journal of Medicine',
  '2016-11-10',
  'human', 3297,
  'Adults with type 2 diabetes and high cardiovascular risk',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa1607141',
  '10.1056/NEJMoa1607141',
  '3,297 adults with type 2 diabetes and high cardiovascular risk were randomised to once-weekly subcutaneous semaglutide 0.5 mg or 1 mg, or placebo, for 104 weeks. MACE occurred in 6.6% of semaglutide participants versus 8.9% of placebo (HR 0.74, 95% CI 0.58–0.95), meeting the prespecified non-inferiority and superiority criteria.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1056/NEJMoa1607141');

-- C5. SUSTAIN-7 — Pratley, Lancet Diabetes Endocrinol 2018 (head-to-head vs dulaglutide)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Semaglutide versus Dulaglutide Once Weekly in Adults with Type 2 Diabetes (SUSTAIN 7)',
  'The Lancet Diabetes & Endocrinology',
  '2018-04-01',
  'human', 1201,
  'Adults with type 2 diabetes uncontrolled on metformin',
  'https://www.thelancet.com/journals/landia/article/PIIS2213-8587(17)30423-X/fulltext',
  '10.1016/S2213-8587(17)30423-X',
  '1,201 adults with type 2 diabetes on metformin were randomised to semaglutide 0.5 mg or 1 mg versus dulaglutide 0.75 mg or 1.5 mg weekly for 40 weeks. HbA1c reduction was significantly greater with semaglutide at matched doses, as was body-weight reduction. Adverse events were comparable.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1016/S2213-8587(17)30423-X');

-- ─────────────────────────────────────────────────────────────
-- SECTION D — Link studies to peptides
-- ─────────────────────────────────────────────────────────────

-- Wegovy: STEP 1, STEP 5, SELECT
insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'semaglutide-wegovy'
  and s.doi in (
    '10.1056/NEJMoa2032183',
    '10.1038/s41591-022-01893-7',
    '10.1056/NEJMoa2307563'
  )
  and not exists (
    select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id
  );

-- Ozempic: SUSTAIN-6, SUSTAIN-7, SELECT
insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'semaglutide-ozempic'
  and s.doi in (
    '10.1056/NEJMoa1607141',
    '10.1016/S2213-8587(17)30423-X',
    '10.1056/NEJMoa2307563'
  )
  and not exists (
    select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION E — Study dosages
-- ─────────────────────────────────────────────────────────────

-- STEP 1 arms: 0.25 mg (run-in) and 2.4 mg (maintenance)
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, v.dosage_value, 'mg', 'once weekly subcutaneous', v.duration, v.context_note
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2032183'
cross join (values
  (0.25, '4 weeks', 'Starting dose — tolerability run-in only; not a therapeutic dose.'),
  (0.5,  '4 weeks', 'Escalation step 2.'),
  (1.0,  '4 weeks', 'Escalation step 3.'),
  (1.7,  '4 weeks', 'Escalation step 4.'),
  (2.4,  '52 weeks', 'Target maintenance dose — primary endpoint dose.')
) as v(dosage_value, duration, context_note)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = v.dosage_value
  );

-- SUSTAIN-6 arms
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, v.dosage_value, 'mg', 'once weekly subcutaneous', '104 weeks', v.context_note
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa1607141'
cross join (values
  (0.5, 'Lower dose arm in SUSTAIN-6; after initial 0.25 mg run-in.'),
  (1.0, 'Higher dose arm in SUSTAIN-6.')
) as v(dosage_value, context_note)
where p.slug = 'semaglutide-ozempic'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = v.dosage_value
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION F — Study outcomes
-- ─────────────────────────────────────────────────────────────

-- STEP 1 outcomes (Wegovy)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2032183'
cross join (values
  ('weight_loss',     'Mean body-weight reduction of 14.9% at 68 weeks on 2.4 mg weekly, versus 2.4% with placebo.', 'Primary outcome'),
  ('responder_rate',  '86.4% of semaglutide participants achieved ≥5% body-weight loss; 69.1% achieved ≥10%.', 'Secondary'),
  ('cardiometabolic', 'Improvements in waist circumference, systolic blood pressure, fasting glucose, HbA1c, and lipids versus placebo.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- STEP 5 outcomes (Wegovy)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1038/s41591-022-01893-7'
cross join (values
  ('weight_loss',     'Mean body-weight reduction of 15.2% at 104 weeks (2 years) on 2.4 mg weekly, versus 2.6% with placebo.', 'Primary outcome'),
  ('cardiometabolic', 'Sustained improvements in lipids, blood pressure, and CRP (inflammatory marker) over 2 years.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- SELECT outcomes (linked to both products)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2307563'
cross join (values
  ('cardiovascular', '20% relative risk reduction in MACE (cardiovascular death, non-fatal MI, or non-fatal stroke) versus placebo over ~33 months.', 'Primary outcome'),
  ('weight_loss',    'Mean body-weight reduction of 9.4% versus 0.9% with placebo at ~33 months.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2307563'
cross join (values
  ('cardiovascular', '20% relative risk reduction in MACE versus placebo over ~33 months (SELECT trial — patients without diabetes).', 'Primary outcome')
) as v(outcome_type, description, significance)
where p.slug = 'semaglutide-ozempic'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- SUSTAIN-6 outcomes (Ozempic)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa1607141'
cross join (values
  ('cardiovascular', 'MACE occurred in 6.6% of semaglutide participants versus 8.9% of placebo over 104 weeks (HR 0.74), meeting non-inferiority and superiority criteria.', 'Primary outcome'),
  ('hba1c_reduction','HbA1c reductions of 1.1–1.4% across dose arms versus 0.4% with placebo at 104 weeks.', 'Secondary'),
  ('weight_loss',     'Body-weight reduction of 3.6–6.0 kg versus 1.4 kg placebo depending on dose.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'semaglutide-ozempic'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION G — Side effects
-- ─────────────────────────────────────────────────────────────

-- Wegovy: from STEP 1 (2.4 mg weekly cohort)
insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, v.effect, v.severity, v.frequency
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2032183'
cross join (values
  ('Nausea',                         'mild-to-moderate', '~44%'),
  ('Diarrhoea',                      'mild-to-moderate', '~30%'),
  ('Vomiting',                       'mild-to-moderate', '~24%'),
  ('Constipation',                   'mild',             '~24%'),
  ('Abdominal pain',                 'mild',             '~20%'),
  ('Headache',                       'mild',             'Common during early weeks'),
  ('Fatigue',                        'mild',             'Reported; often resolves'),
  ('Injection-site reaction',        'mild',             'Mild; generally transient'),
  ('Increased heart rate',           'mild',             'Small average increase; generally not clinically significant'),
  ('Dizziness',                      'mild',             'Reported; often associated with dehydration')
) as v(effect, severity, frequency)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = v.effect
  );

-- Ozempic: from SUSTAIN-6 (0.5–1 mg weekly cohort)
insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, v.effect, v.severity, v.frequency
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa1607141'
cross join (values
  ('Nausea',                    'mild-to-moderate', 'Common; most frequent during dose escalation'),
  ('Diarrhoea',                 'mild',             'Common'),
  ('Vomiting',                  'mild',             'Reported'),
  ('Constipation',              'mild',             'Reported'),
  ('Hypoglycaemia',             'mild-to-moderate', 'Higher risk when combined with insulin or sulfonylureas'),
  ('Diabetic retinopathy complications', 'moderate', '3.0% vs 1.8% placebo — rapid glucose improvement may unmask pre-existing changes; discuss with your ophthalmologist'),
  ('Injection-site reaction',   'mild',             'Generally mild and transient')
) as v(effect, severity, frequency)
where p.slug = 'semaglutide-ozempic'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = v.effect
  );
