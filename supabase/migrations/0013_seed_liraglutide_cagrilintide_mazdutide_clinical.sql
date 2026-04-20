-- ============================================================
-- 0013_seed_liraglutide_cagrilintide_mazdutide_clinical.sql
-- ============================================================
-- Seeds three drugs:
--   • liraglutide-saxenda  (Saxenda — weight management; approved)
--   • cagrilintide         (amylin analogue; investigational)
--   • mazdutide            (GLP-1 / glucagon dual agonist; investigational)
--
-- Liraglutide gets landmark SCALE trial data.
-- Cagrilintide and Mazdutide are investigational — content framed
-- as "observed in trials" with honest evidence-level caveats.
-- Idempotent: all inserts guarded by WHERE NOT EXISTS / ON CONFLICT.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION A — Liraglutide (Saxenda)  slug: liraglutide-saxenda
-- ─────────────────────────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'Liraglutide is a GLP-1 (glucagon-like peptide-1) receptor agonist — a daily-injected analogue of the gut hormone GLP-1. It increases glucose-dependent insulin secretion, suppresses glucagon, slows gastric emptying, and acts on hypothalamic GLP-1 receptors to reduce appetite. In Saxenda, the dose is 3.0 mg once daily (higher than the 1.2–1.8 mg daily doses used in Victoza for type 2 diabetes). Saxenda is one of the earliest approved GLP-1 agonists for weight management and has the most extensive real-world safety data of this medicine class.',
  receptor_targets      = '["GLP-1 receptor"]'::jsonb,
  evidence_score        = 82,
  contraindications     = 'Saxenda is a prescription medicine. Do not use if you have:
• A personal or family history of medullary thyroid carcinoma (MTC)
• Multiple endocrine neoplasia syndrome type 2 (MEN2)
• A known allergy or hypersensitivity to liraglutide or any ingredient in the product

Use with caution (discuss with your prescriber) if you have:
• A history of pancreatitis
• Severe kidney or liver disease
• A history of suicidal ideation — rare reports have been observed across weight-loss medicines
• Active or recent eating disorder

Not recommended during pregnancy or breastfeeding.
Saxenda is approved in AU for adults (18+) and in some regions for adolescents 12–17 years. Always discuss your full medical history with your prescriber.',
  drug_interactions     = '[
    {"drug":"Insulin and insulin secretagogues (e.g. sulfonylureas)","interaction":"Increased hypoglycaemia risk. Prescribers typically reduce doses of other glucose-lowering agents when starting Saxenda.","severity":"significant"},
    {"drug":"Oral contraceptives","interaction":"Slowed gastric emptying may reduce oral contraceptive absorption, particularly during dose escalation. Consider additional non-hormonal contraception.","severity":"moderate"},
    {"drug":"Narrow therapeutic index medicines (warfarin, anti-epileptics)","interaction":"Altered absorption timing. Additional monitoring may be warranted.","severity":"moderate"},
    {"drug":"Alcohol","interaction":"Worsens nausea and dehydration; increases hypoglycaemia risk with other diabetes medicines.","severity":"moderate"}
  ]'::jsonb,
  storage_handling      = 'Store the Saxenda pen in the refrigerator at 2–8°C (36–46°F) until first use.
• After first use: use within 30 days, keeping at or below 30°C and protected from light.
• Do not freeze the pen — freezing destroys the medicine.
• Keep the cap on when not in use.
• The pen is for single patient use only — do not share.',
  pharmacokinetics      = '{
    "half_life":"Approximately 13 hours — this is why Saxenda is injected once daily, unlike the once-weekly GLP-1 agonists.",
    "tmax":"8–12 hours after a subcutaneous injection.",
    "bioavailability_note":"~55% bioavailability after subcutaneous injection; ~98% albumin-bound.",
    "clearance":"Degraded via proteolytic pathways; no renal or hepatic dose adjustment required for mild-to-moderate impairment, though limited data exist for severe impairment."
  }'::jsonb
where slug = 'liraglutide-saxenda';

