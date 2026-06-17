-- ============================================================
-- 20260617120000_seed_peptidedosages_research_protocols.sql
-- ============================================================
-- Adds five manually reviewed PeptideDosages protocol pages to the
-- public drug API catalogue:
--   * epitalon
--   * 5-amino-1mq
--   * mots-c
--   * nad-plus
--   * ss-31
--
-- These PeptideDosages pages are editorial/research protocol pages,
-- not regulator-approved prescribing labels. The rows below preserve
-- that distinction in source_type, warnings, approved indication
-- status, and phase labels. SS-31 / elamipretide also includes the
-- FDA Forzinity prescribing information because elamipretide has a
-- narrow U.S. accelerated approval for Barth syndrome.
-- ============================================================

-- 1. Base catalogue rows

insert into public.peptides (
  slug, name, generic_name, brand_names, drug_class,
  administration_route, typical_dosing_schedule,
  prescription_required, short_description, mechanism_summary,
  receptor_targets, evidence_score, status_label,
  publication_status, is_visible, aliases,
  contraindications, drug_interactions, storage_handling,
  pharmacokinetics, half_life_hours, tmax_hours, duration_of_action_hours
)
select
  v.slug, v.name, v.generic_name, v.brand_names::jsonb, v.drug_class,
  v.administration_route, v.typical_dosing_schedule,
  v.prescription_required, v.short_description, v.mechanism_summary,
  v.receptor_targets::jsonb, v.evidence_score, v.status_label,
  'published', true, v.aliases::jsonb,
  v.contraindications, '[]'::jsonb, v.storage_handling,
  v.pharmacokinetics::jsonb, v.half_life_hours, v.tmax_hours, v.duration_of_action_hours
from (values
  (
    'epitalon',
    'Epitalon (Epithalon)',
    'epitalon',
    '[]',
    'Synthetic tetrapeptide',
    'subcutaneous_injection',
    'Editorial research protocol reference describes daily subcutaneous use for a short cycle; no approved human dosing label exists.',
    false,
    'A synthetic tetrapeptide studied for telomerase, circadian, and geroprotective biology in preclinical and limited human literature.',
    'Epitalon is a synthetic tetrapeptide (Ala-Glu-Asp-Gly) discussed in pineal peptide research. Proposed mechanisms include telomerase activation and modulation of melatonin/circadian pathways, but no regulator-approved human therapeutic protocol exists.',
    '["Telomerase pathway (research)","Melatonin/circadian regulation (research)"]',
    28,
    'investigational',
    '["Epithalon","Epithalamin tetrapeptide","Ala-Glu-Asp-Gly"]',
    'Epitalon is not approved by major regulators for human therapeutic use. Formal contraindications, dose adjustments, and monitoring requirements have not been established in an approved label. Avoid treating editorial dose tables as validated medical protocols.',
    'No licensed pharmaceutical storage standard exists for research Epitalon preparations. Editorial protocol pages describe frozen lyophilized storage and refrigerated storage after reconstitution, but product quality and sterility depend on the supplier or compounder.',
    '{"half_life":"Not established in an approved human prescribing label.","tmax":"Not established.","bioavailability_note":"Editorial protocol pages discuss subcutaneous administration; validated human pharmacokinetic data are limited.","clearance":"Peptide degradation is expected, but a regulator-standard PK profile is not available."}',
    null::numeric,
    null::numeric,
    null::numeric
  ),
  (
    '5-amino-1mq',
    '5-Amino-1MQ',
    '5-amino-1-methylquinolinium',
    '[]',
    'NNMT inhibitor',
    'subcutaneous_injection',
    'Editorial research protocol reference describes daily subcutaneous use from a 10 mg vial; no approved human dosing label exists.',
    false,
    'A small-molecule NNMT inhibitor studied in metabolic and NAD+ biology, mostly in preclinical and early research settings.',
    '5-Amino-1MQ is a cell-permeable nicotinamide N-methyltransferase (NNMT) inhibitor. Research interest centers on nicotinamide conservation, NAD+ availability, SIRT1-linked metabolic pathways, and adipose-tissue metabolism.',
    '["Nicotinamide N-methyltransferase (NNMT)"]',
    25,
    'investigational',
    '["5-amino-1-methylquinolinium","5 Amino 1MQ","5-Amino-1MQ"]',
    '5-Amino-1MQ is not approved by major regulators for human therapeutic use. No formal contraindications, dose adjustments, or monitoring requirements exist from an approved prescribing label.',
    'No licensed pharmaceutical storage standard exists for 5-Amino-1MQ research preparations. Editorial pages describe frozen lyophilized storage and refrigerated storage after reconstitution, but those instructions are not regulator-approved product labeling.',
    '{"half_life":"One editorial source cites approximately 3.8-6.9 hours from pharmacokinetic research; this is not an approved dosing-label parameter.","tmax":"Not established in an approved label.","bioavailability_note":"Editorial protocol pages discuss subcutaneous administration; human therapeutic bioavailability is not established.","clearance":"Not characterised in an approved human prescribing label."}',
    5.35::numeric,
    null::numeric,
    null::numeric
  ),
  (
    'mots-c',
    'MOTS-c',
    'MOTS-c',
    '[]',
    'Mitochondrial-derived peptide',
    'subcutaneous_injection',
    'Editorial research protocol reference describes daily subcutaneous titration; no approved human dosing label exists.',
    false,
    'A mitochondrial-derived peptide studied for AMPK-linked metabolic regulation, insulin sensitivity, and exercise/metabolic adaptation in preclinical research.',
    'MOTS-c is a 16-amino-acid mitochondrial-derived peptide studied as a metabolic stress signal. Proposed mechanisms include AMPK activation, altered folate-cycle signaling, glucose uptake, fatty-acid oxidation, and stress-response gene regulation.',
    '["AMPK pathway (research)","Mitochondrial stress signaling (research)"]',
    22,
    'investigational',
    '["MOTS-C","MOTS c","mitochondrial open reading frame of the 12S rRNA-c"]',
    'MOTS-c is not approved by major regulators for human therapeutic use. The editorial source notes no completed human clinical trials; formal contraindications and monitoring requirements have not been established.',
    'No licensed pharmaceutical storage standard exists for MOTS-c research preparations. Editorial protocol pages describe frozen lyophilized storage and short refrigerated use after reconstitution; these are not regulator-approved instructions.',
    '{"half_life":"Not established in an approved human prescribing label.","tmax":"Not established.","bioavailability_note":"Editorial protocol pages discuss subcutaneous administration; human clinical PK is not established.","clearance":"Not characterised in an approved human prescribing label."}',
    null::numeric,
    null::numeric,
    null::numeric
  ),
  (
    'nad-plus',
    'NAD+',
    'nicotinamide adenine dinucleotide',
    '[]',
    'Cellular coenzyme',
    'subcutaneous_injection',
    'Editorial research protocol reference describes daily subcutaneous titration from a 500 mg vial; no approved subcutaneous therapeutic dosing label exists.',
    false,
    'A cellular redox coenzyme involved in energy metabolism, DNA repair, and mitochondrial function; injectable protocols are typically compounded or research-context references.',
    'NAD+ is a nicotinamide-derived coenzyme central to redox metabolism, mitochondrial energy production, and DNA repair signaling. Clinical literature more commonly describes intravenous NAD+ exposure, while subcutaneous maintenance-style protocols are editorial or compounded references.',
    '["NAD+/NADH redox system","Sirtuin and PARP-linked NAD+ biology"]',
    30,
    'investigational',
    '["NAD","NAD Plus","nicotinamide adenine dinucleotide"]',
    'No approved subcutaneous NAD+ therapeutic dosing label is represented in this catalogue entry. Formal contraindications, dose adjustments, and monitoring requirements depend on the actual compounded product and clinical context.',
    'NAD+ is hygroscopic and light sensitive. Editorial protocol pages describe frozen lyophilized storage and refrigerated, light-protected storage after reconstitution; those instructions are not an approved product label.',
    '{"half_life":"Not applicable as a simple peptide-like exposure metric for this editorial compounded protocol.","tmax":"Not established for the subcutaneous editorial protocol.","bioavailability_note":"Published clinical use is often intravenous; subcutaneous protocol references are not equivalent to an approved label.","clearance":"NAD+ is consumed and recycled through cellular metabolic pathways."}',
    null::numeric,
    null::numeric,
    null::numeric
  ),
  (
    'ss-31',
    'SS-31 (Elamipretide)',
    'elamipretide',
    '["Forzinity"]',
    'Mitochondrial cardiolipin binder',
    'subcutaneous_injection',
    'FDA-approved Forzinity is once-daily subcutaneous elamipretide for Barth syndrome patients weighing at least 30 kg; the 10 mg vial page is an editorial research protocol and not the Forzinity label.',
    true,
    'A mitochondria-targeted tetrapeptide, also known as elamipretide, approved in the U.S. as Forzinity for a narrow Barth syndrome indication.',
    'SS-31 / elamipretide is a mitochondria-targeted tetrapeptide that binds cardiolipin in the inner mitochondrial membrane. It is intended to stabilize mitochondrial bioenergetics and reduce oxidative stress in selected disease contexts.',
    '["Cardiolipin","Mitochondrial inner membrane"]',
    62,
    'prescription',
    '["Elamipretide","Forzinity","MTP-131","Bendavia"]',
    'Forzinity is contraindicated in people with serious hypersensitivity to elamipretide or excipients. It is not approved for neonates because the formulation contains benzyl alcohol. Research-vial SS-31 protocols are not equivalent to the FDA-approved Forzinity product label.',
    'FDA-approved Forzinity is a ready-to-use solution with label-specific storage and discard instructions. Lyophilized 10 mg SS-31 vial handling from editorial protocol pages should not be treated as the approved product label.',
    '{"half_life":"The FDA label should be used for approved Forzinity pharmacokinetics; editorial 10 mg vial protocols are not label-equivalent.","tmax":"Refer to approved label for Forzinity PK details.","bioavailability_note":"Forzinity is administered subcutaneously; research lyophilized SS-31 protocols are separate from the approved product.","clearance":"Refer to approved label for renal impairment and other clinical considerations."}',
    null::numeric,
    null::numeric,
    null::numeric
  )
) as v(
  slug, name, generic_name, brand_names, drug_class,
  administration_route, typical_dosing_schedule,
  prescription_required, short_description, mechanism_summary,
  receptor_targets, evidence_score, status_label, aliases,
  contraindications, storage_handling, pharmacokinetics,
  half_life_hours, tmax_hours, duration_of_action_hours
)
on conflict (slug) do update set
  name = excluded.name,
  generic_name = excluded.generic_name,
  brand_names = excluded.brand_names,
  drug_class = excluded.drug_class,
  administration_route = excluded.administration_route,
  typical_dosing_schedule = excluded.typical_dosing_schedule,
  prescription_required = excluded.prescription_required,
  short_description = excluded.short_description,
  mechanism_summary = excluded.mechanism_summary,
  receptor_targets = excluded.receptor_targets,
  evidence_score = excluded.evidence_score,
  status_label = excluded.status_label,
  publication_status = excluded.publication_status,
  is_visible = excluded.is_visible,
  aliases = excluded.aliases,
  contraindications = excluded.contraindications,
  storage_handling = excluded.storage_handling,
  pharmacokinetics = excluded.pharmacokinetics,
  half_life_hours = excluded.half_life_hours,
  tmax_hours = excluded.tmax_hours,
  duration_of_action_hours = excluded.duration_of_action_hours,
  updated_at = now();

