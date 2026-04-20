-- ============================================================
-- 0016_seed_injection_guides.sql
-- ============================================================
-- Injection protocol content for the 5 approved pen-delivery
-- GLP-1 drugs. No reconstitution is involved — these are all
-- pre-filled injectable pens.
--
-- Pen families and key differences:
--   Novo Nordisk FlexPen   — Ozempic, Saxenda (dose-dial pens)
--   Novo Nordisk autoinjector — Wegovy (fixed-dose, disposable)
--   Eli Lilly autoinjector — Mounjaro, Zepbound (fixed-dose, disposable)
--
-- step_type: supply | step | warning | disposal
-- ordinal: globally ordered per drug (groups rendered in page)
-- Idempotent: guarded by WHERE NOT EXISTS on (drug_id, title).
-- ============================================================

-- ── Helper: one insert block per drug ────────────────────────
-- Pattern: cross join on values, filter by slug, NOT EXISTS on title.

-- ─────────────────────────────────────────────────────────────
-- WEGOVY (semaglutide-wegovy)
-- Pre-filled, single-use autoinjector pen. Fixed dose per pen.
-- No dose dialling required.
-- ─────────────────────────────────────────────────────────────

insert into public.drug_injection_guide (drug_id, step_type, ordinal, title, body)
select p.id, v.step_type, v.ordinal, v.title, v.body
from public.peptides p
cross join (values
  -- Supplies
  ('supply', 1,  'Your prescribed Wegovy pen (correct dose)',
               'Check that the dose on the pen label matches what your prescriber ordered. Wegovy comes in five fixed-dose strengths — 0.25 mg, 0.5 mg, 1.0 mg, 1.7 mg, and 2.4 mg.'),
  ('supply', 2,  'A new pen needle',
               'NovoFine Plus 4 mm × 32G or equivalent are commonly used. Use a new needle for every injection — reusing blunts the needle and increases injection-site reactions.'),
  ('supply', 3,  'Alcohol swab',
               'To clean the injection site before injecting.'),
  ('supply', 4,  'Sharps disposal container',
               'A rigid, puncture-resistant container for used needles. Available from pharmacies; mail-back programs are listed under Disposal below.'),
  -- Steps
  ('step',   10, 'Wash your hands',
               'Wash with soap and water and dry thoroughly before handling the pen or needle.'),
  ('step',   11, 'Remove the pen from the fridge',
               'Take the pen out of the fridge 30 minutes before injecting. Injecting cold medicine can sting more and slow absorption.'),
  ('step',   12, 'Check the pen',
               'Inspect the liquid through the window — it should be clear, colourless, and free of particles. Check the expiry date. Do not use if it looks cloudy or discoloured.'),
  ('step',   13, 'Attach a new pen needle',
               'Remove the paper tab from the outer needle cap. Push and twist the needle onto the pen until it is secure. Pull off the outer needle cap (keep it for later removal). Pull off the inner needle cap and discard it.'),
  ('step',   14, 'Choose your injection site',
               'Inject into the fatty tissue of your abdomen (at least 5 cm from your navel), the front of your upper thigh, or your upper arm. Rotate sites within each area each week — do not inject in the same spot consecutively.'),
  ('step',   15, 'Clean the site',
               'Wipe the area with the alcohol swab and let it dry fully before injecting.'),
  ('step',   16, 'Inject',
               'Hold the pen at 90° to your skin. Press the pen firmly against your skin and press the injection button. Hold for 6 seconds after pressing — you will hear a click when the injection starts. A second click or colour change in the window confirms the full dose was delivered.'),
  ('step',   17, 'Remove and dispose of the needle',
               'Pull the pen straight away from the skin. Place the outer cap back on the needle using a one-hand scoop technique — do not recap with two hands. Unscrew the needle and place it directly into your sharps container.'),
  ('step',   18, 'Store the pen',
               'Return the used pen to the fridge if it has doses remaining. If this was a single-dose pen, dispose of it in your sharps container.'),
  -- Warnings
  ('warning', 30, 'Never inject into a vein or muscle',
               'Subcutaneous injection (into the fatty layer under the skin) is the correct route. Injecting into a vein or muscle changes how the medicine is absorbed and can cause serious reactions.'),
  ('warning', 31, 'Never share your pen with anyone else',
               'Even with a new needle, blood-borne infections including HIV and hepatitis can be transmitted via shared pens. Your pen is for your use only.'),
  ('warning', 32, 'Rotate injection sites every week',
               'Using the same spot repeatedly causes lipohypertrophy — a hardened fatty lump under the skin. Injecting into a lump reduces absorption unpredictably.'),
  ('warning', 33, 'Do not inject into scar tissue, bruises, or broken skin',
               NULL),
  ('warning', 34, 'If you miss a dose by more than 5 days, skip it',
               'Take your next dose on your regular scheduled day. Do not double-dose to make up for a missed one.'),
  ('warning', 35, 'Tell all healthcare providers you are using Wegovy',
               'Slowed gastric emptying affects fasting requirements for procedures and the absorption of other oral medicines.'),
  -- Disposal
  ('disposal', 50, 'Use a sharps disposal container',
               'Place used needles and pens directly into a rigid, puncture-resistant sharps container. Do not place loose needles in household rubbish or recycling.'),
  ('disposal', 51, 'NestSafe sharps mail-back program (Australia)',
               'Free household sharps mail-back program. Collect a free mail-back kit from participating pharmacies or via nestsafe.com.au. Seal and post when full — no charge.'),
  ('disposal', 52, 'EnviroSafe sharps disposal (Australia)',
               'Another AU mail-back option available through participating pharmacies. Kits are provided at no cost to patients.'),
  ('disposal', 53, 'Community pharmacy drop-off',
               'Many Australian pharmacies accept filled sharps containers for disposal. Ask your dispensing pharmacy if they offer this service.')
) as v(step_type, ordinal, title, body)
where p.slug = 'semaglutide-wegovy'
  and not exists (
    select 1 from public.drug_injection_guide g
    where g.drug_id = p.id and g.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- OZEMPIC (semaglutide-ozempic)
-- Multi-dose FlexPen — dial your prescribed dose before each injection.
-- Pen holds multiple doses (0.25 mg, 0.5 mg, 1.0 mg, or 2.0 mg).
-- ─────────────────────────────────────────────────────────────

insert into public.drug_injection_guide (drug_id, step_type, ordinal, title, body)
select p.id, v.step_type, v.ordinal, v.title, v.body
from public.peptides p
cross join (values
  ('supply', 1,  'Your prescribed Ozempic pen (correct strength)',
               'Ozempic pens come in three strengths: 2 mg/1.5 mL (doses of 0.25 mg or 0.5 mg), 4 mg/3 mL (doses of 1 mg), and 8 mg/3 mL (doses of 2 mg). Confirm the pen strength matches your prescribed dose.'),
  ('supply', 2,  'A new pen needle',
               'NovoFine or equivalent, typically 4 mm × 32G. Always use a new needle for each injection.'),
  ('supply', 3,  'Alcohol swab', NULL),
  ('supply', 4,  'Sharps disposal container', NULL),
  -- Steps
  ('step',   10, 'Wash your hands thoroughly', NULL),
  ('step',   11, 'Remove pen from fridge 30 minutes before use',
               'Injecting room-temperature medicine is more comfortable and aids absorption.'),
  ('step',   12, 'Check the pen and liquid',
               'The solution should be clear and colourless. Check the expiry date. Never use a cloudy or discoloured pen.'),
  ('step',   13, 'Attach a new needle and prime if it is a new pen',
               'Attach the needle as described in the IFU. If this is a new pen or the first use after a break, do a flow check (prime): dial to the flow check symbol, point the pen upward, and press the button until a drop appears at the needle tip.'),
  ('step',   14, 'Dial your prescribed dose',
               'Turn the dose selector until the prescribed dose appears in the dose window. If you dial past your dose, you can turn back.'),
  ('step',   15, 'Choose and clean your injection site',
               'Abdomen (5 cm from navel), upper thigh, or upper arm. Wipe with an alcohol swab and let dry.'),
  ('step',   16, 'Inject',
               'Hold the pen at 90° to the skin. Press firmly and press the injection button all the way. Hold for 6 seconds until the dose counter returns to 0.'),
  ('step',   17, 'Remove needle and dispose immediately',
               'Recap using one-hand scoop, unscrew, drop directly into sharps container.'),
  ('step',   18, 'Replace the pen cap and return to fridge',
               'The pen can be used until all doses are delivered or the expiry date, whichever comes first.'),
  -- Warnings (same core set as Wegovy)
  ('warning', 30, 'Never inject into a vein or muscle', NULL),
  ('warning', 31, 'Never share your pen', NULL),
  ('warning', 32, 'Rotate injection sites every week', NULL),
  ('warning', 33, 'Do not inject into scar tissue, bruises, or broken skin', NULL),
  ('warning', 34, 'If you miss a dose by more than 5 days, skip and resume on your regular day', NULL),
  ('warning', 35, 'Tell all healthcare providers you are using Ozempic',
               'Gastric emptying is slowed — relevant for fasting before procedures and for absorption of oral medicines.'),
  -- Disposal
  ('disposal', 50, 'Sharps container — do not place loose needles in household bins', NULL),
  ('disposal', 51, 'NestSafe mail-back (Australia) — free from participating pharmacies', NULL),
  ('disposal', 52, 'EnviroSafe mail-back (Australia) — available from pharmacies', NULL),
  ('disposal', 53, 'Community pharmacy drop-off — ask your dispensing pharmacy', NULL)
) as v(step_type, ordinal, title, body)
where p.slug = 'semaglutide-ozempic'
  and not exists (
    select 1 from public.drug_injection_guide g
    where g.drug_id = p.id and g.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- SAXENDA (liraglutide-saxenda)
-- Multi-dose FlexPen — daily injection, dose dialled each time.
-- Doses: 0.6 mg, 1.2 mg, 1.8 mg, 2.4 mg, 3.0 mg
-- ─────────────────────────────────────────────────────────────

insert into public.drug_injection_guide (drug_id, step_type, ordinal, title, body)
select p.id, v.step_type, v.ordinal, v.title, v.body
from public.peptides p
cross join (values
  ('supply', 1,  'Your Saxenda pen',
               'Each pen contains 18 mg/3 mL of liraglutide (6 mg/mL). One pen provides multiple daily injections — it will last varying numbers of days depending on your current dose in the escalation schedule.'),
  ('supply', 2,  'A new pen needle (each day)',
               'NovoFine or equivalent, 4 mm × 32G recommended. A fresh needle is required for every daily injection.'),
  ('supply', 3,  'Alcohol swab', NULL),
  ('supply', 4,  'Sharps disposal container', NULL),
  -- Steps
  ('step',   10, 'Wash your hands', NULL),
  ('step',   11, 'Check the pen',
               'The liquid should be clear and colourless. Check the remaining doses counter to confirm there is enough for your dose today. Check the expiry date.'),
  ('step',   12, 'Attach a new needle',
               'Remove the outer cap paper tab, push and twist the needle onto the pen, remove the outer cap (save it), then pull off and discard the inner needle cap.'),
  ('step',   13, 'Dial your current dose',
               'Turn the dose selector to your current prescribed dose: 0.6, 1.2, 1.8, 2.4, or 3.0 mg. Your dose increases weekly during the escalation period — confirm your current week''s target with your prescriber.'),
  ('step',   14, 'Prime if this is a new pen',
               'If this is a new pen, dial 0.6 mg, point the pen upward, and press the button until a drop appears. Repeat until a drop is seen.'),
  ('step',   15, 'Choose and clean your injection site',
               'Abdomen (not within 5 cm of the navel), upper thigh, or upper arm. Rotate the site daily — not the same spot twice in a row. Clean with an alcohol swab.'),
  ('step',   16, 'Inject',
               'Hold the pen at 90° to the skin, press firmly and press the injection button all the way. Count slowly to 6 — hold until the dose counter reads 0.'),
  ('step',   17, 'Remove needle and dispose',
               'Recap with the saved outer cap (one-hand scoop), unscrew, and drop into your sharps container.'),
  ('step',   18, 'Return pen to fridge',
               'Store between 2–8°C. After first use the pen can be kept at room temperature (below 30°C) for up to 30 days.'),
  -- Warnings
  ('warning', 30, 'Never inject into a vein or muscle', NULL),
  ('warning', 31, 'Never share your pen', NULL),
  ('warning', 32, 'Rotate injection sites daily',
               'With daily injections, rotation is especially important — using the same spot causes lipohypertrophy (hardened fatty lumps) that impairs absorption.'),
  ('warning', 33, 'Do not inject into scar tissue, bruises, or broken skin', NULL),
  ('warning', 34, 'A 4% weight-loss check applies at 16 weeks on 3.0 mg',
               'If less than 4% of body weight has been lost by week 16 at the full dose, your prescriber will review whether to continue.'),
  ('warning', 35, 'Tell all healthcare providers you are using Saxenda', NULL),
  -- Disposal
  ('disposal', 50, 'Sharps container — do not place loose needles in household bins', NULL),
  ('disposal', 51, 'NestSafe mail-back (Australia) — free from participating pharmacies', NULL),
  ('disposal', 52, 'EnviroSafe mail-back (Australia)', NULL),
  ('disposal', 53, 'Community pharmacy drop-off — ask your dispensing pharmacy', NULL)
) as v(step_type, ordinal, title, body)
where p.slug = 'liraglutide-saxenda'
  and not exists (
    select 1 from public.drug_injection_guide g
    where g.drug_id = p.id and g.title = v.title
  );

-- ─────────────────────────────────────────────────────────────
-- MOUNJARO (tirzepatide-mounjaro) &
-- ZEPBOUND (tirzepatide-zepbound)
-- Eli Lilly single-dose autoinjector pen — fixed dose per pen,
-- no dialling. Click-confirm injection mechanism.
-- Both pens work the same way; content is identical.
-- ─────────────────────────────────────────────────────────────

do $$
declare
  v_slug text;
begin
  foreach v_slug in array array['tirzepatide-mounjaro','tirzepatide-zepbound']
  loop
    insert into public.drug_injection_guide (drug_id, step_type, ordinal, title, body)
    select p.id, vals.step_type, vals.ordinal, vals.title, vals.body
    from public.peptides p
    cross join (values
      ('supply'::text, 1,  'Your prescribed Mounjaro/Zepbound autoinjector pen (correct dose)',
                   'Each pen is single-use and contains a fixed dose (2.5, 5, 7.5, 10, 12.5, or 15 mg). Check the dose label matches your prescriber''s instructions.'),
      ('supply', 2,  'Alcohol swab', null::text),
      ('supply', 3,  'Sharps disposal container', null),
      -- Steps
      ('step',   10, 'Wash your hands thoroughly', null),
      ('step',   11, 'Remove the pen from the fridge 30 minutes before use',
                   'Room-temperature injection is more comfortable. Do not warm the pen in a microwave or hot water.'),
      ('step',   12, 'Check the pen',
                   'Look through the inspection window — the liquid should be clear and colourless. Check the expiry date on the label. Do not use if cloudy, discoloured, or if particles are present.'),
      ('step',   13, 'Peel off the base cap label and remove the base cap',
                   'Pull the base cap straight off and discard — do not twist. You will see the needle inside.'),
      ('step',   14, 'Choose and clean your injection site',
                   'Abdomen (5 cm from navel), upper thigh, or upper arm. Rotate sites each week. Wipe with an alcohol swab and let dry completely.'),
      ('step',   15, 'Place the pen flat against your skin',
                   'Hold the pen so the clear base is flush against the injection site at 90°. Do not angle it.'),
      ('step',   16, 'Press the button and hold',
                   'Press the injection button firmly. You will hear two clicks: the first click signals the injection has started; hold until the second click, then hold for an additional 5 seconds. The yellow indicator in the inspection window confirms the full dose was delivered.'),
      ('step',   17, 'Lift the pen straight away from the skin',
                   'The needle retracts automatically — you will not see the needle after use.'),
      ('step',   18, 'Dispose of the entire pen in your sharps container',
                   'This is a single-use pen — the entire pen goes into the sharps container after one injection.'),
      -- Warnings
      ('warning', 30, 'Never inject into a vein or muscle', null),
      ('warning', 31, 'This pen is single-use only — discard after one injection',
                   'Unlike some pens, Mounjaro and Zepbound pens are not multi-dose. Attempting to re-use will not deliver a full dose.'),
      ('warning', 32, 'Rotate injection sites each week', null),
      ('warning', 33, 'Do not inject into scar tissue, bruises, or broken skin', null),
      ('warning', 34, 'If you miss a dose by more than 4 days (Mounjaro) or 5 days (Zepbound), skip and resume on your next scheduled day', null),
      ('warning', 35, 'Tell all healthcare providers you are using this medicine',
                   'Slowed gastric emptying is relevant for surgical preparation and oral medicine absorption.'),
      -- Disposal
      ('disposal', 50, 'Place the entire used pen in a sharps container',
                   'The auto-retracted needle is still sharp inside the pen. The full pen must go into the sharps container — not general waste.'),
      ('disposal', 51, 'NestSafe sharps mail-back (Australia) — free kit from participating pharmacies', null),
      ('disposal', 52, 'EnviroSafe mail-back (Australia)', null),
      ('disposal', 53, 'Community pharmacy drop-off', null)
    ) as vals(step_type, ordinal, title, body)
    where p.slug = v_slug
      and not exists (
        select 1 from public.drug_injection_guide g
        where g.drug_id = p.id and g.title = vals.title
      );
  end loop;
end;
$$;