-- Expectations
insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'Starting at 0.6 mg daily',
       'Saxenda is injected once daily, beginning at 0.6 mg for the first week. This is a tolerability dose — weight loss begins at 1.2 mg and above. Daily injection is a habit that takes a few days to settle into.',
       true),
  (4,  'Reaching 1.8 mg and assessing early tolerability',
       'The dose steps up weekly (0.6 → 1.2 → 1.8 → 2.4 → 3.0 mg). By week 4 most people are on 1.8 mg. GI side effects — if they occur — typically appear in the first 4 weeks and ease with time.',
       true),
  (5,  'Target dose of 3.0 mg',
       'The target dose is 3.0 mg daily. Your prescriber may hold you at a lower dose if it is effective and well tolerated. Most of the SCALE trial weight-loss data was generated at 3.0 mg.',
       true),
  (16, '12-week response check',
       'If you have not lost at least 4% of body weight by week 16 at 3.0 mg, current guidelines suggest reviewing whether treatment should continue. Your prescriber will assess and advise.',
       true),
  (56, 'SCALE trial primary endpoint',
       'At 56 weeks (52 weeks of maintenance following a 4-week run-in), SCALE participants on 3.0 mg averaged 8.4% body-weight reduction versus 2.8% with placebo. Saxenda produces smaller average weight loss than the newer weekly agents — but has a well-established long-term safety record.',
       true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'liraglutide-saxenda'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- Food guidance
insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('prefer', 'Lean protein at every meal',         'Supports lean mass; key for satiety when calories are reduced.', 'editorial', 1),
  ('prefer', 'Non-starchy vegetables',             'Volume and fibre at low kilojoule cost.', 'editorial', 2),
  ('prefer', 'Fibre-rich whole grains and legumes','Supports gut motility; may ease constipation during treatment.', 'editorial', 3),
  ('prefer', 'Small, regular meals',               'Helps manage nausea from slowed gastric emptying.', 'editorial', 4),
  ('limit',  'Fried and very fatty foods',         'Well-documented GI trigger with GLP-1 medicines.', 'editorial', 5),
  ('limit',  'Large meal portions',                'Satiety arrives faster — overeating past comfort triggers nausea.', 'editorial', 6),
  ('limit',  'Sugary drinks and foods',            'High glycaemic load foods reduce the benefit of appetite suppression.', 'editorial', 7),
  ('avoid',  'Alcohol binges',                     'Worsens dehydration and nausea; may interact with hypoglycaemia risk.', 'editorial', 8),
  ('hydrate','Water and non-sugary fluids',         'Supports tolerability; reduced appetite often means reduced fluid intake too.', 'editorial', 9)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'liraglutide-saxenda'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- Tips
insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('administration', 'Daily injections become routine quickly',
   'Most people find the first week of daily injections the hardest psychologically. Using the same time each day (e.g. with breakfast, or before bed) anchors it to an existing habit. The pen is designed to be simple — once the technique is set, the injection itself takes under a minute.',
   1),
  ('other', 'A 4% weight-loss check applies at 16 weeks',
   'If less than 4% of body weight has been lost by week 16 at 3 mg, current clinical guidelines suggest reviewing whether Saxenda is working for you. This is not a failure — it means your prescriber will reassess.',
   2),
  ('nutrition', 'The real-world dose matters for weight loss',
   'All significant SCALE trial weight-loss data is at 3.0 mg daily. If you are held at 1.8 mg or 2.4 mg due to tolerability, it is worth an honest conversation with your prescriber about expected outcomes versus a weekly agent.',
   3),
  ('other', 'Tell all medical teams about the daily injection',
   'Delayed gastric emptying matters for surgical procedures. Also worth noting for any prescriber considering new oral medicines.',
   4),
  ('mindset', 'Saxenda is a foundation, not a ceiling',
   'If you respond well to Saxenda but your prescriber later discusses switching to a weekly agent, this is a clinical upgrade, not a sign of failure. The GLP-1 medicine class has evolved significantly since liraglutide was first approved.',
   5)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'liraglutide-saxenda'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION B — Cagrilintide  slug: cagrilintide
-- ─────────────────────────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'Cagrilintide is a long-acting analogue of amylin — a hormone co-secreted with insulin from pancreatic beta-cells. Amylin slows gastric emptying, suppresses post-meal glucagon secretion, and signals satiety in the brain via area postrema receptors — a complementary pathway to GLP-1 agonism. Because amylin and GLP-1 work through different pathways, combining cagrilintide with semaglutide (as "CagriSema") may produce additive weight loss beyond either agent alone. Phase 2 data support this hypothesis; Phase 3 trials are ongoing.',
  receptor_targets      = '["Amylin receptor (AMY1, AMY2, AMY3)"]'::jsonb,
  evidence_score        = 45,
  contraindications     = 'Cagrilintide is investigational — not yet approved by the TGA, FDA, MHRA, or EMA. Access is limited to clinical trials.

Based on Phase 2 trial exclusion criteria and the amylin receptor class:
• Existing amylin-pathway contraindications are not fully characterised
• Trials have excluded participants with severe GI disease, active eating disorders, severe kidney or liver impairment, recent cardiovascular events, pregnancy, and breastfeeding

No formal prescribing label exists. Speak with your trial site or prescriber for any questions about eligibility.',
  drug_interactions     = '[
    {"drug":"Insulin and insulin secretagogues","interaction":"Amylin analogues can increase hypoglycaemia risk when combined with insulin-stimulating agents.","severity":"significant"},
    {"drug":"GLP-1 receptor agonists (e.g. semaglutide in CagriSema combination)","interaction":"The CagriSema combination is the primary clinical context for cagrilintide use. GI adverse events were more frequent in combination than either agent alone.","severity":"moderate"},
    {"drug":"Oral medicines with narrow therapeutic index","interaction":"Additive gastric-emptying slowing from amylin + GLP-1 dual mechanisms may alter absorption of orally administered drugs.","severity":"moderate"}
  ]'::jsonb,
  storage_handling      = 'As an investigational biologic, storage specifics are governed by the trial protocol or supplying pharmacy. Amylin analogues in this class are expected to require refrigeration at 2–8°C (36–46°F). Freezing typically destroys peptide biologics.