-- 2. Sources

insert into public.drug_sources (
  drug_id, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal
)
select p.id, v.source_type, v.label, v.url, v.region, v.authority, v.citation_text, v.retrieved_at::date, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'editorial', 'Epitalon 10 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/epitalon-epithalon-10-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for Epitalon / Epithalon 10 mg vial; not a prescribing label.', '2026-06-17', 1),
  ('5-amino-1mq', 'editorial', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/5-amino-1mq-10-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for 5-Amino-1MQ 10 mg vial; not a prescribing label.', '2026-06-17', 1),
  ('mots-c', 'editorial', 'MOTS-c 20 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/mots-c-20-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for MOTS-c 20 mg vial; not a prescribing label.', '2026-06-17', 1),
  ('nad-plus', 'editorial', 'NAD+ 500 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/nad-500-mg-10ml-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for NAD+ 500 mg vial; not a prescribing label.', '2026-06-17', 1),
  ('ss-31', 'editorial', 'SS-31 10 mg vial PeptideDosages protocol', 'https://peptidedosages.com/single-peptide-dosages/ss-31-10-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial research protocol page for SS-31 10 mg vial; not the FDA-approved Forzinity label.', '2026-06-17', 1),
  ('ss-31', 'prescribing_information', 'Forzinity prescribing information', 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/215244s000lbl.pdf', 'US', 'FDA', 'FDA prescribing information for Forzinity (elamipretide) injection, initial U.S. approval 2025.', '2026-06-17', 2)
) as v(slug, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_sources s
  where s.drug_id = p.id and s.label = v.label
);

-- 3. Regulatory / indication status

insert into public.drug_approved_indications (
  drug_id, region, authority, approval_status, indication, population, source_id, ordinal
)
select p.id, v.region, v.authority, v.approval_status, v.indication, v.population, s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'Global', null, 'not_approved', 'No approved therapeutic indication represented in this catalogue entry.', 'No approved prescribing population.', 'Epitalon 10 mg vial PeptideDosages protocol', 1),
  ('5-amino-1mq', 'Global', null, 'not_approved', 'No approved therapeutic indication represented in this catalogue entry.', 'No approved prescribing population.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 1),
  ('mots-c', 'Global', null, 'not_approved', 'No approved therapeutic indication represented in this catalogue entry.', 'No approved prescribing population.', 'MOTS-c 20 mg vial PeptideDosages protocol', 1),
  ('nad-plus', 'Global', null, 'not_approved', 'No approved subcutaneous therapeutic dosing indication represented in this catalogue entry.', 'No approved prescribing population for the editorial subcutaneous protocol.', 'NAD+ 500 mg vial PeptideDosages protocol', 1),
  ('ss-31', 'US', 'FDA', 'approved', 'Improve muscle strength in adult and pediatric patients with Barth syndrome weighing at least 30 kg.', 'Adult and pediatric Barth syndrome patients weighing at least 30 kg, per Forzinity label.', 'Forzinity prescribing information', 1),
  ('ss-31', 'Global', null, 'investigational', 'Other mitochondrial, metabolic, or longevity uses are not represented as approved indications here.', 'Clinical trial or prescriber-directed contexts only.', 'SS-31 10 mg vial PeptideDosages protocol', 2)
) as v(slug, region, authority, approval_status, indication, population, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_approved_indications i
  where i.drug_id = p.id and i.region = v.region and i.indication = v.indication
);

