-- ============================================================
-- 0009_peptide_clinical_profile.sql
-- ============================================================
-- Additive: adds four compliance-safe clinical-profile columns
-- to peptides so drug pages can surface contraindications,
-- known drug interactions, storage handling, and pharmacokinetics.
--
-- Deliberately excluded (remains prescriber-scoped):
--   reconstitution ratios, per-vial mg protocols, titration ladders.
-- ============================================================

alter table public.peptides
  add column if not exists contraindications text,
  add column if not exists drug_interactions jsonb not null default '[]'::jsonb,
  add column if not exists storage_handling text,
  add column if not exists pharmacokinetics jsonb not null default '{}'::jsonb;

-- drug_interactions shape (array of objects):
--   [{ "drug": "warfarin", "interaction": "...", "severity": "moderate" }, ...]
-- pharmacokinetics shape (flat object):
--   { "half_life": "~6 days", "tmax": "24-72h",
--     "bioavailability_note": "...", "clearance": "..." }