Always follow the storage instructions provided by your trial site.',
  pharmacokinetics      = '{
    "half_life":"Approximately 7 days, supporting once-weekly subcutaneous dosing (reported from Phase 1/2 data).",
    "tmax":"~3–4 days after subcutaneous injection.",
    "bioavailability_note":"Data from investigational Phase 2 studies; not yet on a product label.",
    "clearance":"Degraded via proteolytic pathways — specific clearance data from published Phase 2 trials."
  }'::jsonb
where slug = 'cagrilintide';

-- Expectations (trial-framed)
insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'Starting in a trial context',
       'Cagrilintide is only available in clinical trials as of 2024–2025. It has been studied primarily as part of the CagriSema combination (with semaglutide). The dose-escalation protocols vary by trial.',
       true),
  (16, 'Early weight and appetite response',
       'In the NEAR Phase 2 trial (Enebo et al., Lancet 2021), cagrilintide monotherapy at 4.5 mg weekly produced ~10.8% body-weight reduction at 26 weeks. In CagriSema combination, effects appeared additive.',
       true),
  (32, 'CagriSema Phase 3 readouts expected',
       'REDEFINE 1 and REDEFINE 2, the Phase 3 trials of the cagrilintide + semaglutide combination, are underway. Results, if favourable, may inform regulatory filings from late 2025 onward.',
       true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'cagrilintide'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- Food guidance (GLP-1/amylin class applicable)
insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('prefer', 'Lean protein-first eating',  'Supports lean mass and satiety under appetite suppression.', 'editorial', 1),
  ('prefer', 'Non-starchy vegetables',     'Volume eating at low kilojoule cost.', 'editorial', 2),
  ('prefer', 'Small, frequent meals',      'Consistent recommendation for medicines that slow gastric emptying.', 'editorial', 3),
  ('limit',  'High-fat, fried foods',      'Common GI trigger for GLP-1 and amylin class agents.', 'editorial', 4),
  ('limit',  'Large portions',             'Early satiety means large meals are not well tolerated.', 'editorial', 5),
  ('avoid',  'Alcohol',                    'Worsens GI side effects and hypoglycaemia risk.', 'editorial', 6),
  ('hydrate','Water and electrolytes',     'GI adverse events are more frequent with combination therapy — hydration reduces severity.', 'editorial', 7)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'cagrilintide'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- Tips
insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('other', 'This is an investigational medicine',
   'Cagrilintide is not commercially available. If you are reading this because you are participating in a trial, all questions about dose, protocol, and tolerability management should go to your trial site team — not a community forum.',
   1),
  ('other', 'CagriSema GI burden is higher than either drug alone',
   'In Phase 2 data, the combination of cagrilintide and semaglutide produced more GI adverse events than either drug alone, though most were mild-to-moderate. Dose escalation is typically slower to minimise this.',
   2),
  ('nutrition', 'Protein intake supports the lean mass you want to preserve',
   'Significant weight loss from any GLP-1 class drug can include lean mass loss. Adequate protein (1.2–1.6 g/kg/day) and resistance exercise help preserve it.',
   3)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'cagrilintide'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION C — Mazdutide  slug: mazdutide
-- ─────────────────────────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'Mazdutide (also known as IBI362 or OXM3) is a dual GLP-1 / glucagon receptor agonist. Like retatrutide, it activates the glucagon receptor — which promotes energy expenditure, fat oxidation, and liver-fat reduction — alongside the GLP-1 receptor for appetite suppression and insulin regulation. Mazdutide is in clinical development primarily in China (Innovent Biologics), with Phase 3 trials underway in China and Phase 2 data published in the Lancet Diabetes & Endocrinology for type 2 diabetes.',
  receptor_targets      = '["GLP-1 receptor","glucagon receptor"]'::jsonb,
  evidence_score        = 42,
  contraindications     = 'Mazdutide is investigational outside China; access is limited to clinical trial participants.

Based on published trial exclusion criteria and the GLP-1/glucagon class:
• Personal or family history of medullary thyroid carcinoma (MTC) or MEN2
• History of pancreatitis or unexplained persistent abdominal pain
• Severe GI disease
• Recent major cardiovascular events
• Pregnancy or breastfeeding
• Severe kidney or liver impairment

No regulatory label exists outside trial contexts. Direct questions to your trial site.',
  drug_interactions     = '[
    {"drug":"Insulin and sulfonylureas","interaction":"GLP-1 agonism increases insulin secretion — combining with other insulin-stimulating agents raises hypoglycaemia risk.","severity":"significant"},
    {"drug":"Oral contraceptives","interaction":"GLP-1-mediated gastric slowing may affect oral contraceptive absorption.","severity":"moderate"},
    {"drug":"Alcohol","interaction":"Worsens nausea and GI effects; increases hypoglycaemia risk with co-administered glucose-lowering drugs.","severity":"moderate"}
  ]'::jsonb,
  storage_handling      = 'As an investigational biologic, storage is governed by the trial protocol or supplying pharmacy. GLP-1 family injectables in this class require refrigeration at 2–8°C and must not be frozen.