-- 4. Warnings and missed-dose context

insert into public.drug_warnings (drug_id, severity, title, body, source_id, ordinal, is_red_flag)
select p.id, v.severity, v.title, v.body, s.id, v.ordinal, v.is_red_flag
from public.peptides p
join (values
  ('epitalon', 'caution', 'Editorial protocol only', 'Epitalon has no approved human therapeutic dosing label. The 10 mg vial schedule is an editorial research protocol reference, not a validated prescribing protocol.', 'Epitalon 10 mg vial PeptideDosages protocol', 1, false),
  ('epitalon', 'urgent', 'Unexpected systemic reaction', 'Stop use and seek medical advice for rash, swelling, breathing symptoms, severe dizziness, or any concerning reaction after an unapproved injectable product.', 'Epitalon 10 mg vial PeptideDosages protocol', 2, true),
  ('5-amino-1mq', 'caution', 'Long-term human safety not established', '5-Amino-1MQ has no approved human therapeutic dosing label. Human safety, dose adjustment, and monitoring standards are not established.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 1, false),
  ('5-amino-1mq', 'urgent', 'Unexpected systemic reaction', 'Stop use and seek medical advice for rash, swelling, breathing symptoms, chest symptoms, severe dizziness, or any concerning reaction after an unapproved injectable product.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 2, true),
  ('mots-c', 'caution', 'No completed human clinical trials cited', 'MOTS-c protocol dosing is editorial and extrapolative. The source page notes that completed human clinical trial evidence is not available.', 'MOTS-c 20 mg vial PeptideDosages protocol', 1, false),
  ('mots-c', 'urgent', 'Unexpected systemic reaction', 'Stop use and seek medical advice for rash, swelling, breathing symptoms, severe dizziness, or any concerning reaction after an unapproved injectable product.', 'MOTS-c 20 mg vial PeptideDosages protocol', 2, true),
  ('nad-plus', 'caution', 'Compounded protocol, not an approved label', 'Subcutaneous NAD+ protocol dosing is represented here as an editorial compounded/research reference. It is not an approved product label.', 'NAD+ 500 mg vial PeptideDosages protocol', 1, false),
  ('nad-plus', 'urgent', 'Unexpected systemic reaction', 'Seek medical advice for severe injection-site reaction, rash, swelling, breathing symptoms, severe anxiety, chest symptoms, fainting, or other concerning symptoms.', 'NAD+ 500 mg vial PeptideDosages protocol', 2, true),
  ('ss-31', 'info', 'Approved label differs from research-vial protocol', 'Forzinity is the FDA-approved elamipretide product for a narrow Barth syndrome indication. The 10 mg vial SS-31 protocol page is an editorial research protocol and is not the Forzinity label.', 'Forzinity prescribing information', 1, false),
  ('ss-31', 'caution', 'Benzyl alcohol and hypersensitivity label warnings', 'Forzinity labeling warns about benzyl alcohol toxicity in neonates and serious hypersensitivity reactions. Use the approved label for Forzinity-specific safety decisions.', 'Forzinity prescribing information', 2, false),
  ('ss-31', 'urgent', 'Hypersensitivity symptoms', 'Serious allergic symptoms such as breathing difficulty, widespread rash, swelling, or severe skin reaction need urgent medical assessment.', 'Forzinity prescribing information', 3, true)
) as v(slug, severity, title, body, source_label, ordinal, is_red_flag)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_warnings w
  where w.drug_id = p.id and w.title = v.title
);

insert into public.drug_missed_dose_rules (
  drug_id, formulation, max_delay_hours, instruction, restart_guidance, source_id, ordinal
)
select p.id, v.formulation, v.max_delay_hours, v.instruction, v.restart_guidance, s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'research lyophilized vial', null::integer, 'No approved missed-dose rule exists for Epitalon.', 'Do not double doses based on an editorial schedule; discuss interruptions with a clinician or research supervisor.', 'Epitalon 10 mg vial PeptideDosages protocol', 1),
  ('5-amino-1mq', 'research lyophilized vial', null::integer, 'No approved missed-dose rule exists for 5-Amino-1MQ.', 'Do not double doses based on an editorial schedule; discuss interruptions with a clinician or research supervisor.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 1),
  ('mots-c', 'research lyophilized vial', null::integer, 'No approved missed-dose rule exists for MOTS-c.', 'Do not double doses based on an editorial titration schedule; discuss interruptions with a clinician or research supervisor.', 'MOTS-c 20 mg vial PeptideDosages protocol', 1),
  ('nad-plus', 'research/compounded lyophilized vial', null::integer, 'No approved missed-dose rule exists for this subcutaneous NAD+ protocol.', 'Do not double doses based on an editorial schedule; discuss interruptions with a clinician or compounder.', 'NAD+ 500 mg vial PeptideDosages protocol', 1),
  ('ss-31', 'Forzinity single-patient-use vial', null::integer, 'If a Forzinity dose is missed, skip it and take the next dose at the scheduled time.', 'Do not take a double dose of Forzinity.', 'Forzinity prescribing information', 1),
  ('ss-31', 'research lyophilized vial', null::integer, 'No approved missed-dose rule exists for the editorial 10 mg SS-31 research-vial protocol.', 'Do not double doses based on an editorial schedule; use the approved Forzinity label or prescriber instructions when applicable.', 'SS-31 10 mg vial PeptideDosages protocol', 2)
) as v(slug, formulation, max_delay_hours, instruction, restart_guidance, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_missed_dose_rules r
  where r.drug_id = p.id and r.formulation = v.formulation and r.instruction = v.instruction
);

