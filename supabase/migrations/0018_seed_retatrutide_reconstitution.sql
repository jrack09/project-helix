-- ============================================================
-- 0018_seed_retatrutide_reconstitution.sql
-- ============================================================
-- Seeds reconstitution guide, dose reference tables, and
-- lyophilized injection guide for Retatrutide.
--
-- Retatrutide is dispensed as a lyophilised powder from
-- compounding pharmacies. This content covers the two most
-- common compounded vial sizes: 10 mg and 20 mg.
--
-- Reference disclaimer applied in all content:
--   "Concentration calculations are standard compounding
--    arithmetic. Protocol phases are drawn from published
--    Phase 2 trial data. Your prescriber and dispensing
--    pharmacy determine the actual dose, vial size, and
--    escalation schedule for your treatment."
--
-- Idempotent: guarded by WHERE NOT EXISTS on natural keys.
-- ============================================================

-- ── 1. Reconstitution guide (10 mg and 20 mg vials) ─────────

insert into public.drug_reconstitution_guide (
  drug_id, vial_size_mg, bac_water_ml, concentration_mg_per_ml,
  technique_notes, measurement_note,
  storage_lyophilized, storage_reconstituted, use_within, ordinal
)
select p.id, v.vial_size_mg, v.bac_water_ml, v.concentration_mg_per_ml,
       v.technique_notes, v.measurement_note,
       v.storage_lyophilized, v.storage_reconstituted, v.use_within, v.ordinal
from public.peptides p
cross join (values
  (
    10.0, 1.0, 10.0,
    -- technique
    'Allow the vial to reach room temperature before opening — this reduces condensation inside the vial.

Remove the protective cap from the vial. Wipe the rubber stopper with an alcohol swab and allow to dry.

Draw 1.0 mL of bacteriostatic water into an insulin syringe. Insert the needle through the rubber stopper and inject the water slowly down the inner wall of the vial — do not squirt it directly onto the powder.

Gently swirl or roll the vial between your palms until the powder is fully dissolved. Do not shake — shaking can degrade the peptide.

Hold the vial up to the light and inspect: the solution should be clear and colourless. A very faint yellow tinge is sometimes normal for retatrutide but discard if cloudy, visibly particulate, or strongly discoloured.

Label the vial with the reconstitution date and concentration (10 mg/mL). Refrigerate immediately.',
    -- measurement note
    'At 10 mg/mL: on a U-100 insulin syringe, 1 unit = 0.01 mL = 0.1 mg of retatrutide.',
    -- storage lyophilised
    'Store unopened lyophilised vials at −20 °C (−4 °F) or colder. Stable for up to 24 months when stored correctly. Allow to reach room temperature before reconstituting.',
    -- storage reconstituted
    'Refrigerate at 2–8 °C (35–46 °F). Protect from light (keep in the original carton or a drawer).',
    'Use within 4 weeks of reconstitution.',
    1
  ),
  (
    20.0, 2.0, 10.0,
    'Allow the vial to reach room temperature before opening.

Wipe the rubber stopper with an alcohol swab and allow to dry.

Draw 2.0 mL of bacteriostatic water. Inject slowly down the inner vial wall — do not squirt directly onto the powder.

Gently swirl or roll until fully dissolved. Do not shake.

Inspect: solution should be clear and colourless. Discard if cloudy or particulate.

Label with reconstitution date and concentration (10 mg/mL). Refrigerate immediately.

For extended storage: the reconstituted solution may be aliquoted into smaller volumes using sterile technique and frozen at −20 °C. Thaw each aliquot once only — do not refreeze.',
    'At 10 mg/mL: on a U-100 insulin syringe, 1 unit = 0.01 mL = 0.1 mg of retatrutide.',
    'Store unopened lyophilised vials at −20 °C (−4 °F) or colder. Stable for up to 24 months.',
    'Refrigerate at 2–8 °C (35–46 °F). Protect from light. For doses taken from the same reconstituted vial over several weeks, maintain strict sterile technique.',
    'Use within 4 weeks of reconstitution (or freeze individual aliquots for extended stability).',
    2
  )
) as v(vial_size_mg, bac_water_ml, concentration_mg_per_ml,
        technique_notes, measurement_note,
        storage_lyophilized, storage_reconstituted, use_within, ordinal)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_reconstitution_guide r
    where r.drug_id = p.id and r.vial_size_mg = v.vial_size_mg
  );

-- ── 2. Dose reference tables ─────────────────────────────────