Follow the instructions provided by your trial site.',
  pharmacokinetics      = '{
    "half_life":"Approximately 3.5–4 days based on Phase 2 data; supports once-weekly or less-frequent dosing.",
    "tmax":"~48–72 hours after subcutaneous injection.",
    "bioavailability_note":"Published from Phase 2 investigational data in Chinese populations; not yet on a product label for other regions.",
    "clearance":"Proteolytic degradation; full clearance characterisation is ongoing in Phase 3."
  }'::jsonb
where slug = 'mazdutide';

-- Expectations
insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'Investigational status',
       'Mazdutide is approved in China and in Phase 3 trials there; it remains investigational elsewhere. Dosing, escalation, and monitoring are trial-protocol-specific.',
       true),
  (20, 'Phase 2 obesity response',
       'In a Chinese Phase 2 obesity trial (Ji et al., reported 2024), weekly subcutaneous mazdutide produced approximately 10–14% body-weight reduction at 24 weeks depending on dose, with dose-dependent effects on fat mass and liver fat.',
       true),
  (24, 'Phase 2 T2D glycaemic response',
       'In the Lancet Diabetes & Endocrinology Phase 2 T2D trial (Ji et al., 2023), mazdutide 4 mg and 6 mg weekly significantly reduced HbA1c and body weight over 24 weeks, with the 6 mg arm achieving ~−1.8% HbA1c and ~−10% body weight.',
       true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'mazdutide'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- Food guidance
insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('prefer', 'Lean protein',              'Consistent with all GLP-1/glucagon class agents during caloric reduction.', 'editorial', 1),
  ('prefer', 'Non-starchy vegetables',    'Volume eating at low caloric cost.', 'editorial', 2),
  ('prefer', 'Low-GI carbohydrates',      'Supports stable blood glucose in both diabetes and weight-management contexts.', 'editorial', 3),
  ('limit',  'High-fat meals',            'Common GI trigger.', 'editorial', 4),
  ('limit',  'Refined sugars and sweets', 'Counterproductive to the metabolic goal of glucagon receptor co-activation.', 'editorial', 5),
  ('avoid',  'Alcohol',                   'Worsens GI side effects and metabolic goals.', 'editorial', 6),
  ('hydrate','Water throughout the day',  'Standard hydration recommendation for GI tolerability.', 'editorial', 7)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'mazdutide'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- Tips
insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('other', 'Mazdutide is investigational outside China',
   'Phase 3 trials are underway in China and some early Phase 2 data are international; the drug does not have TGA, FDA, MHRA, or EMA approval. Any questions about access or participation should go to your trial site.',
   1),
  ('other', 'Glucagon co-activation distinguishes this class',
   'The glucagon receptor component of dual GLP-1/glucagon agonists like mazdutide and retatrutide is thought to increase energy expenditure — a mechanism not present in pure GLP-1 agonists. Phase 2 data suggest this may be particularly effective for liver-fat reduction (NASH/MAFLD).',
   2),
  ('nutrition', 'Liver-fat reduction context',
   'If you are in a mazdutide trial partly because of non-alcoholic fatty liver disease, your trial team may monitor liver enzymes and imaging. A low-fat, low-fructose dietary pattern is broadly recommended alongside pharmacotherapy for liver-fat reduction.',
   3)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'mazdutide'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION D — Studies
-- ─────────────────────────────────────────────────────────────

-- SCALE Obesity — Pi-Sunyer, NEJM 2015 (Saxenda)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'A Randomized, Controlled Trial of 3.0 mg of Liraglutide in Weight Management (SCALE Obesity)',
  'New England Journal of Medicine',
  '2015-07-02',
  'human', 3731,
  'Adults with obesity (BMI ≥30) or overweight (BMI ≥27) with dyslipidaemia or hypertension, without type 2 diabetes',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa1411892',
  '10.1056/NEJMoa1411892',
  '3,731 adults were randomised to liraglutide 3.0 mg once daily or placebo for 56 weeks, alongside diet and exercise counselling. Mean body-weight change was −8.4% with liraglutide versus −2.8% with placebo; 63.2% of liraglutide participants achieved ≥5% weight loss. Nausea and vomiting were the most common adverse events.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1056/NEJMoa1411892');

