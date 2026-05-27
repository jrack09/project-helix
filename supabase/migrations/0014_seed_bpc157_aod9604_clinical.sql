-- ============================================================
-- 0014_seed_bpc157_aod9604_clinical.sql
-- ============================================================
-- Seeds two investigational/research peptides:
--   • bpc-157  (BPC-157 — not approved; preclinical + very limited
--               human data; honest about evidence ceiling)
--   • aod-9604 (AOD-9604 — not approved; no adequate human RCTs;
--               TGA revoked food-ingredient listing)
--
-- Both are seeded with honest, conservative copy. The evidence
-- ceiling is the key message — strong preclinical signals, minimal
-- or absent rigorous human trial data.
--
-- The demo study row inserted in 0004_seed_demo.sql is left in
-- place for BPC-157; new clinical-profile columns are filled.
-- Idempotent: all inserts guarded by WHERE NOT EXISTS / ON CONFLICT.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- SECTION A — BPC-157  slug: bpc-157
-- ─────────────────────────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'BPC-157 (Body Protection Compound-157) is a synthetic pentadecapeptide derived from a protein found in gastric juice. In preclinical (animal and cell) models, it has been shown to interact with growth-factor signalling pathways, promote angiogenesis, modulate nitric oxide systems, and demonstrate gastroprotective and wound-healing effects. The precise mechanism in humans is not established — the preclinical findings have not been replicated in rigorous clinical trials, and the translation from rodent studies to human outcomes cannot be assumed.',
  receptor_targets      = '["Growth factor signalling pathways (preclinical)","Nitric oxide system (preclinical)"]'::jsonb,
  evidence_score        = 18,
  contraindications     = 'BPC-157 is not approved by the TGA, FDA, MHRA, EMA, or any comparable regulator for human therapeutic use.

Because there are no approved human trials, formal contraindications have not been established. The absence of contraindication data is itself a risk — it means we do not know who should not take it.

General cautions based on preclinical mechanism and class:
• Angiogenic activity in preclinical models raises theoretical concern in people with active cancer or a history of angiogenesis-dependent tumours
• Not studied in pregnancy or breastfeeding
• Not studied in severe organ impairment

There is no regulatory framework for safe human dosing. Any use outside of an approved clinical trial is unregulated.',
  drug_interactions     = '[
    {"drug":"Anticoagulants (e.g. warfarin, apixaban)","interaction":"Preclinical data suggest modulation of nitric oxide and platelet pathways. Theoretical interaction with anticoagulant effect — not studied in humans.","severity":"unknown"},
    {"drug":"NSAIDs","interaction":"In animal GI-injury models, BPC-157 was studied alongside NSAIDs. No human interaction data exist.","severity":"unknown"},
    {"drug":"Angiogenesis-modifying drugs","interaction":"BPC-157 promotes angiogenesis in preclinical models. Theoretical interaction with anti-VEGF or pro-angiogenic cancer treatments — no human data.","severity":"unknown"}
  ]'::jsonb,
  storage_handling      = 'BPC-157 is not a licensed pharmaceutical product. It is sold as a research chemical or compounded preparation, with no standardised manufacturing, quality-control requirements, or packaging standards enforceable under TGA regulations.

If handling a compounded or research preparation:
• Lyophilised (freeze-dried) powder: typically stored at −20°C or cooler; reconstituted solutions are unstable and should generally be used promptly or refrigerated short-term.
• Reconstituted solution: store at 2–8°C; most sources recommend use within 2–4 weeks of reconstitution, though no regulatory standard exists.
• Protect from light and freeze-thaw cycles.

These are class-based handling recommendations for peptide research chemicals — not TGA-approved storage guidelines.',
  pharmacokinetics      = '{
    "half_life":"Not formally established in humans. Animal data suggest a short half-life for the native peptide; stability in plasma is limited.",
    "tmax":"Not characterised from human pharmacokinetic studies.",
    "bioavailability_note":"Route matters: subcutaneous administration is used in most animal studies. Oral bioavailability of intact peptide is unknown and expected to be low due to GI proteolysis.",
    "clearance":"Not characterised in humans. Peptide degradation by plasma and tissue proteases is expected."
  }'::jsonb
where slug = 'bpc-157';