-- 2a. Concentration reference — simple mg→units→mL lookup at 10 mg/mL
insert into public.drug_dose_reference
  (drug_id, protocol_label, phase_label, dose_mg, units_u100, volume_ml, ordinal)
select p.id, 'Concentration reference (10 mg/mL)',
       v.phase_label, v.dose_mg, v.units_u100, v.volume_ml, v.ordinal
from public.peptides p
cross join (values
  ('2 mg',  2.0,   20,  0.20, 10),
  ('4 mg',  4.0,   40,  0.40, 20),
  ('6 mg',  6.0,   60,  0.60, 30),
  ('8 mg',  8.0,   80,  0.80, 40),
  ('10 mg', 10.0, 100,  1.00, 50),
  ('12 mg', 12.0, 120,  1.20, 60)
) as v(phase_label, dose_mg, units_u100, volume_ml, ordinal)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_dose_reference d
    where d.drug_id = p.id
      and d.protocol_label = 'Concentration reference (10 mg/mL)'
      and d.dose_mg = v.dose_mg
  );

-- 2b. Standard escalation — phased protocol reference from Phase 2 trial data
insert into public.drug_dose_reference
  (drug_id, protocol_label, phase_label, dose_mg, units_u100, volume_ml, ordinal)
select p.id, 'Standard escalation (Phase 2 reference)',
       v.phase_label, v.dose_mg, v.units_u100, v.volume_ml, v.ordinal
from public.peptides p
cross join (values
  ('Weeks 1–4',  2.0,  20,  0.20, 10),
  ('Weeks 5–8',  4.0,  40,  0.40, 20),
  ('Weeks 9–12', 6.0,  60,  0.60, 30),
  ('Weeks 13+',  8.0,  80,  0.80, 40)
) as v(phase_label, dose_mg, units_u100, volume_ml, ordinal)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_dose_reference d
    where d.drug_id = p.id
      and d.protocol_label = 'Standard escalation (Phase 2 reference)'
      and d.dose_mg = v.dose_mg
  );

-- 2c. Advanced escalation — higher-dose arm from Phase 2
insert into public.drug_dose_reference
  (drug_id, protocol_label, phase_label, dose_mg, units_u100, volume_ml, ordinal)
select p.id, 'Advanced escalation (Phase 2 high-dose arm)',
       v.phase_label, v.dose_mg, v.units_u100, v.volume_ml, v.ordinal
from public.peptides p
cross join (values
  ('Weeks 1–4',  2.0,   20,  0.20, 10),
  ('Weeks 5–8',  4.0,   40,  0.40, 20),
  ('Weeks 9–12', 8.0,   80,  0.80, 30),
  ('Weeks 13+', 12.0,  120,  1.20, 40)
) as v(phase_label, dose_mg, units_u100, volume_ml, ordinal)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_dose_reference d
    where d.drug_id = p.id
      and d.protocol_label = 'Advanced escalation (Phase 2 high-dose arm)'
      and d.dose_mg = v.dose_mg
  );

-- ── 3. Lyophilised injection guide ───────────────────────────