-- 5. Reconstitution guide

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
  ('epitalon', 10::numeric, 2.0::numeric, 5.0::numeric,
    'Editorial protocol: add bacteriostatic water slowly down the vial wall, avoid foaming, gently swirl or roll until dissolved, label, protect from light, and refrigerate.',
    'At 5 mg/mL, 1 U-100 unit = 0.01 mL = 0.05 mg (50 mcg).',
    'Editorial protocol describes frozen lyophilized storage around -20 C, with routine protection from moisture and light.',
    'Refrigerate reconstituted solution at 2-8 C and protect from light.',
    'Editorial page describes 2-4 weeks; use stricter compounder or research protocol instructions if supplied.',
    1),
  ('5-amino-1mq', 10::numeric, 2.0::numeric, 5.0::numeric,
    'Editorial protocol: allow vial to reach room temperature, add bacteriostatic water slowly down the vial wall, avoid foaming, gently swirl or roll until clear, label, protect from light, and refrigerate.',
    'At 5 mg/mL, 1 U-100 unit = 0.01 mL = 0.05 mg (50 mcg).',
    'Editorial protocol describes frozen lyophilized storage around -20 C.',
    'Refrigerate reconstituted solution at 2-8 C and protect from light.',
    'Editorial page describes 2-4 weeks.',
    1),
  ('mots-c', 20::numeric, 3.0::numeric, 6.67::numeric,
    'Editorial protocol: add 3.0 mL bacteriostatic water slowly down the vial wall, avoid foaming, gently swirl or roll until dissolved, label with reconstitution date, protect from light, and refrigerate.',
    'At about 6.67 mg/mL, 1 U-100 unit = 0.01 mL = about 0.0667 mg (66.7 mcg). For very small volumes, lower-capacity insulin syringes may improve readability.',
    'Editorial protocol describes frozen lyophilized storage around -20 C or below, protected from light and moisture.',
    'Refrigerate reconstituted solution at 2-8 C and protect from light.',
    'Editorial page describes use within 7 days for best potency.',
    1),
  ('nad-plus', 500::numeric, 3.0::numeric, 166.7::numeric,
    'Editorial protocol: allow vial to reach room temperature, add 3.0 mL bacteriostatic water slowly down the vial wall, do not shake vigorously, swirl or roll until clear and colorless, label, protect from light, and refrigerate.',
    'At about 166.7 mg/mL, 1 U-100 unit = 0.01 mL = about 1.67 mg NAD+. Example editorial conversions: 50 mg = 30 units, 75 mg = 45 units, 100 mg = 60 units.',
    'Editorial protocol describes frozen lyophilized storage around -20 C or below, dry and protected from light.',
    'Refrigerate reconstituted solution at 2-8 C, protect from light, and inspect for clarity.',
    'Editorial page describes up to 14 days.',
    1),
  ('ss-31', 10::numeric, 1.0::numeric, 10.0::numeric,
    'Editorial research-vial protocol: add 1.0 mL bacteriostatic water slowly down the vial wall, avoid vigorous shaking, gently swirl or roll until clear, label with reconstitution date, protect from light, and refrigerate.',
    'At 10 mg/mL, 1 U-100 unit = 0.01 mL = 0.1 mg (100 mcg). This applies to the editorial 10 mg research-vial protocol, not the ready-to-use Forzinity vial.',
    'Editorial protocol describes frozen lyophilized storage around -20 C, protected from light and moisture.',
    'Refrigerate reconstituted solution at 2-8 C and protect from light.',
    'Editorial page describes use within 4 weeks.',
    1)
) as v(slug, vial_size_mg, bac_water_ml, concentration_mg_per_ml,
       technique_notes, measurement_note, storage_lyophilized, storage_reconstituted, use_within, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_reconstitution_guide r
  where r.drug_id = p.id and r.vial_size_mg = v.vial_size_mg and r.bac_water_ml = v.bac_water_ml
);

-- 6. Dose reference tables

insert into public.drug_dose_reference
  (drug_id, protocol_label, phase_label, dose_mg, units_u100, volume_ml, ordinal)
select p.id, v.protocol_label, v.phase_label, v.dose_mg, v.units_u100, v.volume_ml, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'Editorial 10 mg vial protocol (5 mg/mL)', 'Days 1-20 cycle-on reference', 5.0::numeric, 100, 1.00::numeric, 10),
  ('epitalon', 'Editorial 10 mg vial protocol (5 mg/mL)', 'Cycle-off reference', 0.0::numeric, 0, 0.00::numeric, 20),

  ('5-amino-1mq', 'Editorial 10 mg vial protocol (5 mg/mL)', 'Days 1-2 tolerance reference', 2.5::numeric, 50, 0.50::numeric, 10),
  ('5-amino-1mq', 'Editorial 10 mg vial protocol (5 mg/mL)', 'Days 3+ standard reference', 5.0::numeric, 100, 1.00::numeric, 20),
  ('5-amino-1mq', 'Editorial 10 mg vial protocol (5 mg/mL)', 'Alternative BID reference, per injection', 2.5::numeric, 50, 0.50::numeric, 30),

  ('mots-c', 'Editorial 20 mg vial titration (6.67 mg/mL)', 'Weeks 1-2', 0.2::numeric, 3, 0.03::numeric, 10),
  ('mots-c', 'Editorial 20 mg vial titration (6.67 mg/mL)', 'Weeks 3-4', 0.4::numeric, 6, 0.06::numeric, 20),
  ('mots-c', 'Editorial 20 mg vial titration (6.67 mg/mL)', 'Weeks 5-6', 0.6::numeric, 9, 0.09::numeric, 30),
  ('mots-c', 'Editorial 20 mg vial titration (6.67 mg/mL)', 'Weeks 7-8', 0.8::numeric, 12, 0.12::numeric, 40),
  ('mots-c', 'Editorial 20 mg vial titration (6.67 mg/mL)', 'Weeks 9-10+ reference', 1.0::numeric, 15, 0.15::numeric, 50),

  ('nad-plus', 'Editorial 500 mg vial titration (166.7 mg/mL)', 'Week 1', 50::numeric, 30, 0.30::numeric, 10),
  ('nad-plus', 'Editorial 500 mg vial titration (166.7 mg/mL)', 'Week 2', 75::numeric, 45, 0.45::numeric, 20),
  ('nad-plus', 'Editorial 500 mg vial titration (166.7 mg/mL)', 'Weeks 3-16 reference', 100::numeric, 60, 0.60::numeric, 30),

  ('ss-31', 'Editorial 10 mg vial standard protocol (10 mg/mL)', 'Weeks 1-2', 5::numeric, 50, 0.50::numeric, 10),
  ('ss-31', 'Editorial 10 mg vial standard protocol (10 mg/mL)', 'Weeks 3-8', 10::numeric, 100, 1.00::numeric, 20),
  ('ss-31', 'Editorial 10 mg vial advanced protocol (10 mg/mL)', 'Weeks 1-2', 5::numeric, 50, 0.50::numeric, 30),
  ('ss-31', 'Editorial 10 mg vial advanced protocol (10 mg/mL)', 'Weeks 3-4', 10::numeric, 100, 1.00::numeric, 40),
  ('ss-31', 'Editorial 10 mg vial advanced protocol (10 mg/mL)', 'Weeks 5-8 split injection reference', 15::numeric, 150, 1.50::numeric, 50),
  ('ss-31', 'Editorial 10 mg vial advanced protocol (10 mg/mL)', 'Optional weeks 9-12 split injection reference', 20::numeric, 200, 2.00::numeric, 60),
  ('ss-31', 'Forzinity label reference (80 mg/mL ready-to-use)', 'Approved Barth syndrome label dose', 40::numeric, 50, 0.50::numeric, 70)
) as v(slug, protocol_label, phase_label, dose_mg, units_u100, volume_ml, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_dose_reference d
  where d.drug_id = p.id
    and d.protocol_label = v.protocol_label
    and d.phase_label = v.phase_label
);

-- 7. Dose escalation phases exposed in clinical_profile