-- Expectations (framed as what preclinical data suggests, not what to expect)
insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'No approved human dosing protocol exists',
       'BPC-157 has not been tested in adequately powered human clinical trials. There is no approved dose, escalation schedule, or monitoring protocol. Any dosing information circulating online derives from animal studies or anecdote.',
       true),
  (4,  'Animal models, not human evidence',
       'Animal studies have shown effects on wound healing, tendon/ligament repair, GI injury, and joint inflammation — but these models do not reliably predict human outcomes. Human trials of adequate quality have not been completed.',
       true)
) as v(week_number, milestone, description, is_common)
where p.slug = 'bpc-157'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- Food guidance (minimal — general peptide handling context)
insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('avoid',  'Do not use with active cancer treatment without oncologist knowledge',
       'Theoretical angiogenic activity in preclinical models — always disclose any unregulated compounds to your oncologist.', 'anecdotal', 1),
  ('hydrate','Stay hydrated during any injectable preparation use',
       'General advice applicable to all injectable research chemicals.', 'editorial', 2)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'bpc-157'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- Tips
insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('other', 'The evidence base is preclinical only',
   'BPC-157 has a large body of animal model data. It does not have a comparable human trial record. The conditions studied in animals (tendon rupture, GI ulcers, spinal cord injury) are not proven to translate to human benefit — and adverse effects are also not well characterised in humans.',
   1),
  ('other', 'Compounded and online preparations are unregulated',
   'BPC-157 sold as a research chemical or compounded peptide is not subject to TGA manufacturing standards. Purity, sterility, and labelled concentration cannot be verified by the buyer. This is a meaningful safety consideration.',
   2),
  ('administration', 'Inform your prescriber if you are using BPC-157',
   'Any unregulated compound should be disclosed to your doctor, especially if you take prescription medicines, are being investigated for any condition, or have a planned surgical or medical procedure.',
   3)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'bpc-157'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION B — AOD-9604  slug: aod-9604
-- ─────────────────────────────────────────────────────────────

update public.peptides set
  mechanism_summary     = 'AOD-9604 is a synthetic 16-amino-acid fragment of human growth hormone (hGH), corresponding to residues 176–191 of the hGH sequence. In preclinical studies, it demonstrated fat-mobilising (lipolytic) effects without the growth-promoting and insulin-resistance effects of the full hGH molecule. In Australia, AOD-9604 was briefly listed as a food ingredient before the TGA reviewed its classification and removed it from the food ingredients register. Human clinical trial evidence is limited: early Phase 2 trials in obesity showed modest body-weight effects, and the development programme was discontinued before Phase 3 completion.',
  receptor_targets      = '["Beta-3 adrenergic receptor (preclinical hypothesis)","TGF-beta pathway (cartilage — preclinical)"]'::jsonb,
  evidence_score        = 15,
  contraindications     = 'AOD-9604 is not approved by the TGA, FDA, MHRA, or EMA for any therapeutic use.

The TGA reclassified and removed AOD-9604 from the food-ingredient register. It is not a licensed medicine.

No formal contraindications have been established because no approved prescribing label exists. General cautions:
• Active malignancy — GH-fragment peptides have theoretical growth-related concerns
• Pregnancy or breastfeeding — not studied
• Children and adolescents — not studied
• Severe organ impairment — not studied

Any use outside an approved clinical trial is unregulated.',
  drug_interactions     = '[
    {"drug":"Insulin and antidiabetic agents","interaction":"Preclinical fat-metabolism effects could theoretically interact with insulin sensitivity. No human interaction data exist.","severity":"unknown"},
    {"drug":"Growth hormone therapy","interaction":"Structural overlap with hGH fragment — theoretical interaction unknown; not studied in combination.","severity":"unknown"}
  ]'::jsonb,
  storage_handling      = 'AOD-9604 is not a licensed pharmaceutical product. It is sold as a research chemical or compounded preparation. No regulatory storage standards apply.

If handling a research preparation:
• Lyophilised powder: store at −20°C or cooler; avoid repeated freeze-thaw cycles.
• Reconstituted solution: store at 2–8°C, use promptly; stability is not formally validated.
• Protect from light.

These are general peptide research chemical guidelines — not TGA-approved storage instructions.',
  pharmacokinetics      = '{
    "half_life":"Not formally established. Phase 1/2 trial data suggest a short plasma half-life consistent with a small peptide.",
    "tmax":"Not characterised from published human PK studies.",
    "bioavailability_note":"Phase 2 trials used oral and subcutaneous routes. Oral bioavailability of intact peptide is expected to be low; trial data are not publicly reported in sufficient detail.",
    "clearance":"Proteolytic degradation expected; no regulatory-standard PK profile exists."
  }'::jsonb
where slug = 'aod-9604';

