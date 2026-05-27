-- ============================================================
-- 0006_seed_glp1.sql — V1 drug seed data
-- ============================================================
-- Minimal baseline rows for GLP-1s + weight-management peptides.
-- All rows start as draft; editors complete companion content
-- via the CMS before publishing.
-- ============================================================

insert into public.peptides (
  slug, name, generic_name, brand_names, drug_class,
  administration_route, typical_dosing_schedule,
  prescription_required, short_description, status_label,
  publication_status, is_visible, aliases
) values
  (
    'semaglutide-wegovy',
    'Semaglutide (Wegovy)',
    'semaglutide',
    '["Wegovy"]',
    'GLP-1 receptor agonist',
    'subcutaneous_injection',
    'Weekly subcutaneous injection. Dose escalated over ~16–20 weeks per prescriber guidance.',
    true,
    'A GLP-1 receptor agonist prescribed for chronic weight management in adults.',
    'prescription',
    'draft',
    true,
    '["Wegovy"]'
  ),
  (
    'semaglutide-ozempic',
    'Semaglutide (Ozempic)',
    'semaglutide',
    '["Ozempic"]',
    'GLP-1 receptor agonist',
    'subcutaneous_injection',
    'Weekly subcutaneous injection. Dose titrated per prescriber guidance. Primarily indicated for type 2 diabetes.',
    true,
    'A GLP-1 receptor agonist primarily indicated for type 2 diabetes management, also prescribed off-label for weight management.',
    'prescription',
    'draft',
    true,
    '["Ozempic","Semaglutide OZM"]'
  ),
  (
    'tirzepatide-mounjaro',
    'Tirzepatide (Mounjaro)',
    'tirzepatide',
    '["Mounjaro"]',
    'GLP-1 / GIP dual receptor agonist',
    'subcutaneous_injection',
    'Weekly subcutaneous injection. Dose escalated over several months per prescriber guidance.',
    true,
    'A dual GLP-1 / GIP receptor agonist prescribed for type 2 diabetes management.',
    'prescription',
    'draft',
    true,
    '["Mounjaro","LY3298176"]'
  ),
  (
    'tirzepatide-zepbound',
    'Tirzepatide (Zepbound)',
    'tirzepatide',
    '["Zepbound"]',
    'GLP-1 / GIP dual receptor agonist',
    'subcutaneous_injection',
    'Weekly subcutaneous injection. Dose escalated over several months per prescriber guidance.',
    true,
    'A dual GLP-1 / GIP receptor agonist approved for chronic weight management.',
    'prescription',
    'draft',
    true,
    '["Zepbound"]'
  ),
  (
    'liraglutide-saxenda',
    'Liraglutide (Saxenda)',
    'liraglutide',
    '["Saxenda"]',
    'GLP-1 receptor agonist',
    'subcutaneous_injection',
    'Daily subcutaneous injection. Dose escalated over five weeks per prescriber guidance.',
    true,
    'A GLP-1 receptor agonist prescribed for chronic weight management in adults and adolescents.',
    'prescription',
    'draft',
    true,
    '["Saxenda","Victoza"]'
  ),
  (
    'bpc-157',
    'BPC-157',
    'BPC-157',
    '[]',
    'Synthetic peptide (body protection compound)',
    'subcutaneous_injection',
    'Research compound; not approved for human therapeutic use. Dosing in published studies varies widely.',
    false,
    'A synthetic pentadecapeptide studied in animal models for its potential regenerative and gastroprotective effects.',
    'investigational',
    'draft',
    true,
    '["Body Protection Compound 157","Bepecin"]'
  ),
  (
    'aod-9604',
    'AOD-9604',
    'AOD-9604',
    '[]',
    'Synthetic peptide (GH fragment)',
    'subcutaneous_injection',
    'Research compound; not approved for human therapeutic use. Dosing in published studies varies.',
    false,
    'A synthetic fragment of human growth hormone (hGH176-191) investigated for its potential effects on fat metabolism.',
    'investigational',
    'draft',
    true,
    '["AOD9604","hGH176-191"]'
  ),
  (
    'cagrilintide',
    'Cagrilintide',
    'cagrilintide',
    '["CagriSema (combination)"]',
    'Amylin analogue',
    'subcutaneous_injection',
    'Weekly subcutaneous injection. Under investigation in clinical trials; not yet broadly approved.',
    true,
    'A long-acting amylin analogue under clinical investigation for weight management, including in combination with semaglutide.',
    'investigational',
    'draft',
    true,
    '["AM833","CagriSema"]'
  ),
  (
    'retatrutide',
    'Retatrutide',
    'retatrutide',
    '[]',
    'GLP-1 / GIP / glucagon triple receptor agonist',
    'subcutaneous_injection',
    'Weekly subcutaneous injection. Currently in Phase 3 clinical trials; not yet approved.',
    true,
    'A triple receptor agonist (GLP-1, GIP, glucagon) in late-stage clinical development for obesity and metabolic disease.',
    'investigational',
    'draft',
    true,
    '["LY3437943"]'
  ),
  (
    'mazdutide',
    'Mazdutide',
    'mazdutide',
    '[]',
    'GLP-1 / glucagon dual receptor agonist',
    'subcutaneous_injection',
    'Weekly subcutaneous injection. Under clinical investigation; regional approval status varies.',
    true,
    'A dual GLP-1 / glucagon receptor agonist under clinical development for weight management and metabolic disease.',
    'investigational',
    'draft',
    true,
    '["IBI362","OXM3"]'
  )
on conflict (slug) do nothing;