insert into public.drug_dose_escalation_phases (
  drug_id, protocol_label, phase_label, start_week, end_week,
  dose_amount, dose_unit, frequency, route, phase_purpose,
  hold_or_reduce_guidance, source_id, ordinal
)
select p.id, v.protocol_label, v.phase_label, v.start_week, v.end_week,
  v.dose_amount, v.dose_unit, v.frequency, v.route, v.phase_purpose,
  v.hold_or_reduce_guidance, s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'Editorial Epitalon 10 mg vial reference', 'Days 1-20 cycle-on', 1, 3, 5::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial cycle-on research reference.', 'Not approved dosing. Do not treat as a prescribing protocol.', 'Epitalon 10 mg vial PeptideDosages protocol', 10),
  ('epitalon', 'Editorial Epitalon 10 mg vial reference', 'Weeks 4-26 cycle-off', 4, 26, 0::numeric, 'mg', 'off-cycle', null, 'Editorial off-cycle reference.', 'No approved repeat-cycle schedule exists.', 'Epitalon 10 mg vial PeptideDosages protocol', 20),

  ('5-amino-1mq', 'Editorial 5-Amino-1MQ 10 mg vial reference', 'Days 1-2 tolerance', 1, 1, 2.5::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial tolerance reference.', 'Not approved dosing. Do not treat as a prescribing protocol.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 10),
  ('5-amino-1mq', 'Editorial 5-Amino-1MQ 10 mg vial reference', 'Days 3+ standard', 1, null, 5::numeric, 'mg', 'once daily or split BID', 'subcutaneous injection', 'Editorial standard reference.', 'No approved escalation or maintenance schedule exists.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 20),

  ('mots-c', 'Editorial MOTS-c 20 mg vial titration reference', 'Weeks 1-2', 1, 2, 0.2::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial starter reference.', 'Not approved dosing; monitor under research or clinician direction only.', 'MOTS-c 20 mg vial PeptideDosages protocol', 10),
  ('mots-c', 'Editorial MOTS-c 20 mg vial titration reference', 'Weeks 3-4', 3, 4, 0.4::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial gradual titration reference.', 'Do not escalate based on this table as medical advice.', 'MOTS-c 20 mg vial PeptideDosages protocol', 20),
  ('mots-c', 'Editorial MOTS-c 20 mg vial titration reference', 'Weeks 5-6', 5, 6, 0.6::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial gradual titration reference.', 'Do not escalate based on this table as medical advice.', 'MOTS-c 20 mg vial PeptideDosages protocol', 30),
  ('mots-c', 'Editorial MOTS-c 20 mg vial titration reference', 'Weeks 7-8', 7, 8, 0.8::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial gradual titration reference.', 'Do not escalate based on this table as medical advice.', 'MOTS-c 20 mg vial PeptideDosages protocol', 40),
  ('mots-c', 'Editorial MOTS-c 20 mg vial titration reference', 'Weeks 9-10+', 9, null, 1.0::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial upper reference.', 'No approved maintenance duration exists.', 'MOTS-c 20 mg vial PeptideDosages protocol', 50),

  ('nad-plus', 'Editorial NAD+ 500 mg vial titration reference', 'Week 1', 1, 1, 50::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial tolerance reference.', 'Not approved dosing. Use clinician or compounder instructions when applicable.', 'NAD+ 500 mg vial PeptideDosages protocol', 10),
  ('nad-plus', 'Editorial NAD+ 500 mg vial titration reference', 'Week 2', 2, 2, 75::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial titration reference.', 'Do not escalate based on this table as medical advice.', 'NAD+ 500 mg vial PeptideDosages protocol', 20),
  ('nad-plus', 'Editorial NAD+ 500 mg vial titration reference', 'Weeks 3-16', 3, 16, 100::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial maintenance-style reference.', 'No approved maintenance duration exists for this compounded protocol.', 'NAD+ 500 mg vial PeptideDosages protocol', 30),

  ('ss-31', 'Forzinity approved label reference', 'Daily labeled dose', 0, null, 40::numeric, 'mg', 'once daily', 'subcutaneous injection', 'FDA-approved Barth syndrome label reference for patients weighing at least 30 kg.', 'Use the FDA label and prescriber instructions; reduce dose in severe renal impairment per label.', 'Forzinity prescribing information', 5),
  ('ss-31', 'Editorial SS-31 10 mg vial standard reference', 'Weeks 1-2', 1, 2, 5::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial starter reference.', 'Not the Forzinity label. Do not treat as approved dosing.', 'SS-31 10 mg vial PeptideDosages protocol', 10),
  ('ss-31', 'Editorial SS-31 10 mg vial standard reference', 'Weeks 3-8', 3, 8, 10::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Editorial standard reference.', 'Not the Forzinity label. Do not treat as approved dosing.', 'SS-31 10 mg vial PeptideDosages protocol', 20),
  ('ss-31', 'Editorial SS-31 10 mg vial advanced reference', 'Weeks 5-8 split injection', 5, 8, 15::numeric, 'mg', 'daily split injections', 'subcutaneous injection', 'Editorial advanced research reference.', 'Advanced editorial dosing is not a prescribing protocol; use medical supervision for any approved elamipretide use.', 'SS-31 10 mg vial PeptideDosages protocol', 30),
  ('ss-31', 'Editorial SS-31 10 mg vial advanced reference', 'Optional weeks 9-12 split injection', 9, 12, 20::numeric, 'mg', 'daily split injections', 'subcutaneous injection', 'Editorial optional advanced research reference.', 'Advanced editorial dosing is not a prescribing protocol and is not the Forzinity label.', 'SS-31 10 mg vial PeptideDosages protocol', 40)
) as v(slug, protocol_label, phase_label, start_week, end_week, dose_amount, dose_unit, frequency, route, phase_purpose, hold_or_reduce_guidance, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_dose_escalation_phases d
  where d.drug_id = p.id and d.protocol_label = v.protocol_label and d.phase_label = v.phase_label
);

-- 8. Protocol timeline journey-map rows

insert into public.drug_protocol_timeline (
  drug_id, protocol_label, week_start, week_end, phase_title,
  typical_dose_mg, cadence_days, expected_changes, common_adjustments, user_focus, source_id, ordinal
)
select p.id, v.protocol_label, v.week_start, v.week_end, v.phase_title,
  v.typical_dose_mg, v.cadence_days, v.expected_changes, v.common_adjustments, v.user_focus,
  s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'Editorial 20-day cycle reference', 1, 3, 'Cycle-on reference', 5::numeric, 1, array['editorial short-cycle protocol reference','sleep/circadian focus discussed in source'], array['no approved adjustment rules exist'], array['site rotation','document dose and site','do not treat as prescribing guidance'], 'Epitalon 10 mg vial PeptideDosages protocol', 10),
  ('epitalon', 'Editorial 20-day cycle reference', 4, 26, 'Cycle-off reference', 0::numeric, null::integer, array['editorial off-cycle interval'], array['repeat cycles are not label validated'], array['review evidence ceiling','avoid unsupported claims'], 'Epitalon 10 mg vial PeptideDosages protocol', 20),

  ('5-amino-1mq', 'Editorial daily reference', 1, 1, 'Tolerance reference', 2.5::numeric, 1, array['editorial low-start reference'], array['no approved hold or reduction rule exists'], array['track tolerance','site rotation','avoid self-escalation'], '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 10),
  ('5-amino-1mq', 'Editorial daily reference', 1, null, 'Standard reference', 5::numeric, 1, array['editorial daily or BID reference'], array['no approved maintenance rule exists'], array['track adverse symptoms','maintain sterile handling'], '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 20),

  ('mots-c', 'Editorial gradual titration reference', 1, 2, 'Starter reference', 0.2::numeric, 1, array['editorial gradual titration start'], array['no approved adjustment rules exist'], array['track tolerance','site rotation'], 'MOTS-c 20 mg vial PeptideDosages protocol', 10),
  ('mots-c', 'Editorial gradual titration reference', 3, 8, 'Step-up reference', 0.6::numeric, 1, array['editorial 200 mcg step increases every two weeks'], array['pause escalation if concerning symptoms occur'], array['document dose and symptoms','avoid unsupported efficacy assumptions'], 'MOTS-c 20 mg vial PeptideDosages protocol', 20),
  ('mots-c', 'Editorial gradual titration reference', 9, null, 'Upper reference', 1.0::numeric, 1, array['editorial 1 mg/day reference'], array['no approved long-term maintenance rule exists'], array['review evidence ceiling','monitor adverse symptoms'], 'MOTS-c 20 mg vial PeptideDosages protocol', 30),

  ('nad-plus', 'Editorial daily titration reference', 1, 1, 'Starter reference', 50::numeric, 1, array['editorial low-start tolerance reference'], array['no approved adjustment rules exist'], array['track sleep/anxiety/fatigue symptoms','inspect solution clarity'], 'NAD+ 500 mg vial PeptideDosages protocol', 10),
  ('nad-plus', 'Editorial daily titration reference', 2, 2, 'Step-up reference', 75::numeric, 1, array['editorial intermediate titration reference'], array['pause escalation if concerning symptoms occur'], array['document tolerance','site rotation'], 'NAD+ 500 mg vial PeptideDosages protocol', 20),
  ('nad-plus', 'Editorial daily titration reference', 3, 16, 'Maintenance-style reference', 100::numeric, 1, array['editorial 100 mg/day reference'], array['no approved duration rule exists'], array['protect from light','monitor injection-site response'], 'NAD+ 500 mg vial PeptideDosages protocol', 30),

  ('ss-31', 'Forzinity approved label reference', 0, null, 'Approved Barth syndrome label reference', 40::numeric, 1, array['FDA-approved indication-specific daily dose'], array['renal impairment dose reduction per label'], array['use approved product labeling','monitor hypersensitivity'], 'Forzinity prescribing information', 5),
  ('ss-31', 'Editorial 10 mg vial reference', 1, 2, 'Starter reference', 5::numeric, 1, array['editorial research-vial start'], array['not equivalent to Forzinity label'], array['site rotation','do not treat as approved dosing'], 'SS-31 10 mg vial PeptideDosages protocol', 10),
  ('ss-31', 'Editorial 10 mg vial reference', 3, 8, 'Standard reference', 10::numeric, 1, array['editorial 10 mg/day reference'], array['not equivalent to Forzinity label'], array['monitor injection-site reactions','avoid unsupported use claims'], 'SS-31 10 mg vial PeptideDosages protocol', 20),
  ('ss-31', 'Editorial 10 mg vial reference', 5, 12, 'Advanced split-dose reference', 15::numeric, 1, array['editorial 15-20 mg/day split-injection reference'], array['medical supervision emphasized by source'], array['split injection sites','monitor adverse reactions'], 'SS-31 10 mg vial PeptideDosages protocol', 30)
) as v(slug, protocol_label, week_start, week_end, phase_title, typical_dose_mg, cadence_days, expected_changes, common_adjustments, user_focus, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_protocol_timeline t
  where t.drug_id = p.id and t.protocol_label = v.protocol_label and t.phase_title = v.phase_title
);

-- 9. Storage, injection sites, and injection guide

insert into public.drug_formulation_storage (
  drug_id, formulation, storage_state, temperature, protect_from_light, do_not_freeze,
  expiry_after_opening, expiry_after_reconstitution, handling_notes, source_id, ordinal
)
select p.id, v.formulation, v.storage_state, v.temperature, v.protect_from_light, v.do_not_freeze,
  v.expiry_after_opening, v.expiry_after_reconstitution, v.handling_notes, s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'research lyophilized vial', 'before reconstitution', '-20 C or refrigerated per supplier protocol', true, false, null, null, 'Editorial protocol says protect from moisture and avoid repeated freeze-thaw cycles.', 'Epitalon 10 mg vial PeptideDosages protocol', 10),
  ('epitalon', 'research reconstituted vial', 'after reconstitution', '2-8 C', true, true, null, 'Editorial page describes 2-4 weeks.', 'Not an approved label; use stricter compounder or research-protocol instructions.', 'Epitalon 10 mg vial PeptideDosages protocol', 20),
  ('5-amino-1mq', 'research lyophilized vial', 'before reconstitution', '-20 C', true, false, null, null, 'Editorial protocol says store dry, dark, and frozen.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 10),
  ('5-amino-1mq', 'research reconstituted vial', 'after reconstitution', '2-8 C', true, true, null, 'Editorial page describes 2-4 weeks.', 'Not an approved label; use stricter compounder or research-protocol instructions.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 20),
  ('mots-c', 'research lyophilized vial', 'before reconstitution', '-20 C or below', true, false, null, null, 'Editorial protocol says store dry, dark, and avoid repeated freeze-thaw.', 'MOTS-c 20 mg vial PeptideDosages protocol', 10),
  ('mots-c', 'research reconstituted vial', 'after reconstitution', '2-8 C', true, true, null, 'Editorial page describes 7 days for best potency.', 'Not an approved label; use stricter compounder or research-protocol instructions.', 'MOTS-c 20 mg vial PeptideDosages protocol', 20),
  ('nad-plus', 'research lyophilized vial', 'before reconstitution', '-20 C or below', true, false, null, null, 'Editorial protocol emphasizes dry, dark storage because NAD+ powder is hygroscopic.', 'NAD+ 500 mg vial PeptideDosages protocol', 10),
  ('nad-plus', 'research reconstituted vial', 'after reconstitution', '2-8 C', true, true, null, 'Editorial page describes up to 14 days.', 'Inspect before each use; discard if cloudy, discolored, or particulate.', 'NAD+ 500 mg vial PeptideDosages protocol', 20),
  ('ss-31', 'Forzinity ready-to-use vial', 'after first opening', 'Use label storage instructions', true, true, 'Discard vials 8 days after first opening per label.', null, 'Ready-to-use Forzinity is not the same as a lyophilized 10 mg research vial.', 'Forzinity prescribing information', 5),
  ('ss-31', 'research lyophilized vial', 'before reconstitution', '-20 C', true, false, null, null, 'Editorial protocol says store frozen, sealed, dry, and protected from light.', 'SS-31 10 mg vial PeptideDosages protocol', 10),
  ('ss-31', 'research reconstituted vial', 'after reconstitution', '2-8 C', true, true, null, 'Editorial page describes 4 weeks.', 'Not the approved Forzinity storage label.', 'SS-31 10 mg vial PeptideDosages protocol', 20)
) as v(slug, formulation, storage_state, temperature, protect_from_light, do_not_freeze, expiry_after_opening, expiry_after_reconstitution, handling_notes, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_formulation_storage fs
  where fs.drug_id = p.id and fs.formulation = v.formulation and fs.storage_state = v.storage_state
);

insert into public.drug_injection_sites (
  drug_id, site, preferred, rotation_guidance, avoid_notes, source_id, ordinal
)
select p.id, v.site, v.preferred, v.rotation_guidance, v.avoid_notes, s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'abdomen', true, 'Rotate sites daily and stay at least 2 inches from the navel.', 'Avoid bruised, red, hard, scarred, or irritated skin.', 'Epitalon 10 mg vial PeptideDosages protocol', 10),
  ('epitalon', 'thigh', true, 'Rotate between abdomen and outer thigh areas.', 'Avoid tender, bruised, red, or hardened skin.', 'Epitalon 10 mg vial PeptideDosages protocol', 20),
  ('5-amino-1mq', 'abdomen', true, 'Rotate sites daily and stay at least 2 inches from the navel.', 'Avoid bruised, red, hard, scarred, or irritated skin.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 10),
  ('5-amino-1mq', 'thigh', true, 'Rotate between abdomen and outer thigh areas.', 'Avoid tender, bruised, red, or hardened skin.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 20),
  ('mots-c', 'abdomen', true, 'Rotate sites daily and stay at least 2 inches from the navel.', 'Avoid bruised, red, hard, scarred, or irritated skin.', 'MOTS-c 20 mg vial PeptideDosages protocol', 10),
  ('mots-c', 'thigh', true, 'Rotate between abdomen and outer thigh areas.', 'Avoid tender, bruised, red, or hardened skin.', 'MOTS-c 20 mg vial PeptideDosages protocol', 20),
  ('nad-plus', 'abdomen', true, 'Rotate sites daily and stay at least 2 inches from the navel.', 'Avoid bruised, red, hard, scarred, or irritated skin.', 'NAD+ 500 mg vial PeptideDosages protocol', 10),
  ('nad-plus', 'thigh', true, 'Rotate between abdomen and outer thigh areas.', 'Avoid tender, bruised, red, or hardened skin.', 'NAD+ 500 mg vial PeptideDosages protocol', 20),
  ('ss-31', 'abdomen', true, 'For Forzinity, rotate daily and use abdomen at least 2 inches from the navel; editorial SS-31 protocol also describes site rotation.', 'Do not inject where skin is tender, bruised, red, hard, scarred, or stretch-marked.', 'Forzinity prescribing information', 10),
  ('ss-31', 'thigh', true, 'For Forzinity, outer thigh is an approved site; rotate injection site daily.', 'Avoid tender, bruised, red, hard, scarred, or stretch-marked skin.', 'Forzinity prescribing information', 20)
) as v(slug, site, preferred, rotation_guidance, avoid_notes, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_injection_sites inj
  where inj.drug_id = p.id and inj.site = v.site
);

insert into public.drug_injection_guide (drug_id, step_type, formulation, ordinal, title, body)
select p.id, v.step_type, 'lyophilized', v.ordinal, v.title, v.body
from public.peptides p
join (values
  ('epitalon', 'supply', 10, 'Research vial and diluent', 'Use the vial size and bacteriostatic water volume described by the applicable research protocol or compounder.'),
  ('epitalon', 'step', 20, 'Reconstitute gently', 'Add diluent slowly down the vial wall, gently swirl or roll until dissolved, and label with date and concentration.'),
  ('epitalon', 'warning', 30, 'Research protocol limitation', 'This injection guide supports structured API display only and is not a prescribing protocol.'),
  ('5-amino-1mq', 'supply', 10, 'Research vial and diluent', 'Use the vial size and bacteriostatic water volume described by the applicable research protocol or compounder.'),
  ('5-amino-1mq', 'step', 20, 'Reconstitute gently', 'Allow the vial to reach room temperature, add diluent slowly down the vial wall, gently swirl or roll until clear, and label with date and concentration.'),
  ('5-amino-1mq', 'warning', 30, 'Research protocol limitation', 'This injection guide supports structured API display only and is not a prescribing protocol.'),
  ('mots-c', 'supply', 10, 'Research vial and diluent', 'Use the vial size and bacteriostatic water volume described by the applicable research protocol or compounder.'),
  ('mots-c', 'step', 20, 'Reconstitute gently', 'Add diluent slowly down the vial wall, gently swirl or roll until dissolved, label with date, protect from light, and refrigerate.'),
  ('mots-c', 'warning', 30, 'Research protocol limitation', 'MOTS-c has no approved human therapeutic dosing label in this catalogue entry.'),
  ('nad-plus', 'supply', 10, 'Research or compounded vial and diluent', 'Use the vial size and bacteriostatic water volume described by the applicable protocol or compounder. NAD+ solution should be inspected for clarity.'),
  ('nad-plus', 'step', 20, 'Protect from light', 'After reconstitution, label with date and concentration, refrigerate, protect from light, and discard if cloudy, discolored, or particulate.'),
  ('nad-plus', 'warning', 30, 'Compounded protocol limitation', 'This guide is not an approved subcutaneous NAD+ product label.'),
  ('ss-31', 'supply', 10, 'Research vial or approved Forzinity product', 'Do not interchange the editorial 10 mg lyophilized SS-31 vial instructions with the FDA-approved Forzinity ready-to-use vial label.'),
  ('ss-31', 'step', 20, 'Follow the applicable product instructions', 'For approved Forzinity use, follow the FDA label and prescriber training. For a research vial, use the applicable research protocol.'),
  ('ss-31', 'warning', 30, 'Label distinction', 'Forzinity label dosing, storage, and safety instructions supersede editorial research-vial protocol pages when the approved product is used.')
) as v(slug, step_type, ordinal, title, body)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_injection_guide g
  where g.drug_id = p.id and g.title = v.title
);

-- 10. Side-effect thresholds and red-flag companion rules

insert into public.drug_side_effect_thresholds (
  drug_id, side_effect_id, effect, threshold, action, action_label, source_id, ordinal
)
select p.id, null::uuid, v.effect, v.threshold, v.action, v.action_label, s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'Unexpected adverse effect', 'Any systemic reaction, severe injection-site reaction, breathing symptom, swelling, or severe dizziness after an unapproved injectable product.', 'contact_prescriber', 'Stop use and contact a clinician; urgent care for breathing symptoms, swelling, or severe systemic reactions.', 'Epitalon 10 mg vial PeptideDosages protocol', 10),
  ('5-amino-1mq', 'Unexpected adverse effect', 'Any systemic reaction, severe headache, chest symptom, severe jitteriness, breathing symptom, swelling, or severe injection-site reaction.', 'contact_prescriber', 'Stop use and contact a clinician; urgent care for severe systemic symptoms.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 10),
  ('mots-c', 'Unexpected adverse effect', 'Any systemic reaction, severe injection-site reaction, breathing symptom, swelling, or severe dizziness after an unapproved injectable product.', 'contact_prescriber', 'Stop use and contact a clinician; urgent care for breathing symptoms, swelling, or severe systemic reactions.', 'MOTS-c 20 mg vial PeptideDosages protocol', 10),
  ('nad-plus', 'Unexpected adverse effect', 'Severe anxiety, insomnia, fatigue, chest symptoms, fainting, allergic symptoms, or severe injection-site reaction after subcutaneous NAD+.', 'contact_prescriber', 'Stop use and contact a clinician; urgent care for chest symptoms, fainting, breathing symptoms, or swelling.', 'NAD+ 500 mg vial PeptideDosages protocol', 10),
  ('ss-31', 'Injection-site reaction', 'Severe, persistent, spreading, or infected-appearing injection-site reaction.', 'contact_prescriber', 'Contact the prescriber; urgent care if systemic allergic symptoms occur.', 'Forzinity prescribing information', 10),
  ('ss-31', 'Hypersensitivity', 'Breathing difficulty, swelling, widespread rash, or serious allergic symptoms.', 'urgent_care', 'Seek urgent medical care and do not rechallenge without medical direction.', 'Forzinity prescribing information', 20)
) as v(slug, effect, threshold, action, action_label, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_side_effect_thresholds t
  where t.drug_id = p.id and t.effect = v.effect and t.threshold = v.threshold
);

insert into public.drug_red_flag_rules (
  drug_id, symptom, action_level, display_copy, related_risks, source_id, ordinal
)
select p.id, v.symptom, v.action_level, v.display_copy, v.related_risks, s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'Unexpected systemic reaction', 'urgent_care', 'Seek urgent care for breathing symptoms, swelling, severe dizziness, or a rapidly worsening reaction after an unapproved injectable product.', array['hypersensitivity','product quality uncertainty'], 'Epitalon 10 mg vial PeptideDosages protocol', 10),
  ('5-amino-1mq', 'Unexpected systemic reaction', 'urgent_care', 'Seek urgent care for breathing symptoms, swelling, chest symptoms, severe dizziness, or rapidly worsening reaction after 5-Amino-1MQ.', array['hypersensitivity','unknown human safety profile'], '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 10),
  ('mots-c', 'Unexpected systemic reaction', 'urgent_care', 'Seek urgent care for breathing symptoms, swelling, severe dizziness, or rapidly worsening reaction after MOTS-c.', array['hypersensitivity','unknown human safety profile'], 'MOTS-c 20 mg vial PeptideDosages protocol', 10),
  ('nad-plus', 'Severe systemic symptoms', 'urgent_care', 'Seek urgent care for chest symptoms, fainting, breathing symptoms, swelling, or severe allergic symptoms after injectable NAD+.', array['hypersensitivity','compounded product risk'], 'NAD+ 500 mg vial PeptideDosages protocol', 10),
  ('ss-31', 'Hypersensitivity symptoms', 'urgent_care', 'Seek urgent care for breathing difficulty, swelling, widespread rash, or serious allergic symptoms during elamipretide exposure.', array['hypersensitivity'], 'Forzinity prescribing information', 10)
) as v(slug, symptom, action_level, display_copy, related_risks, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_red_flag_rules r
  where r.drug_id = p.id and r.symptom = v.symptom
);

-- 11. Check-in protocol and generic food/context rules

insert into public.drug_checkin_protocol (drug_id, cadence, notes, source_id)
select p.id, v.cadence, v.notes, s.id
from public.peptides p
join (values
  ('epitalon', 'daily', 'Daily check-ins align with the editorial short-cycle daily injection reference; no approved monitoring protocol exists.', 'Epitalon 10 mg vial PeptideDosages protocol'),
  ('5-amino-1mq', 'daily', 'Daily check-ins align with the editorial daily or BID injection reference; no approved monitoring protocol exists.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol'),
  ('mots-c', 'daily', 'Daily check-ins align with the editorial daily titration reference; no approved monitoring protocol exists.', 'MOTS-c 20 mg vial PeptideDosages protocol'),
  ('nad-plus', 'daily', 'Daily check-ins align with the editorial daily subcutaneous NAD+ reference; no approved monitoring protocol exists.', 'NAD+ 500 mg vial PeptideDosages protocol'),
  ('ss-31', 'daily', 'Daily check-ins align with approved Forzinity daily dosing and the separate editorial SS-31 daily reference.', 'Forzinity prescribing information')
) as v(slug, cadence, notes, source_label)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
on conflict (drug_id) do nothing;

insert into public.drug_checkin_questions (
  protocol_id, question_id, label, type, unit, condition, trigger_guidance_from_score, ordinal
)
select cp.id, v.question_id, v.label, v.type, v.unit, v.condition, v.trigger, v.ordinal
from public.drug_checkin_protocol cp
join public.peptides p on p.id = cp.drug_id
join (values
  ('injection_site_reaction', 'Injection-site reaction', 'scale_0_10', null, null, 7::numeric, 10),
  ('energy_0_10', 'Energy', 'scale_0_10', null, null, null::numeric, 20),
  ('sleep_0_10', 'Sleep quality', 'scale_0_10', null, null, null::numeric, 30),
  ('unexpected_symptoms', 'Unexpected symptoms', 'text', null, null, null::numeric, 40)
) as v(question_id, label, type, unit, condition, trigger, ordinal)
  on true
where p.slug in ('epitalon','5-amino-1mq','mots-c','nad-plus','ss-31')
  and not exists (
    select 1 from public.drug_checkin_questions q
    where q.protocol_id = cp.id and q.question_id = v.question_id
  );

insert into public.drug_food_tolerance_rules (
  drug_id, context, prefer, "limit", avoid, rationale, source_id, ordinal
)
select p.id, v.context, v.prefer, v.lim, v.avoid, v.rationale, s.id, v.ordinal
from public.peptides p
join (values
  ('epitalon', 'dose_escalation_week', array['consistent sleep schedule','adequate hydration'], array['alcohol near bedtime'], array['unsupported protocol stacking'], 'The editorial protocol frames Epitalon around sleep/circadian timing; this is contextual lifestyle copy, not prescribing guidance.', 'Epitalon 10 mg vial PeptideDosages protocol', 10),
  ('5-amino-1mq', 'dose_escalation_week', array['protein-forward meals','steady hydration'], array['excess stimulants'], array['unsupported protocol stacking'], 'The source discusses metabolic research context; nutrition copy should stay general and non-prescriptive.', '5-Amino-1MQ 10 mg vial PeptideDosages protocol', 10),
  ('mots-c', 'dose_escalation_week', array['consistent meals','steady hydration'], array['large alcohol intake'], array['unsupported protocol stacking'], 'The source discusses metabolic research context; nutrition copy should stay general and non-prescriptive.', 'MOTS-c 20 mg vial PeptideDosages protocol', 10),
  ('nad-plus', 'dose_escalation_week', array['morning routine if sleep disruption occurs','steady hydration'], array['late-day dosing if it disrupts sleep'], array['unsupported protocol stacking'], 'The source notes tolerability concerns such as insomnia, anxiety, or fatigue at higher starting doses.', 'NAD+ 500 mg vial PeptideDosages protocol', 10),
  ('ss-31', 'dose_escalation_week', array['site rotation','steady hydration'], array['reusing injection sites'], array['confusing research-vial instructions with Forzinity labeling'], 'The approved Forzinity label and editorial SS-31 vial protocol both emphasize subcutaneous administration and site considerations.', 'Forzinity prescribing information', 10)
) as v(slug, context, prefer, lim, avoid, rationale, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_food_tolerance_rules r
  where r.drug_id = p.id and r.context = v.context
);
