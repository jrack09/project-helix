-- ============================================================
-- 20260427091200_drug_api_enrichment_all_profiles.sql
-- ============================================================
-- Seeds the structured public drug API enrichment layer for the
-- current catalogue. The schema already exists in 0022; this
-- migration fills the API arrays for sources, warnings, missed
-- dose rules, indication status, dose phases, storage, side-effect
-- thresholds, and side-effect coping tips.
-- ============================================================

-- -- 1. Source citations ---------------------------------------

insert into public.drug_sources (
  drug_id, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal
)
select p.id, v.source_type, v.label, v.url, v.region, v.authority, v.citation_text, v.retrieved_at::date, v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic', 'prescribing_information', 'Ozempic prescribing information', 'https://www.novo-pi.com/ozempic.pdf', 'US', 'FDA', 'Novo Nordisk. Ozempic (semaglutide) prescribing information.', '2026-04-27', 1),
  ('semaglutide-ozempic', 'regulator', 'Ozempic product information', 'https://www.tga.gov.au/resources/artg/248800', 'AU', 'TGA', 'Therapeutic Goods Administration product information for Ozempic.', '2026-04-27', 2),
  ('semaglutide-ozempic', 'study', 'SUSTAIN 6 trial', 'https://www.nejm.org/doi/full/10.1056/NEJMoa1607141', 'Global', 'NEJM', 'Marso SP et al. Semaglutide and cardiovascular outcomes in patients with type 2 diabetes. N Engl J Med. 2016.', '2026-04-27', 3),

  ('tirzepatide-zepbound', 'prescribing_information', 'Zepbound prescribing information', 'https://pi.lilly.com/us/zepbound-uspi.pdf', 'US', 'FDA', 'Eli Lilly. Zepbound (tirzepatide) prescribing information.', '2026-04-27', 1),
  ('tirzepatide-zepbound', 'regulator', 'Zepbound FDA approval', 'https://www.fda.gov/news-events/press-announcements/fda-approves-new-medication-chronic-weight-management', 'US', 'FDA', 'FDA approval announcement for tirzepatide chronic weight management.', '2026-04-27', 2),
  ('tirzepatide-zepbound', 'study', 'SURMOUNT-1 trial', 'https://www.nejm.org/doi/full/10.1056/NEJMoa2206038', 'Global', 'NEJM', 'Jastreboff AM et al. Tirzepatide once weekly for the treatment of obesity. N Engl J Med. 2022.', '2026-04-27', 3),

  ('tirzepatide-mounjaro', 'prescribing_information', 'Mounjaro prescribing information', 'https://pi.lilly.com/us/mounjaro-uspi.pdf', 'US', 'FDA', 'Eli Lilly. Mounjaro (tirzepatide) prescribing information.', '2026-04-27', 1),
  ('tirzepatide-mounjaro', 'regulator', 'Mounjaro product information', 'https://www.tga.gov.au/resources/artg/394179', 'AU', 'TGA', 'Therapeutic Goods Administration product information for Mounjaro.', '2026-04-27', 2),
  ('tirzepatide-mounjaro', 'study', 'SURPASS-2 trial', 'https://www.nejm.org/doi/full/10.1056/NEJMoa2107519', 'Global', 'NEJM', 'Frías JP et al. Tirzepatide versus semaglutide once weekly in patients with type 2 diabetes. N Engl J Med. 2021.', '2026-04-27', 3),

  ('liraglutide-saxenda', 'prescribing_information', 'Saxenda prescribing information', 'https://www.novo-pi.com/saxenda.pdf', 'US', 'FDA', 'Novo Nordisk. Saxenda (liraglutide) prescribing information.', '2026-04-27', 1),
  ('liraglutide-saxenda', 'regulator', 'Saxenda product information', 'https://www.tga.gov.au/resources/artg/224717', 'AU', 'TGA', 'Therapeutic Goods Administration product information for Saxenda.', '2026-04-27', 2),
  ('liraglutide-saxenda', 'study', 'SCALE obesity trial', 'https://www.nejm.org/doi/full/10.1056/NEJMoa1411892', 'Global', 'NEJM', 'Pi-Sunyer X et al. A randomized, controlled trial of 3.0 mg of liraglutide in weight management. N Engl J Med. 2015.', '2026-04-27', 3),

  ('retatrutide', 'study', 'Retatrutide obesity Phase 2 trial', 'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972', 'Global', 'NEJM', 'Jastreboff AM et al. Triple-hormone-receptor agonist retatrutide for obesity. N Engl J Med. 2023.', '2026-04-27', 1),
  ('retatrutide', 'study', 'Retatrutide type 2 diabetes Phase 2 trial', 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)01053-X/fulltext', 'Global', 'Lancet', 'Rosenstock J et al. Retatrutide for people with type 2 diabetes. Lancet. 2023.', '2026-04-27', 2),
  ('retatrutide', 'editorial', 'Retatrutide 20 mg dosage protocol', 'https://peptidedosages.com/single-peptide-dosages/retatrutide-20-mg-vial-dosage-protocol/', 'Global', 'PeptideDosages', 'Editorial protocol page used as a manually reviewed structure checklist; not a prescribing label.', '2026-04-27', 3),

  ('cagrilintide', 'study', 'Cagrilintide Phase 2 dose-finding trial', 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(21)00845-7/fulltext', 'Global', 'Lancet', 'Enebo LB et al. Safety, tolerability, pharmacokinetics, and pharmacodynamics of cagrilintide in people with overweight or obesity. Lancet. 2021.', '2026-04-27', 1),
  ('cagrilintide', 'study', 'CagriSema Phase 2 trial', 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(23)01163-7/fulltext', 'Global', 'Lancet', 'Frias JP et al. Cagrilintide plus semaglutide in type 2 diabetes. Lancet. 2023.', '2026-04-27', 2),

  ('mazdutide', 'study', 'Mazdutide type 2 diabetes Phase 2 trial', 'https://www.thelancet.com/journals/landia/article/PIIS2213-8587(23)00225-X/fulltext', 'Global', 'Lancet Diabetes Endocrinol', 'Ji L et al. Mazdutide in Chinese adults with type 2 diabetes. Lancet Diabetes Endocrinol. 2023.', '2026-04-27', 1),
  ('mazdutide', 'regulator', 'Mazdutide China regulatory context', 'https://www.innoventbio.com/media/press-release', 'China', 'Innovent', 'Innovent Biologics public updates on mazdutide clinical development and regional status.', '2026-04-27', 2),

  ('bpc-157', 'study', 'BPC-157 preclinical systematic review', 'https://www.frontiersin.org/articles/10.3389/fphar.2021.671694/full', 'Global', 'Frontiers in Pharmacology', 'Gwyer D et al. BPC 157 and standard of care in tendon healing: systematic review of preclinical evidence.', '2026-04-27', 1),
  ('bpc-157', 'regulator', 'FDA warning on compounding BPC-157', 'https://www.fda.gov/drugs/human-drug-compounding/category-2-bulk-drug-substances-nominated-under-section-503a-fdc-act', 'US', 'FDA', 'FDA category 2 bulk drug substance listing includes BPC-157 concerns for compounding.', '2026-04-27', 2),

  ('aod-9604', 'regulator', 'TGA AOD-9604 scheduling and food context', 'https://www.tga.gov.au/', 'AU', 'TGA', 'Australian regulator context for AOD-9604 classification and non-approved status.', '2026-04-27', 1),
  ('aod-9604', 'study', 'AOD-9604 early obesity development context', 'https://pubmed.ncbi.nlm.nih.gov/', 'Global', 'PubMed', 'Early human obesity development programme for hGH fragment 176-191; no approved Phase 3 outcome.', '2026-04-27', 2)
) as v(slug, source_type, label, url, region, authority, citation_text, retrieved_at, ordinal)
  on p.slug = v.slug
where not exists (
  select 1 from public.drug_sources s
  where s.drug_id = p.id and s.label = v.label
);

-- -- 2. Structured warnings ------------------------------------

insert into public.drug_warnings (drug_id, severity, title, body, source_id, ordinal)
select p.id, v.severity, v.title, v.body, s.id, v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic', 'boxed_warning', 'Thyroid C-cell tumour warning', 'Do not use Ozempic with a personal or family history of medullary thyroid carcinoma or multiple endocrine neoplasia syndrome type 2.', 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic', 'urgent', 'Severe abdominal pain', 'Seek urgent medical advice for severe or persistent abdominal pain, especially with vomiting or pain radiating to the back.', 'Ozempic prescribing information', 2),
  ('semaglutide-ozempic', 'caution', 'Diabetic retinopathy monitoring', 'Rapid improvement in glucose can transiently worsen diabetic retinopathy. People with existing retinopathy need prescriber-led monitoring.', 'Ozempic prescribing information', 3),

  ('tirzepatide-zepbound', 'boxed_warning', 'Thyroid C-cell tumour warning', 'Do not use Zepbound with a personal or family history of medullary thyroid carcinoma or MEN2.', 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'urgent', 'Pancreatitis or gallbladder symptoms', 'Seek urgent medical advice for severe persistent abdominal pain, pain radiating to the back, fever, jaundice, or repeated vomiting.', 'Zepbound prescribing information', 2),
  ('tirzepatide-zepbound', 'caution', 'Pregnancy planning', 'Weight-management tirzepatide is not recommended during pregnancy. Discuss stopping before planned pregnancy with the prescriber.', 'Zepbound prescribing information', 3),

  ('tirzepatide-mounjaro', 'boxed_warning', 'Thyroid C-cell tumour warning', 'Do not use Mounjaro with a personal or family history of medullary thyroid carcinoma or MEN2.', 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro', 'urgent', 'Hypoglycaemia with insulin or sulfonylureas', 'Combination with insulin or sulfonylureas can cause clinically significant hypoglycaemia; dose adjustment and glucose monitoring may be needed.', 'Mounjaro prescribing information', 2),
  ('tirzepatide-mounjaro', 'caution', 'Oral contraceptive absorption', 'Delayed gastric emptying can reduce oral contraceptive exposure around initiation and dose escalation. Discuss backup contraception.', 'Mounjaro prescribing information', 3),

  ('liraglutide-saxenda', 'boxed_warning', 'Thyroid C-cell tumour warning', 'Do not use Saxenda with a personal or family history of medullary thyroid carcinoma or MEN2.', 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda', 'urgent', 'Pancreatitis symptoms', 'Stop and seek urgent assessment for severe persistent abdominal pain, especially with vomiting or pain radiating to the back.', 'Saxenda prescribing information', 2),
  ('liraglutide-saxenda', 'caution', 'Mood or suicidal thoughts', 'Report new or worsening depression, suicidal thoughts, or unusual mood changes promptly.', 'Saxenda prescribing information', 3),

  ('retatrutide', 'info', 'Investigational medicine', 'Retatrutide is not approved by major regulators. Dosing and monitoring in published data come from clinical trial protocols, not a prescribing label.', 'Retatrutide obesity Phase 2 trial', 1),
  ('retatrutide', 'caution', 'Prescriber-led titration only', 'The 2-12 mg weekly schedules are trial references. Do not self-escalate or skip escalation steps without prescriber or trial-site direction.', 'Retatrutide 20 mg dosage protocol', 2),
  ('retatrutide', 'urgent', 'Severe or persistent GI symptoms', 'Repeated vomiting, dehydration, or severe persistent abdominal pain needs urgent medical assessment.', 'Retatrutide obesity Phase 2 trial', 3),

  ('cagrilintide', 'info', 'Investigational medicine', 'Cagrilintide is not broadly approved as a standalone medicine. Dose and eligibility depend on trial protocol.', 'Cagrilintide Phase 2 dose-finding trial', 1),
  ('cagrilintide', 'caution', 'Combination GI burden', 'Cagrilintide plus semaglutide can increase gastrointestinal adverse events compared with either pathway alone.', 'CagriSema Phase 2 trial', 2),

  ('mazdutide', 'info', 'Regional investigational status', 'Mazdutide has regional development and approval context that differs by country. Outside approved regions, dosing should be treated as trial-protocol-specific.', 'Mazdutide China regulatory context', 1),
  ('mazdutide', 'urgent', 'Severe abdominal pain or dehydration', 'GLP-1/glucagon agonist trial data include gastrointestinal effects. Severe abdominal pain, repeated vomiting, or dehydration warrants urgent assessment.', 'Mazdutide type 2 diabetes Phase 2 trial', 2),

  ('bpc-157', 'urgent', 'Not approved for human therapeutic use', 'BPC-157 has no approved human dosing, safety label, or standardised product quality. Any human use outside a regulated trial is unapproved.', 'FDA warning on compounding BPC-157', 1),
  ('bpc-157', 'caution', 'Preclinical evidence ceiling', 'Most evidence is animal or cell-model data. Benefits and harms in humans cannot be inferred from those models.', 'BPC-157 preclinical systematic review', 2),

  ('aod-9604', 'urgent', 'Not an approved medicine', 'AOD-9604 is not approved for weight management or therapeutic use. No regulator-approved dosing or monitoring standard exists.', 'TGA AOD-9604 scheduling and food context', 1),
  ('aod-9604', 'caution', 'Development programme did not reach approval', 'Early obesity development did not produce a licensed medicine. Treat online dosing claims as unvalidated.', 'AOD-9604 early obesity development context', 2)
) as v(slug, severity, title, body, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_warnings w
  where w.drug_id = p.id and w.title = v.title
);

-- -- 3. Indication and regulatory status -----------------------

insert into public.drug_approved_indications (drug_id, region, authority, approval_status, indication, population, source_id, ordinal)
select p.id, v.region, v.authority, v.approval_status, v.indication, v.population, s.id, v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic', 'US', 'FDA', 'approved', 'Glycaemic control in adults with type 2 diabetes and cardiovascular risk reduction in selected adults with type 2 diabetes.', 'Adults with type 2 diabetes according to label criteria.', 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic', 'AU', 'TGA', 'approved', 'Treatment of adults with insufficiently controlled type 2 diabetes as an adjunct to diet and exercise.', 'Adults with type 2 diabetes according to product information.', 'Ozempic product information', 2),
  ('semaglutide-ozempic', 'Global', null, 'off_label', 'Weight management use outside diabetes indication varies by jurisdiction and prescriber judgement.', 'Not the primary Ozempic label indication.', 'Ozempic prescribing information', 3),

  ('tirzepatide-zepbound', 'US', 'FDA', 'approved', 'Chronic weight management as an adjunct to reduced-calorie diet and increased physical activity.', 'Adults with obesity or overweight with weight-related comorbidity per label.', 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'Global', null, 'approved', 'Weight-management approval status varies by region and brand availability.', 'Adults meeting local product information criteria.', 'Zepbound FDA approval', 2),

  ('tirzepatide-mounjaro', 'US', 'FDA', 'approved', 'Improve glycaemic control in adults with type 2 diabetes as an adjunct to diet and exercise.', 'Adults with type 2 diabetes.', 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro', 'AU', 'TGA', 'approved', 'Treatment of adults with insufficiently controlled type 2 diabetes as an adjunct to diet and exercise.', 'Adults with type 2 diabetes according to product information.', 'Mounjaro product information', 2),

  ('liraglutide-saxenda', 'US', 'FDA', 'approved', 'Chronic weight management as an adjunct to reduced-calorie diet and increased physical activity.', 'Adults and selected adolescents meeting label criteria.', 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda', 'AU', 'TGA', 'approved', 'Weight management in adults meeting product-information eligibility criteria.', 'Adults according to Australian product information.', 'Saxenda product information', 2),

  ('retatrutide', 'Global', null, 'investigational', 'Obesity, type 2 diabetes, and metabolic disease indications remain under clinical investigation.', 'Clinical trial participants only; no approved prescribing population.', 'Retatrutide obesity Phase 2 trial', 1),
  ('cagrilintide', 'Global', null, 'investigational', 'Weight management and CagriSema combination use remain under clinical investigation.', 'Clinical trial participants only; no standalone approved prescribing population.', 'Cagrilintide Phase 2 dose-finding trial', 1),
  ('mazdutide', 'China', 'NMPA', 'approved', 'Regional status for chronic weight management/metabolic indications depends on current Chinese product approvals.', 'Adults meeting local approval criteria where applicable.', 'Mazdutide China regulatory context', 1),
  ('mazdutide', 'Global', null, 'investigational', 'Outside approved regions, mazdutide remains investigational.', 'Clinical trial participants only outside approved regions.', 'Mazdutide type 2 diabetes Phase 2 trial', 2),
  ('bpc-157', 'Global', null, 'not_approved', 'No approved therapeutic indication.', 'No approved human prescribing population.', 'FDA warning on compounding BPC-157', 1),
  ('aod-9604', 'Global', null, 'not_approved', 'No approved therapeutic indication.', 'No approved human prescribing population.', 'TGA AOD-9604 scheduling and food context', 1)
) as v(slug, region, authority, approval_status, indication, population, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_approved_indications i
  where i.drug_id = p.id and i.region = v.region and i.indication = v.indication
);

-- -- 4. Missed-dose rules --------------------------------------

insert into public.drug_missed_dose_rules (drug_id, formulation, max_delay_hours, instruction, restart_guidance, source_id, ordinal)
select p.id, v.formulation, v.max_delay_hours, v.instruction, v.restart_guidance, s.id, v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic', 'multi-dose pen', 120, 'If a weekly Ozempic dose is missed and it has been 5 days or less, take it as soon as possible.', 'Resume the regular weekly schedule after the missed dose is handled.', 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic', 'multi-dose pen', null, 'If more than 5 days have passed, skip the missed dose.', 'Do not take two doses close together; resume on the next scheduled day.', 'Ozempic prescribing information', 2),

  ('tirzepatide-zepbound', 'single-dose pen', 96, 'If a weekly Zepbound dose is missed and it has been 4 days or less, take it as soon as possible.', 'Resume once-weekly dosing on the regular scheduled day.', 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'single-dose pen', null, 'If more than 4 days have passed, skip the missed dose.', 'Do not use two doses within 3 days of each other.', 'Zepbound prescribing information', 2),
  ('tirzepatide-mounjaro', 'single-dose pen', 96, 'If a weekly Mounjaro dose is missed and it has been 4 days or less, take it as soon as possible.', 'Resume once-weekly dosing on the regular scheduled day.', 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro', 'single-dose pen', null, 'If more than 4 days have passed, skip the missed dose.', 'Do not use two doses within 3 days of each other.', 'Mounjaro prescribing information', 2),

  ('liraglutide-saxenda', 'multi-dose pen', 24, 'If a daily Saxenda dose is missed, skip it and take the next dose the following day.', 'Do not take an extra dose or increase the next dose to make up for the missed dose.', 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda', 'multi-dose pen', null, 'If Saxenda has been missed for more than 3 days, contact the prescriber before restarting.', 'Restarting at a lower dose may be needed to reduce gastrointestinal side effects.', 'Saxenda prescribing information', 2),

  ('retatrutide', 'lyophilized vial', null, 'No approved label missed-dose rule exists for retatrutide.', 'Follow the trial site, prescriber, or dispensing pharmacy instructions; do not double-dose.', 'Retatrutide obesity Phase 2 trial', 1),
  ('cagrilintide', 'investigational injection', null, 'No approved standalone missed-dose rule exists for cagrilintide.', 'Follow trial-site instructions and do not self-adjust the schedule.', 'Cagrilintide Phase 2 dose-finding trial', 1),
  ('mazdutide', 'investigational injection', null, 'Missed-dose rules depend on local label or trial protocol.', 'Contact the prescriber or trial site before restarting after missed doses.', 'Mazdutide China regulatory context', 1),
  ('bpc-157', 'research peptide', null, 'No regulator-approved missed-dose rule exists for BPC-157.', 'There is no validated human dosing schedule to resume; discuss any use with a clinician.', 'FDA warning on compounding BPC-157', 1),
  ('aod-9604', 'research peptide', null, 'No regulator-approved missed-dose rule exists for AOD-9604.', 'There is no validated human dosing schedule to resume; discuss any use with a clinician.', 'TGA AOD-9604 scheduling and food context', 1)
) as v(slug, formulation, max_delay_hours, instruction, restart_guidance, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_missed_dose_rules r
  where r.drug_id = p.id and r.instruction = v.instruction
);

-- -- 5. Dose escalation phases ---------------------------------

insert into public.drug_dose_escalation_phases (
  drug_id, protocol_label, phase_label, start_week, end_week, dose_amount, dose_unit,
  frequency, route, phase_purpose, hold_or_reduce_guidance, source_id, ordinal
)
select p.id, v.protocol_label, v.phase_label, v.start_week, v.end_week, v.dose_amount, v.dose_unit,
  v.frequency, v.route, v.phase_purpose, v.hold_or_reduce_guidance, s.id, v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic', 'Standard Ozempic escalation', 'Weeks 1-4', 1, 4, 0.25::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Initiation dose for tolerability.', 'Escalate only under prescriber guidance.', 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic', 'Standard Ozempic escalation', 'Week 5 onward', 5, null, 0.5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'First therapeutic maintenance dose.', 'Prescriber may increase after at least 4 weeks if additional glycaemic control is needed.', 'Ozempic prescribing information', 2),
  ('semaglutide-ozempic', 'Standard Ozempic escalation', 'Optional 1 mg', 9, null, 1::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Dose increase for additional glycaemic control.', 'Increase only if tolerated and prescribed.', 'Ozempic prescribing information', 3),
  ('semaglutide-ozempic', 'Standard Ozempic escalation', 'Optional 2 mg', 13, null, 2::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Maximum labelled Ozempic dose in some regions.', 'Use only when prescribed and available in the local product information.', 'Ozempic prescribing information', 4),

  ('tirzepatide-zepbound', 'Standard Zepbound escalation', 'Weeks 1-4', 1, 4, 2.5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Tolerability initiation dose.', 'Do not skip the initiation step.', 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'Standard Zepbound escalation', 'Weeks 5-8', 5, 8, 5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'First labelled treatment dose.', 'Hold longer if tolerability requires, under prescriber guidance.', 'Zepbound prescribing information', 2),
  ('tirzepatide-zepbound', 'Standard Zepbound escalation', 'Weeks 9-12', 9, 12, 7.5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Intermediate escalation step.', 'Escalate in 2.5 mg increments no faster than every 4 weeks.', 'Zepbound prescribing information', 3),
  ('tirzepatide-zepbound', 'Standard Zepbound escalation', 'Weeks 13-16', 13, 16, 10::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Maintenance option.', 'Prescriber may maintain at this dose if effective and tolerated.', 'Zepbound prescribing information', 4),
  ('tirzepatide-zepbound', 'Standard Zepbound escalation', 'Weeks 17-20', 17, 20, 12.5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Intermediate escalation step before 15 mg.', 'Escalate only if additional response is needed and tolerated.', 'Zepbound prescribing information', 5),
  ('tirzepatide-zepbound', 'Standard Zepbound escalation', 'Week 21 onward', 21, null, 15::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Highest labelled maintenance option.', 'Dose may be lower if response and tolerability support it.', 'Zepbound prescribing information', 6),

  ('tirzepatide-mounjaro', 'Standard Mounjaro escalation', 'Weeks 1-4', 1, 4, 2.5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Tolerability initiation dose.', 'Not intended as the glycaemic maintenance dose.', 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro', 'Standard Mounjaro escalation', 'Weeks 5-8', 5, 8, 5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'First therapeutic dose.', 'Escalate only if additional glycaemic control is needed.', 'Mounjaro prescribing information', 2),
  ('tirzepatide-mounjaro', 'Standard Mounjaro escalation', 'Weeks 9-12', 9, 12, 7.5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Intermediate escalation option.', 'Increase in 2.5 mg increments at no less than 4-week intervals.', 'Mounjaro prescribing information', 3),
  ('tirzepatide-mounjaro', 'Standard Mounjaro escalation', 'Weeks 13-16', 13, 16, 10::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Maintenance option.', 'Hold or reduce only under prescriber guidance.', 'Mounjaro prescribing information', 4),
  ('tirzepatide-mounjaro', 'Standard Mounjaro escalation', 'Weeks 17-20', 17, 20, 12.5::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Intermediate escalation option.', 'Escalate only if needed and tolerated.', 'Mounjaro prescribing information', 5),
  ('tirzepatide-mounjaro', 'Standard Mounjaro escalation', 'Week 21 onward', 21, null, 15::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Maximum labelled dose.', 'Lower maintenance doses may be appropriate when targets are met.', 'Mounjaro prescribing information', 6),

  ('liraglutide-saxenda', 'Standard Saxenda escalation', 'Week 1', 1, 1, 0.6::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Initiation dose for tolerability.', 'Do not start at the target dose.', 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda', 'Standard Saxenda escalation', 'Week 2', 2, 2, 1.2::numeric, 'mg', 'once daily', 'subcutaneous injection', 'First escalation step.', 'Delay escalation if not tolerated, under prescriber guidance.', 'Saxenda prescribing information', 2),
  ('liraglutide-saxenda', 'Standard Saxenda escalation', 'Week 3', 3, 3, 1.8::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Intermediate escalation step.', 'Assess GI tolerability before increasing.', 'Saxenda prescribing information', 3),
  ('liraglutide-saxenda', 'Standard Saxenda escalation', 'Week 4', 4, 4, 2.4::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Pre-maintenance step.', 'Hold if side effects limit escalation.', 'Saxenda prescribing information', 4),
  ('liraglutide-saxenda', 'Standard Saxenda escalation', 'Week 5 onward', 5, null, 3::numeric, 'mg', 'once daily', 'subcutaneous injection', 'Target maintenance dose.', 'Review response after 12 weeks on 3 mg.', 'Saxenda prescribing information', 5),

  ('retatrutide', 'Standard retatrutide Phase 2 reference', 'Weeks 1-4', 1, 4, 2::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Trial initiation and tolerability phase.', 'Investigational schedule; follow prescriber or trial protocol.', 'Retatrutide obesity Phase 2 trial', 1),
  ('retatrutide', 'Standard retatrutide Phase 2 reference', 'Weeks 5-8', 5, 8, 4::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'First escalation step.', 'Hold or adjust only under protocol guidance.', 'Retatrutide obesity Phase 2 trial', 2),
  ('retatrutide', 'Standard retatrutide Phase 2 reference', 'Weeks 9-12', 9, 12, 6::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Intermediate escalation step.', 'Do not self-escalate.', 'Retatrutide obesity Phase 2 trial', 3),
  ('retatrutide', 'Standard retatrutide Phase 2 reference', 'Week 13 onward', 13, null, 8::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Higher-dose trial reference.', 'Investigational; not an approved maintenance dose.', 'Retatrutide obesity Phase 2 trial', 4),
  ('retatrutide', 'Advanced retatrutide Phase 2 high-dose reference', 'Weeks 1-4', 1, 4, 2::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Trial initiation and tolerability phase.', 'Investigational schedule; follow prescriber or trial protocol.', 'Retatrutide 20 mg dosage protocol', 5),
  ('retatrutide', 'Advanced retatrutide Phase 2 high-dose reference', 'Weeks 5-8', 5, 8, 4::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'First escalation step.', 'Do not accelerate without protocol guidance.', 'Retatrutide 20 mg dosage protocol', 6),
  ('retatrutide', 'Advanced retatrutide Phase 2 high-dose reference', 'Weeks 9-12', 9, 12, 8::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Higher-dose escalation step.', 'Monitor GI tolerability closely.', 'Retatrutide 20 mg dosage protocol', 7),
  ('retatrutide', 'Advanced retatrutide Phase 2 high-dose reference', 'Week 13 onward', 13, null, 12::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Highest Phase 2 reference dose.', 'Investigational; not an approved maintenance dose.', 'Retatrutide obesity Phase 2 trial', 8),

  ('cagrilintide', 'Cagrilintide Phase 2 reference', 'Trial titration varies', 0, null, null::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Investigational amylin analogue; dose escalation differs across trials and combinations.', 'Follow the active trial protocol rather than a public protocol table.', 'Cagrilintide Phase 2 dose-finding trial', 1),
  ('mazdutide', 'Mazdutide Phase 2 reference', 'Trial titration varies', 0, null, null::numeric, 'mg', 'once weekly', 'subcutaneous injection', 'Investigational/regional GLP-1/glucagon agonist; trial schedules vary by indication and region.', 'Follow local label where approved or the active clinical trial protocol.', 'Mazdutide type 2 diabetes Phase 2 trial', 1),
  ('bpc-157', 'No approved human protocol', 'No approved dose', 0, null, null::numeric, null, null, null, 'No regulator-approved human dosing or escalation schedule exists.', 'Do not treat online dose tables as validated medical protocols.', 'FDA warning on compounding BPC-157', 1),
  ('aod-9604', 'No approved human protocol', 'No approved dose', 0, null, null::numeric, null, null, null, 'No regulator-approved human dosing or escalation schedule exists.', 'Do not treat online dose tables as validated medical protocols.', 'TGA AOD-9604 scheduling and food context', 1)
) as v(slug, protocol_label, phase_label, start_week, end_week, dose_amount, dose_unit, frequency, route, phase_purpose, hold_or_reduce_guidance, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_dose_escalation_phases d
  where d.drug_id = p.id and d.protocol_label = v.protocol_label and d.phase_label = v.phase_label
);

-- -- 6. Formulation-level storage ------------------------------

insert into public.drug_formulation_storage (
  drug_id, formulation, storage_state, temperature, protect_from_light, do_not_freeze,
  expiry_after_opening, expiry_after_reconstitution, handling_notes, source_id, ordinal
)
select p.id, v.formulation, v.storage_state, v.temperature, v.protect_from_light, v.do_not_freeze,
  v.expiry_after_opening, v.expiry_after_reconstitution, v.handling_notes, s.id, v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic', 'multi-dose pen', 'before first use', 'Refrigerate at 2-8 C', true, true, null, null, 'Keep capped and protected from light. Do not use if frozen, cloudy, discoloured, or particulate.', 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic', 'multi-dose pen', 'after first use', 'Below 30 C or refrigerated at 2-8 C', true, true, 'Use within 56 days after first use.', null, 'Remove the needle after each injection and replace the pen cap.', 'Ozempic prescribing information', 2),

  ('tirzepatide-zepbound', 'single-dose pen', 'before use', 'Refrigerate at 2-8 C', true, true, null, null, 'Store in the original carton. Do not use if frozen or if particles/discolouration are present.', 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'single-dose pen', 'room temperature allowance', 'Below 30 C', true, true, 'Use within 21 days if stored out of refrigeration.', null, 'Do not return to refrigeration after extended room-temperature storage if local instructions advise disposal.', 'Zepbound prescribing information', 2),
  ('tirzepatide-mounjaro', 'single-dose pen', 'before use', 'Refrigerate at 2-8 C', true, true, null, null, 'Store in the original carton. Do not use if frozen or damaged.', 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro', 'single-dose pen', 'room temperature allowance', 'Below 30 C', true, true, 'Use within 21 days if stored out of refrigeration.', null, 'Keep out of direct heat and light.', 'Mounjaro prescribing information', 2),

  ('liraglutide-saxenda', 'multi-dose pen', 'before first use', 'Refrigerate at 2-8 C', true, true, null, null, 'Keep capped and do not use if frozen, cloudy, or discoloured.', 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda', 'multi-dose pen', 'after first use', 'Below 30 C or refrigerated at 2-8 C', true, true, 'Use within 30 days after first use.', null, 'Remove the needle after each injection and replace the pen cap.', 'Saxenda prescribing information', 2),

  ('retatrutide', 'lyophilized vial', 'before reconstitution', '-20 C or colder where supplied as research/compounded lyophilized powder', true, false, null, null, 'Follow the dispensing pharmacy or trial-site instructions; allow vial to reach room temperature before reconstitution.', 'Retatrutide 20 mg dosage protocol', 1),
  ('retatrutide', 'reconstituted vial', 'after reconstitution', 'Refrigerate at 2-8 C', true, true, null, 'Use within 4 weeks unless the pharmacy or trial protocol gives a shorter window.', 'Maintain strict sterile technique and discard if cloudy, particulate, or discoloured.', 'Retatrutide 20 mg dosage protocol', 2),

  ('cagrilintide', 'investigational injection', 'trial supplied', 'Follow trial protocol', true, true, null, null, 'Storage requirements are protocol- and formulation-specific until an approved product label exists.', 'Cagrilintide Phase 2 dose-finding trial', 1),
  ('mazdutide', 'investigational injection', 'trial or regional product', 'Follow local label or trial protocol', true, true, null, null, 'Storage requirements vary by region and formulation.', 'Mazdutide China regulatory context', 1),
  ('bpc-157', 'research peptide', 'lyophilized/reconstituted research preparation', 'No approved standard', true, false, null, null, 'No licensed product standard exists; quality, sterility, and stability cannot be assumed for research chemicals.', 'FDA warning on compounding BPC-157', 1),
  ('aod-9604', 'research peptide', 'lyophilized/reconstituted research preparation', 'No approved standard', true, false, null, null, 'No licensed product standard exists; stability instructions from online suppliers are not regulator-approved.', 'TGA AOD-9604 scheduling and food context', 1)
) as v(slug, formulation, storage_state, temperature, protect_from_light, do_not_freeze, expiry_after_opening, expiry_after_reconstitution, handling_notes, source_label, ordinal)
  on p.slug = v.slug
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_formulation_storage fs
  where fs.drug_id = p.id and fs.formulation = v.formulation and fs.storage_state = v.storage_state
);

-- -- 7. Side-effect thresholds ---------------------------------

insert into public.drug_side_effect_thresholds (drug_id, side_effect_id, effect, threshold, action, action_label, source_id, ordinal)
select p.id, se.id, v.effect, v.threshold, v.action, v.action_label, s.id, v.ordinal
from public.peptides p
join (values
  ('semaglutide-ozempic', 'Nausea', 'Nausea that prevents normal eating or hydration, or persists beyond the escalation period.', 'contact_prescriber', 'Contact your prescriber; dose timing or escalation may need review.', 'Ozempic prescribing information', 1),
  ('semaglutide-ozempic', 'Vomiting', 'Repeated vomiting, vomiting lasting more than 24 hours, or inability to keep fluids down.', 'urgent_care', 'Seek medical advice promptly; urgent care if dehydration symptoms occur.', 'Ozempic prescribing information', 2),
  ('semaglutide-ozempic', 'Abdominal pain', 'Severe or persistent abdominal pain, especially with vomiting or pain radiating to the back.', 'urgent_care', 'Seek urgent assessment for pancreatitis or gallbladder disease.', 'Ozempic prescribing information', 3),
  ('semaglutide-ozempic', 'Hypoglycaemia symptoms', 'Shaking, sweating, confusion, fainting, or low glucose readings when also using insulin or sulfonylureas.', 'urgent_care', 'Treat low glucose according to your diabetes plan and seek help if severe or not improving.', 'Ozempic prescribing information', 4),

  ('tirzepatide-zepbound', 'Nausea', 'Nausea that is severe, persistent, or prevents adequate fluid intake.', 'contact_prescriber', 'Contact your prescriber before escalating further.', 'Zepbound prescribing information', 1),
  ('tirzepatide-zepbound', 'Vomiting', 'Repeated vomiting, vomiting with dizziness, or inability to keep fluids down.', 'urgent_care', 'Seek urgent assessment if dehydration symptoms occur.', 'Zepbound prescribing information', 2),
  ('tirzepatide-zepbound', 'Abdominal pain', 'Severe persistent abdominal pain, pain radiating to the back, fever, or jaundice.', 'urgent_care', 'Seek urgent assessment for pancreatitis or gallbladder disease.', 'Zepbound prescribing information', 3),

  ('tirzepatide-mounjaro', 'Hypoglycaemia symptoms', 'Shaking, sweating, confusion, fainting, or low glucose readings when used with insulin or sulfonylureas.', 'urgent_care', 'Treat low glucose and seek urgent help if severe or not improving.', 'Mounjaro prescribing information', 1),
  ('tirzepatide-mounjaro', 'Vomiting', 'Repeated vomiting or inability to keep fluids down.', 'urgent_care', 'Seek urgent assessment if dehydration symptoms occur.', 'Mounjaro prescribing information', 2),
  ('tirzepatide-mounjaro', 'Abdominal pain', 'Severe persistent abdominal pain, especially with vomiting or pain radiating to the back.', 'urgent_care', 'Seek urgent assessment.', 'Mounjaro prescribing information', 3),

  ('liraglutide-saxenda', 'Nausea', 'Nausea that remains severe after dose escalation or prevents normal meals/fluids.', 'contact_prescriber', 'Contact your prescriber before increasing the dose.', 'Saxenda prescribing information', 1),
  ('liraglutide-saxenda', 'Vomiting', 'Repeated vomiting, dehydration symptoms, or vomiting lasting more than 24 hours.', 'urgent_care', 'Seek medical advice promptly.', 'Saxenda prescribing information', 2),
  ('liraglutide-saxenda', 'Mood changes', 'New or worsening depression, suicidal thoughts, or unusual mood changes.', 'urgent_care', 'Contact a clinician urgently; emergency help if there is immediate risk.', 'Saxenda prescribing information', 3),

  ('retatrutide', 'Nausea', 'Nausea that prevents eating or hydration, or worsens after escalation.', 'contact_prescriber', 'Contact the prescriber or trial site before the next escalation.', 'Retatrutide obesity Phase 2 trial', 1),
  ('retatrutide', 'Vomiting', 'Repeated vomiting, dizziness, reduced urination, or inability to keep fluids down.', 'urgent_care', 'Seek urgent assessment for dehydration and dose review.', 'Retatrutide obesity Phase 2 trial', 2),
  ('retatrutide', 'Abdominal pain', 'Severe persistent abdominal pain, especially with vomiting or pain radiating to the back.', 'urgent_care', 'Seek urgent medical advice.', 'Retatrutide obesity Phase 2 trial', 3),

  ('cagrilintide', 'Nausea', 'Nausea that is severe, persistent, or worsens after combination escalation.', 'contact_prescriber', 'Contact the trial site or prescriber before escalating.', 'CagriSema Phase 2 trial', 1),
  ('cagrilintide', 'Vomiting', 'Repeated vomiting or inability to maintain hydration.', 'urgent_care', 'Seek medical advice promptly.', 'CagriSema Phase 2 trial', 2),

  ('mazdutide', 'Nausea', 'Nausea that prevents meals or hydration.', 'contact_prescriber', 'Contact the prescriber or trial site before escalating.', 'Mazdutide type 2 diabetes Phase 2 trial', 1),
  ('mazdutide', 'Vomiting', 'Repeated vomiting, dizziness, or inability to keep fluids down.', 'urgent_care', 'Seek urgent assessment for dehydration.', 'Mazdutide type 2 diabetes Phase 2 trial', 2),

  ('bpc-157', 'Unknown adverse effect', 'Any unexpected symptom after using an unapproved research peptide.', 'contact_prescriber', 'Stop use and disclose the product to a clinician, including vial/source details.', 'FDA warning on compounding BPC-157', 1),
  ('aod-9604', 'Unknown adverse effect', 'Any unexpected symptom after using an unapproved research peptide.', 'contact_prescriber', 'Stop use and disclose the product to a clinician, including vial/source details.', 'TGA AOD-9604 scheduling and food context', 1)
) as v(slug, effect, threshold, action, action_label, source_label, ordinal)
  on p.slug = v.slug
left join lateral (
  select id
  from public.side_effects
  where peptide_id = p.id and lower(effect) = lower(v.effect)
  order by created_at
  limit 1
) se on true
left join public.drug_sources s on s.drug_id = p.id and s.label = v.source_label
where not exists (
  select 1 from public.drug_side_effect_thresholds t
  where t.drug_id = p.id and t.effect = v.effect and t.threshold = v.threshold
);

-- -- 8. Side-effect coping tips --------------------------------

insert into public.drug_side_effect_tips (side_effect_id, strategy, when_to_seek_help, ordinal)
select se.id, v.strategy, v.when_to_seek_help, v.ordinal
from public.side_effects se
join public.peptides p on p.id = se.peptide_id
join (values
  ('Nausea', 'Eat smaller, slower meals; choose bland lower-fat foods during escalation; avoid lying down soon after eating.', 'Contact your prescriber if nausea is severe, persistent, or prevents eating and drinking.', 1),
  ('Diarrhoea', 'Prioritise fluids and electrolytes; avoid alcohol, greasy meals, and very high-sugar drinks until symptoms settle.', 'Seek help if diarrhoea is severe, bloody, accompanied by fever, or causes dehydration.', 2),
  ('Vomiting', 'Pause solid food briefly, sip fluids, and restart bland foods once settled; do not escalate dose while vomiting persists.', 'Seek urgent advice for repeated vomiting, dehydration, or inability to keep fluids down.', 3),
  ('Constipation', 'Increase fluids, fibre-rich foods, and gentle movement; consider pharmacist advice for a short-term stool softener if needed.', 'Contact a clinician for severe abdominal pain, no bowel movement for several days, or vomiting with constipation.', 4),
  ('Injection-site reaction', 'Rotate sites, let alcohol dry before injecting, and avoid bruised, scarred, or hardened skin.', 'Seek advice for spreading redness, warmth, pus, fever, or severe pain.', 5)
) as v(effect, strategy, when_to_seek_help, ordinal)
  on lower(se.effect) = lower(v.effect)
where p.slug in (
  'semaglutide-wegovy',
  'semaglutide-ozempic',
  'tirzepatide-zepbound',
  'tirzepatide-mounjaro',
  'liraglutide-saxenda',
  'retatrutide',
  'cagrilintide',
  'mazdutide'
)
and not exists (
  select 1 from public.drug_side_effect_tips tip
  where tip.side_effect_id = se.id and tip.strategy = v.strategy
);