insert into public.drug_injection_guide (drug_id, step_type, formulation, ordinal, title, body)
select p.id, v.step_type, 'lyophilized', v.ordinal, v.title, v.body
from public.peptides p
cross join (values
  -- Supplies
  ('supply'::text, 1,  'Prescribed retatrutide lyophilised vials',
                       'Your compounding pharmacy will dispense the vial size and quantity prescribed. Check the label matches your prescription.'),
  ('supply', 2,  'Bacteriostatic water for injection (10 mL vials)',
                       'Bacteriostatic water (BAC water, 0.9% benzyl alcohol) is used as the reconstitution diluent. Sterile water for injection is an alternative but offers no bacteriostatic protection; use reconstituted solution within 24 hours if sterile water is used.'),
  ('supply', 3,  'U-100 insulin syringes (1 mL)',
                       'Use 1 mL U-100 syringes — they are calibrated in 1-unit increments (1 unit = 0.01 mL). Common needle sizes: 29G–31G × 5–8 mm. Use one syringe per injection; never reuse.'),
  ('supply', 4,  'Alcohol swabs',
                       'To wipe the vial rubber stopper and injection site before each use.'),
  ('supply', 5,  'Labels and a fine-tip marker',
                       'Label each vial with the reconstitution date and concentration so you can track the 4-week use window.'),
  ('supply', 6,  'Sharps disposal container',
                       'A rigid, puncture-resistant container for used syringes and vial caps.'),
  -- Steps
  ('step', 10, 'Wash your hands thoroughly',
               NULL),
  ('step', 11, 'Set up a clean workspace',
               'Use a clean, flat surface. Lay out your supplies. Do not work near an open window or fan.'),
  ('step', 12, 'Draw up your dose',
               'Wipe the vial rubber stopper with a fresh alcohol swab. Allow to dry. Draw back the syringe plunger to your target volume to fill with air, then inject air into the vial (inverted) before drawing the solution — this makes extraction easier. Pull back the plunger to draw the exact volume for your prescribed dose. Refer to the concentration reference table above for the mL volume for your dose.'),
  ('step', 13, 'Remove air bubbles',
               'Hold the syringe needle-up, tap to bring bubbles to the top, and gently press the plunger to expel air. Recheck that the volume is correct.'),
  ('step', 14, 'Choose and clean your injection site',
               'Rotate between the abdomen (at least 5 cm from the navel), front of the upper thigh, and upper arm. Wipe with an alcohol swab and allow to dry completely before injecting.'),
  ('step', 15, 'Inject subcutaneously',
               'Pinch a skinfold if you have a thin subcutaneous layer. Insert the needle at 45–90° into the fatty tissue. Do not aspirate for subcutaneous injections. Inject slowly and steadily. Wait 3–5 seconds before withdrawing.'),
  ('step', 16, 'Withdraw and apply gentle pressure',
               'Withdraw the needle smoothly. Apply light pressure with a clean swab — do not rub. A small bleed or bruise is normal.'),
  ('step', 17, 'For doses above 1.0 mL, split the injection',
               'Volumes greater than 1.0 mL should be split across two injection sites at different locations to reduce discomfort and local absorption issues.'),
  ('step', 18, 'Dispose and return vial to fridge',
               'Place the used syringe directly into your sharps container. Return the reconstituted vial to the refrigerator (2–8 °C). Record the injection date, site, and dose.'),
  -- Warnings
  ('warning', 30, 'Your prescriber determines your dose and escalation — not this guide',
               'The dose reference tables on this page are drawn from published Phase 2 trial protocols. Your actual prescribed dose, escalation schedule, and target may differ. Always follow your prescriber''s instructions.'),
  ('warning', 31, 'Never inject into a vein or muscle',
               'Retatrutide is a subcutaneous injection only. Intravenous or intramuscular injection changes absorption kinetics and can cause serious reactions.'),
  ('warning', 32, 'Rotate injection sites every week',
               'Injecting the same spot repeatedly causes lipohypertrophy — a hardened lump that impairs absorption unpredictably.'),
  ('warning', 33, 'Do not shake the reconstituted vial',
               'Shaking can cause foaming and peptide degradation. Swirl or roll gently only.'),
  ('warning', 34, 'Discard reconstituted vial after 4 weeks',
               'Even refrigerated, reconstituted peptide degrades over time and bacteriostatic protection is not indefinite. Label every vial with the reconstitution date.'),
  ('warning', 35, 'Do not use if solution is cloudy or has particles',
               'These are signs of degradation or contamination. Discard the vial and contact your pharmacy.'),
  ('warning', 36, 'Compounded retatrutide is not TGA-approved',
               'Retatrutide has not been approved by the TGA, FDA, or EMA. Compounded versions dispensed by Australian compounding pharmacies operate under different regulatory pathways. Discuss this with your prescriber.'),
  ('warning', 37, 'Tell all healthcare providers you are using retatrutide',
               'Slowed gastric emptying affects fasting preparation for procedures and absorption of other oral medicines.'),
  -- Disposal
  ('disposal', 50, 'Place all used syringes in a sharps container immediately after use',
               'Do not recap needles with two hands — use the one-hand scoop technique if recapping is necessary.'),
  ('disposal', 51, 'NestSafe sharps mail-back program (Australia)',
               'Free household sharps mail-back. Collect a kit from participating pharmacies or via nestsafe.com.au.'),
  ('disposal', 52, 'EnviroSafe sharps mail-back (Australia)',
               'Available from participating pharmacies at no cost to patients.'),
  ('disposal', 53, 'Community pharmacy drop-off',
               'Many Australian pharmacies accept full sharps containers. Ask your dispensing pharmacy.'),
  ('disposal', 54, 'Vial disposal',
               'Empty glass vials can be placed in a sharps container or returned to your compounding pharmacy if they offer a take-back service.')
) as v(step_type, ordinal, title, body)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_injection_guide g
    where g.drug_id = p.id and g.title = v.title and g.formulation = 'lyophilized'
  );
