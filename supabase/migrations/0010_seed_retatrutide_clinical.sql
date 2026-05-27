-- ============================================================
-- 0010_seed_retatrutide_clinical.sql
-- ============================================================
-- End-to-end seed for Retatrutide as the template for the
-- remaining GLP-1 drugs. Populates:
--   • mechanism_summary, receptor_targets, evidence_score
--   • contraindications, drug_interactions, storage_handling,
--     pharmacokinetics (new columns from migration 0009)
--   • drug_expectations (5 rows)
--   • drug_food_guidance (10 rows)
--   • drug_tips (6 rows)
--   • studies (2 Phase 2 landmark trials) + study_peptides
--   • study_dosages (trial arms)
--   • study_outcomes (key efficacy readouts)
--   • side_effects (common AEs from the NEJM Phase 2)
--
-- Retatrutide is investigational; content is framed as
-- "observed in trials" rather than "prescribed behaviour".
-- Idempotent: all inserts guarded by WHERE NOT EXISTS / ON CONFLICT.
-- ============================================================

-- ── 1. Peptide row: fill mechanism, receptors, clinical profile ─

update public.peptides set
  mechanism_summary = 'Retatrutide is a novel triple receptor agonist that activates the glucagon, GIP (glucose-dependent insulinotropic polypeptide), and GLP-1 (glucagon-like peptide-1) receptors with balanced potency. The glucagon component is thought to increase energy expenditure; GIP and GLP-1 agonism improves insulin secretion, slows gastric emptying, and reduces appetite. Phase 2 data suggest weight-loss effects that exceed those reported for single- or dual-receptor agonists, though longer-term safety and efficacy are still being studied in Phase 3 trials.',
  receptor_targets = '["GLP-1 receptor","GIP receptor","glucagon receptor"]'::jsonb,
  evidence_score = 55,
  contraindications = 'Retatrutide is investigational and has not been approved by the TGA, FDA, MHRA, or EMA — access is currently limited to clinical trials.

Phase 2 trial protocols excluded participants with:
• Personal or family history of medullary thyroid carcinoma (MTC) or multiple endocrine neoplasia syndrome type 2 (MEN2)
• Severe gastrointestinal disease including gastroparesis
• A history of pancreatitis
• Active or recent eating disorder
• Type 1 diabetes
• Pregnancy or breastfeeding
• Significant cardiovascular events in the prior 3 months

Talk with your prescriber about whether any of these apply to you.',
  drug_interactions = '[
    {"drug":"Insulin and sulfonylureas","interaction":"Increased risk of hypoglycaemia when combined with agents that stimulate insulin secretion or deliver exogenous insulin. Prescribers typically reduce insulin or sulfonylurea doses when initiating or escalating retatrutide.","severity":"significant"},
    {"drug":"Oral medicines with a narrow therapeutic index","interaction":"Retatrutide delays gastric emptying, which can alter the absorption rate of some orally administered medicines. Particular care is warranted for drugs such as warfarin and certain anti-epileptics.","severity":"moderate"},
    {"drug":"Oral contraceptives","interaction":"Delayed gastric emptying may transiently affect oral contraceptive absorption during dose escalation. Consider additional non-hormonal contraception around dose changes — discuss with your prescriber.","severity":"moderate"},
    {"drug":"Alcohol","interaction":"Alcohol can worsen nausea, dehydration, and the risk of hypoglycaemia when combined with GLP-1 family agents. Moderation is advised.","severity":"moderate"}
  ]'::jsonb,
  storage_handling = 'As an investigational biologic, storage is governed by the trial protocol or pharmacy you receive the product from. GLP-1 family injectables in this class are typically:

• Stored refrigerated at 2–8°C (36–46°F)
• Kept in the original packaging to protect from light
• Not frozen — freezing can damage the active peptide
• Allowed to reach room temperature before injection (check the product instructions)

Always follow the storage and handling instructions supplied by your prescriber or trial site.',
  pharmacokinetics = '{
    "half_life":"Approximately 6 days in humans, which supports once-weekly subcutaneous dosing.",
    "tmax":"24–72 hours after a subcutaneous injection.",
    "bioavailability_note":"High systemic exposure after subcutaneous injection; retatrutide is a peptide and is not orally bioavailable.",
    "clearance":"Catabolised to small peptides and amino acids via proteolytic degradation; not primarily renally or hepatically cleared as intact drug."
  }'::jsonb
where slug = 'retatrutide';

-- ── 2. Drug expectations (week-by-week, framed as observed-in-trials) ─

insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0, 'Starting treatment',
   'Trials began at a low dose (typically 2 mg weekly subcutaneously) and escalated in steps over several weeks. Expect a prescriber-led titration schedule rather than starting at a target dose.',
   true),
  (4, 'Early GI adjustment',
   'Across Phase 2 trials, nausea, mild diarrhoea, or reduced appetite most often appeared in the first 4–8 weeks while the dose was escalating, then eased with continued use. Slow-paced eating and good hydration helped many participants.',
   true),
  (12, 'Appetite changes stabilising',
   'By 12 weeks, participants commonly reported smaller portion sizes and longer satiety after meals. Weight-loss trajectories in trial data began separating clearly from placebo around this point.',
   true),
  (24, 'Mid-trial response',
   'At 24 weeks, participants on higher doses had typically lost double-digit percentages of body weight in the 8 mg and 12 mg arms. Individual responses vary widely — some people respond earlier, others later, and a subset do not respond.',
   true),
  (48, 'Phase 2 trial endpoint',
   'The primary weight-loss readout from the NEJM 2023 obesity trial was at 48 weeks, where the 12 mg arm averaged a 24.2% body-weight reduction. Phase 3 trials continue past this timepoint.',
   true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- ── 3. Food & nutrition guidance ─────────────────────────────

insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('prefer', 'Lean protein at every meal', 'Supports lean mass during appetite-driven weight loss.', 'editorial', 1),
  ('prefer', 'Non-starchy vegetables',     'Fills the plate at low kilojoule cost — helpful when satiety comes quickly.', 'editorial', 2),
  ('prefer', 'Fibre-rich whole foods',     'May ease constipation, a common GI effect during titration.', 'editorial', 3),
  ('prefer', 'Small, frequent meals',      'Easier to tolerate than large meals while gastric emptying is slowed.', 'editorial', 4),
  ('limit',  'Large high-fat meals',       'More likely to trigger nausea or dyspepsia while the dose is escalating.', 'editorial', 5),
  ('limit',  'Fried and very greasy foods','Commonly reported as a trigger for nausea in GLP-1 family agents.', 'editorial', 6),
  ('limit',  'Concentrated sweets and sugary drinks', 'Can amplify reflux symptoms and blunt satiety benefits.', 'editorial', 7),
  ('avoid',  'Binge drinking',             'Alcohol can worsen nausea, dehydration, and hypoglycaemia risk on GLP-1 family medicines.', 'editorial', 8),
  ('hydrate','Water spread through the day','Low appetite can quietly reduce fluid intake; dehydration worsens dizziness and constipation.', 'editorial', 9),
  ('hydrate','Oral rehydration salts',     'Useful if vomiting or diarrhoea is significant — ask your prescriber before routine use.', 'editorial', 10)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- ── 4. General companion tips ────────────────────────────────

insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('nutrition', 'Eat slowly and stop earlier than you think you need to',
   'Slowed gastric emptying means your satiety signal arrives later. Putting down the fork every few bites and pausing gives your brain time to catch up — most participants who tolerate the medicine well found their portions shrank gradually rather than all at once.',
   1),
  ('administration', 'Do not self-adjust your dose',
   'Phase 2 trials used a prescriber-led titration. Skipping doses to ease side effects, or jumping ahead to a higher dose, both increased adverse events in the trial data. Talk with your prescriber before changing anything.',
   2),
  ('timing', 'Pick a consistent injection day',
   'A weekly medicine is easier to remember when it is tied to the same day each week. If you miss a dose, there are published rules for how long after the scheduled day you can still take it — your prescriber or trial site will provide them.',
   3),
  ('other', 'Keep a brief symptom log',
   'A few lines per day covering nausea, appetite, bowel habits, and any dizziness gives your prescriber real information to titrate against. Trial participants who tracked symptoms had a better conversation at their next visit.',
   4),
  ('nutrition', 'Prioritise protein intake during weight loss',
   'Aiming for roughly 1.2–1.6 g of protein per kg of body weight daily helps preserve lean mass while you lose fat. If your appetite is small, protein-first plating (protein before carbs or vegetables) helps.',
   5),
  ('other', 'Early GI symptoms are usually transient',
   'In Phase 2, most nausea and GI symptoms were mild to moderate and occurred during the first 4–8 weeks of titration. They generally improved with continued use — but if they are severe or persistent, contact your prescriber.',
   6)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ── 5. Studies: 2 Phase 2 landmark trials ────────────────────

-- 5a. NEJM 2023 — Jastreboff, obesity Phase 2
insert into public.studies (
  title, journal, publication_date, study_type, sample_size, population,
  source_url, doi, abstract, publication_status
)
select
  'Triple–Hormone-Receptor Agonist Retatrutide for Obesity — a Phase 2 Trial',
  'New England Journal of Medicine',
  '2023-08-10',
  'human',
  338,
  'Adults with obesity (BMI ≥30) or overweight (BMI ≥27) with at least one weight-related condition, without diabetes',
  'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972',
  '10.1056/NEJMoa2301972',
  '338 adults were randomised to placebo or retatrutide at 1, 4, 8, or 12 mg once-weekly subcutaneously (with lower starting doses and scheduled escalation), and followed for 48 weeks. At week 48, least-squares mean percent change in body weight was −24.2% in the 12 mg group versus −2.1% with placebo. Most adverse events were gastrointestinal and mild-to-moderate.',
  'published'
where not exists (
  select 1 from public.studies where doi = '10.1056/NEJMoa2301972'
);

-- 5b. Lancet 2023 — Rosenstock, type 2 diabetes Phase 2
insert into public.studies (
  title, journal, publication_date, study_type, sample_size, population,
  source_url, doi, abstract, publication_status
)
select
  'Retatrutide, a GIP, GLP-1 and glucagon receptor agonist, for people with type 2 diabetes: a randomised, double-blind, placebo-and-active-controlled, parallel-group, phase 2 trial',
  'The Lancet',
  '2023-08-12',
  'human',
  281,
  'Adults with type 2 diabetes, HbA1c 7.0–10.5%, on diet/exercise or stable metformin',
  'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)01053-X/fulltext',
  '10.1016/S0140-6736(23)01053-X',
  '281 adults with type 2 diabetes were randomised to retatrutide (0.5, 4, 8, or 12 mg weekly subcutaneously, with titration), dulaglutide 1.5 mg weekly, or placebo, and followed for 36 weeks. HbA1c reductions were dose-dependent, reaching −2.02% at 12 mg retatrutide. Mean body-weight changes at week 36 ranged from −3.19% at 0.5 mg to −16.94% at 12 mg.',
  'published'
where not exists (
  select 1 from public.studies where doi = '10.1016/S0140-6736(23)01053-X'
);

-- 5c. Link both studies to retatrutide
insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'retatrutide'
  and s.doi in ('10.1056/NEJMoa2301972', '10.1016/S0140-6736(23)01053-X')
  and not exists (
    select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id
  );

-- ── 6. Study dosages (trial arms) ────────────────────────────

-- NEJM Phase 2 obesity: 1, 4, 8, 12 mg weekly SC over 48 weeks
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, v.dosage_value, 'mg', 'once weekly subcutaneous', '48 weeks',
       v.context_note
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2301972'
cross join (values
  (1,  'Lowest dose arm; all participants started at 2 mg for 4 weeks before down- or up-titration.'),
  (4,  'Mid dose arm; scheduled titration up from 2 mg.'),
  (8,  'Higher dose arm; scheduled titration with checkpoints at 2, 4, and 6 mg.'),
  (12, 'Highest dose arm in the trial; titration continued through 2, 4, 6, and 9 mg before reaching 12 mg.')
) as v(dosage_value, context_note)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = v.dosage_value
  );