-- LEADER — Marso, NEJM 2016 (Liraglutide CV outcomes in T2D — supports class credibility)
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Liraglutide and Cardiovascular Outcomes in Type 2 Diabetes (LEADER)',
  'New England Journal of Medicine',
  '2016-07-28',
  'human', 9340,
  'Adults with type 2 diabetes and high cardiovascular risk',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa1603827',
  '10.1056/NEJMoa1603827',
  '9,340 adults with type 2 diabetes and high cardiovascular risk were randomised to liraglutide 1.8 mg daily or placebo for a median of 3.8 years. MACE occurred in 13.0% of liraglutide versus 14.9% of placebo participants (HR 0.87, 95% CI 0.78–0.97), demonstrating cardiovascular safety and superiority.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1056/NEJMoa1603827');

-- CagriSema Phase 2 — Enebo, Lancet 2021
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Safety, tolerability, pharmacokinetics, and pharmacodynamics of cagrilintide 4.5 mg with semaglutide 2.4 mg (CagriSema) in adults with overweight or obesity: a randomised, controlled, phase 1b trial',
  'The Lancet',
  '2021-09-25',
  'human', 96,
  'Adults with overweight or obesity (BMI 27–39.9) without type 2 diabetes',
  'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(21)01609-5/fulltext',
  '10.1016/S0140-6736(21)01609-5',
  '96 adults were randomised to once-weekly cagrilintide 4.5 mg alone, semaglutide 2.4 mg alone, CagriSema combination, or placebo for 20 weeks. Mean body-weight change was −15.6% with CagriSema versus −8.8% with semaglutide alone and −8.7% with cagrilintide alone — suggesting additive effects of the combination.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1016/S0140-6736(21)01609-5');