-- Expectations
insert into public.drug_expectations (drug_id, week_number, milestone, description, is_common)
select p.id, v.week_number, v.milestone, v.description, v.is_common
from public.peptides p
cross join (values
  (0,  'No approved human dosing protocol exists',
       'AOD-9604 development as a weight-management drug was discontinued before completing Phase 3. There is no approved dose, schedule, or monitoring protocol. Human trial data from Phase 2 obesity studies showed modest effects that were not compelling enough to advance.',
       true),
  (12, 'Limited Phase 2 obesity data',
       'Phase 2 trials of AOD-9604 (published in the early 2000s) reported modest reductions in body fat compared with placebo, but the effect size was small and insufficient to support regulatory submission. Phase 3 development was not pursued for weight management.',
       false)
) as v(week_number, milestone, description, is_common)
where p.slug = 'aod-9604'
  and not exists (
    select 1 from public.drug_expectations de
    where de.drug_id = p.id and de.week_number = v.week_number and de.milestone = v.milestone
  );

-- Food guidance (minimal)
insert into public.drug_food_guidance (drug_id, category, item, rationale, evidence_level, ordinal)
select p.id, v.category, v.item, v.rationale, v.evidence_level, v.ordinal
from public.peptides p
cross join (values
  ('avoid',  'Do not use with active cancer treatment without oncologist knowledge',
       'GH-fragment compounds have theoretical growth-related concerns — always disclose any unregulated compounds to your oncologist.', 'anecdotal', 1),
  ('hydrate','Stay hydrated during any injectable use',
       'General guidance applicable to all injectable research chemicals.', 'editorial', 2)
) as v(category, item, rationale, evidence_level, ordinal)
where p.slug = 'aod-9604'
  and not exists (
    select 1 from public.drug_food_guidance f
    where f.drug_id = p.id and f.category = v.category and f.item = v.item
  );

-- Tips
insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('other', 'The development programme was discontinued',
   'AOD-9604 completed Phase 2 obesity trials but was not taken to Phase 3 by its developer. This is not the same as being proven safe and effective — it means the evidence threshold for a serious weight-management medicine was not met.',
   1),
  ('other', 'TGA food-ingredient classification was revoked',
   'AOD-9604 was briefly listed in Australia as a food ingredient. The TGA reviewed its classification and removed it from the food ingredients register because it did not meet the criteria. It is not a food ingredient and it is not a licensed medicine.',
   2),
  ('administration', 'Disclose to your doctor',
   'Any unregulated compound should be declared to your prescriber — particularly relevant if you are using other medicines, planning surgery, or being investigated for a health condition.',
   3)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'aod-9604'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SECTION C — Study: one preclinical review for BPC-157
-- ─────────────────────────────────────────────────────────────
-- Note: the 0004_seed_demo.sql inserted a placeholder study for
-- BPC-157. We do not duplicate it. We add one published review
-- to reflect the actual literature level.

insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract, publication_status)
select
  'BPC 157 and Standard of Care in Tendon Healing — a Systematic Review of the Preclinical Evidence',
  'Frontiers in Pharmacology',
  '2021-04-29',
  'review', null, 'Preclinical (animal) studies of tendon, ligament, and musculoskeletal injury models',
  'https://www.frontiersin.org/articles/10.3389/fphar.2021.671694/full',
  '10.3389/fphar.2021.671694',
  'A systematic review of preclinical studies examining BPC-157 in tendon and musculoskeletal repair models. Found consistent pro-healing signals in animal studies (rats, primarily), including improved tendon-to-bone healing, reduced inflammation, and enhanced collagen organisation. Authors note the absence of human clinical trial data as a critical evidence gap and recommend against clinical use outside controlled trials.',
  'published'
where not exists (select 1 from public.studies where doi = '10.3389/fphar.2021.671694');

insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'bpc-157'
  and s.doi = '10.3389/fphar.2021.671694'
  and not exists (select 1 from public.study_peptides sp where sp.peptide_id = p.id and sp.study_id = s.id);

insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, v.outcome_type, v.description, v.significance
from public.peptides p
join public.studies s on s.doi = '10.3389/fphar.2021.671694'
cross join (values
  ('preclinical_efficacy', 'Consistent pro-healing signals in animal tendon/musculoskeletal models across reviewed studies.', 'From preclinical data — does not establish human efficacy'),
  ('evidence_gap',         'Authors highlight the absence of human clinical trial data as a critical gap; do not recommend clinical use outside trials.', 'Key limitation noted by reviewers')
) as v(outcome_type, description, significance)
where p.slug = 'bpc-157'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.description = v.description
  );