-- Lancet Phase 2 T2D: 0.5, 4, 8, 12 mg weekly SC over 36 weeks
insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, v.dosage_value, 'mg', 'once weekly subcutaneous', '36 weeks',
       v.context_note
from public.peptides p
join public.studies s on s.doi = '10.1016/S0140-6736(23)01053-X'
cross join (values
  (0.5, 'Lowest dose arm in the T2D Phase 2.'),
  (4,   'Mid dose arm; scheduled titration.'),
  (8,   'Higher dose arm; scheduled titration.'),
  (12,  'Highest dose arm in the T2D Phase 2.')
) as v(dosage_value, context_note)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = v.dosage_value
  );

-- ── 7. Study outcomes ────────────────────────────────────────

insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2301972'
cross join (values
  ('weight_loss',   'Mean body-weight reduction of 24.2% at 48 weeks on 12 mg weekly retatrutide, vs 2.1% on placebo.', 'Primary efficacy outcome'),
  ('weight_loss',   'Dose-response was observed across 1, 4, 8, and 12 mg arms with no apparent plateau at 48 weeks.', 'Secondary'),
  ('cardiometabolic','Favourable changes in HbA1c, lipids, and systolic blood pressure were reported across dose arms.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.1016/S0140-6736(23)01053-X'
cross join (values
  ('hba1c_reduction', 'HbA1c reduction of up to −2.02% at 12 mg weekly retatrutide over 36 weeks in adults with type 2 diabetes.', 'Primary efficacy outcome'),
  ('weight_loss',     'Mean body-weight reduction of 16.94% at 12 mg weekly retatrutide at 36 weeks in type 2 diabetes.', 'Secondary'),
  ('comparator',      'Retatrutide 8 mg and 12 mg produced larger HbA1c and weight reductions than dulaglutide 1.5 mg weekly.', 'Secondary')
) as v(outcome_type, description, significance)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );

-- ── 8. Side effects (from NEJM Phase 2 obesity trial) ────────

insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, v.effect, v.severity, v.frequency
from public.peptides p
join public.studies s on s.doi = '10.1056/NEJMoa2301972'
cross join (values
  ('Nausea',                       'mild-to-moderate', '~35–50% at 12 mg; most common during titration'),
  ('Diarrhoea',                    'mild-to-moderate', '~25–30%'),
  ('Vomiting',                     'mild-to-moderate', '~15–20%'),
  ('Constipation',                 'mild',             'Reported; dose-related'),
  ('Dyspepsia (indigestion)',      'mild',             'Reported; dose-related'),
  ('Decreased appetite',           'mild',             'Frequently reported — often an intended effect of the medicine'),
  ('Injection-site reaction',      'mild',             'Reported; less frequent than some other GLP-1 family agents'),
  ('Increased heart rate',         'mild',             'Small average increases observed across dose arms')
) as v(effect, severity, frequency)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = v.effect
  );