-- Mazdutide T2D Phase 2 — Ji, Lancet Diabetes Endocrinol 2023
insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'Efficacy and safety of mazdutide (IBI362) 4 mg and 6 mg in Chinese adults with type 2 diabetes and overweight or obesity: a randomised, double-blind, placebo-controlled, phase 2 trial',
  'The Lancet Diabetes & Endocrinology',
  '2023-05-01',
  'human', 265,
  'Chinese adults with type 2 diabetes and BMI ≥25, on stable metformin',
  'https://www.thelancet.com/journals/landia/article/PIIS2213-8587(23)00091-8/fulltext',
  '10.1016/S2213-8587(23)00091-8',
  '265 adults were randomised to mazdutide 4 mg weekly, 6 mg weekly, or placebo for 24 weeks. HbA1c reductions were −1.46% and −1.81% for 4 and 6 mg respectively versus −0.22% for placebo. Body-weight reductions were −6.67% and −9.73% respectively. GI adverse events were the most common, generally mild-to-moderate.',
  'published'
where not exists (select 1 from public.studies where doi = '10.1016/S2213-8587(23)00091-8');

-- ─────────────────────────────────────────────────────────────
-- SECTION E — Link studies to peptides
-- ─────────────────────────────────────────────────────────────

-- Saxenda: SCALE, LEADER
insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'liraglutide-saxenda'
  and s.doi in ('10.1056/NEJMoa1411892', '10.1056/NEJMoa1603827')
  and not exists (select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id);

-- Cagrilintide: CagriSema Phase 1b
insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'cagrilintide'
  and s.doi in ('10.1016/S0140-6736(21)01609-5')
  and not exists (select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id);

-- Mazdutide: T2D Phase 2
insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'mazdutide'
  and s.doi in ('10.1016/S2213-8587(23)00091-8')
  and not exists (select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id);

-- ─────────────────────────────────────────────────────────────
-- SECTION F — Study dosages
-- ─────────────────────────────────────────────────────────────

-- SCALE: 3.0 mg arm
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, 3.0, 'mg', 'once daily subcutaneous', '56 weeks',
       'Reached after weekly escalation: 0.6→1.2→1.8→2.4→3.0 mg. Primary endpoint dose.'
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa1411892'
where p.slug = 'liraglutide-saxenda'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = 3.0
  );

-- CagriSema: cagrilintide 4.5 mg arm
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, 4.5, 'mg', 'once weekly subcutaneous', '20 weeks',
       'Combined with semaglutide 2.4 mg in the CagriSema arm of the Phase 1b trial.'
from public.peptides p
join public.studies s on s.doi = '10.1016/S0140-6736(21)01609-5'
where p.slug = 'cagrilintide'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = 4.5
  );

-- Mazdutide Phase 2: 4 and 6 mg arms
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, v.dosage_value, 'mg', 'once weekly subcutaneous', '24 weeks', v.context_note
from public.peptides p
join public.studies s on s.doi = '10.1016/S2213-8587(23)00091-8'
cross join (values
  (4.0, 'Lower dose arm in the Phase 2 T2D trial.'),
  (6.0, 'Higher dose arm; produced larger HbA1c and body-weight reductions.')
) as v(dosage_value, context_note)
where p.slug = 'mazdutide'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = v.dosage_value
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION G — Study outcomes
-- ─────────────────────────────────────────────────────────────

-- SCALE outcomes (Saxenda)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa1411892'
cross join (values
  ('weight_loss',   'Mean body-weight reduction of 8.4% at 56 weeks on 3.0 mg daily, versus 2.8% with placebo.', 'Primary outcome'),
  ('responder_rate','63.2% of liraglutide participants achieved ≥5% weight loss; 33.1% achieved ≥10%.', 'Secondary'),
  ('cardiometabolic','Improvements in blood pressure, HbA1c, and lipids; 80% risk reduction in progression to type 2 diabetes in a prediabetes subgroup.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'liraglutide-saxenda'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- LEADER outcomes (Saxenda — class CV evidence)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa1603827'
cross join (values
  ('cardiovascular','MACE occurred in 13.0% liraglutide versus 14.9% placebo over median 3.8 years (HR 0.87) — demonstrating CV safety and superiority in type 2 diabetes.', 'Primary outcome')
) as v(outcome_type, description, significance)
where p.slug = 'liraglutide-saxenda'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- CagriSema outcomes (Cagrilintide)
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1016/S0140-6736(21)01609-5'
cross join (values
  ('weight_loss', 'Mean body-weight change of −15.6% with CagriSema versus −8.8% with semaglutide alone and −8.7% with cagrilintide alone at 20 weeks.', 'Primary outcome'),
  ('weight_loss', 'Additive weight loss suggests complementary mechanisms — amylin and GLP-1 pathways appear to act synergistically.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'cagrilintide'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- Mazdutide Phase 2 outcomes
insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1016/S2213-8587(23)00091-8'
cross join (values
  ('hba1c_reduction','HbA1c reductions of −1.46% at 4 mg and −1.81% at 6 mg weekly versus −0.22% for placebo at 24 weeks.', 'Primary outcome'),
  ('weight_loss',    'Body-weight reductions of −6.67% at 4 mg and −9.73% at 6 mg weekly versus +0.05% for placebo.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'mazdutide'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION H — Side effects
-- ─────────────────────────────────────────────────────────────

-- Saxenda: from SCALE
insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, v.effect, v.severity, v.frequency
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa1411892'
cross join (values
  ('Nausea',                    'mild-to-moderate', '~32%; most common during dose escalation'),
  ('Diarrhoea',                 'mild',             '~21%'),
  ('Constipation',              'mild',             '~19%'),
  ('Vomiting',                  'mild-to-moderate', '~16%'),
  ('Headache',                  'mild',             'Common; often in early weeks'),
  ('Decreased appetite',        'mild',             'Very common; generally an intended effect'),
  ('Dyspepsia',                 'mild',             'Reported'),
  ('Injection-site reaction',   'mild',             'Mild; generally transient')
) as v(effect, severity, frequency)
where p.slug = 'liraglutide-saxenda'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = v.effect
  );

-- Cagrilintide: from CagriSema Phase 1b
insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, v.effect, v.severity, v.frequency
from public.peptides p
join public.studies s on s.doi = '10.1016/S0140-6736(21)01609-5'
cross join (values
  ('Nausea',     'mild-to-moderate', 'More frequent in the CagriSema combination than either drug alone'),
  ('Vomiting',   'mild',             'Reported; more frequent in combination arm'),
  ('Diarrhoea',  'mild',             'Reported'),
  ('Constipation','mild',            'Reported')
) as v(effect, severity, frequency)
where p.slug = 'cagrilintide'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = v.effect
  );

-- Mazdutide: from T2D Phase 2
insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, v.effect, v.severity, v.frequency
from public.peptides p
join public.studies s on s.doi = '10.1016/S2213-8587(23)00091-8'
cross join (values
  ('Nausea',                    'mild-to-moderate', 'Common; most frequent at 6 mg'),
  ('Diarrhoea',                 'mild',             'Reported'),
  ('Vomiting',                  'mild',             'Reported'),
  ('Decreased appetite',        'mild',             'Common; generally expected'),
  ('Injection-site reaction',   'mild',             'Reported; generally mild')
) as v(effect, severity, frequency)
where p.slug = 'mazdutide'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = v.effect
  );
