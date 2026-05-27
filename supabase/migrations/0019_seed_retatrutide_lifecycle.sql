-- ============================================================
-- 0019_seed_retatrutide_lifecycle.sql
-- ============================================================
-- Adds lifecycle factor tips and updates typical_dosing_schedule
-- for Retatrutide so the Protocol Overview section renders.
-- Idempotent: guarded by WHERE NOT EXISTS on title.
-- ============================================================

-- ── 1. Update typical_dosing_schedule (Protocol Overview text) ─

update public.peptides set
  typical_dosing_schedule = 'Once-weekly subcutaneous injection, titrated over 12–26 weeks from a starting dose of 2 mg/week. Most compounding pharmacies dispense 10 mg or 20 mg lyophilised vials; both yield a 10 mg/mL solution when reconstituted per the guide below. Dose escalation follows a prescriber-led schedule — the Phase 2 trial used 4-week intervals before each increase. The 12 mg/week arm produced a mean 24.2 % body-weight reduction at 48 weeks in the primary obesity trial.'
where slug = 'retatrutide';

-- ── 2. Lifecycle factor tips ─────────────────────────────────

insert into public.drug_tips (drug_id, category, title, body_markdown, ordinal)
select p.id, v.category, v.title, v.body_markdown, v.ordinal
from public.peptides p
cross join (values
  ('other'::text,
   'Weight may return after stopping',
   'Retatrutide suppresses appetite by activating receptors that control hunger and energy expenditure — effects that subside once the drug clears. With a half-life of ~6 days, retatrutide takes roughly 5–6 half-lives (30–36 days) to be almost entirely eliminated. Without a transition plan, most people regain a portion of lost weight over the following months. Talk with your prescriber before stopping — some patients transition to a lower maintenance dose (2–4 mg/week) rather than stopping abruptly.',
   10),
  ('other',
   'Allow enough time for meaningful results',
   'Phase 2 trials ran for 36–48 weeks, and most participants reached their lowest weight between weeks 24 and 48. Starting a course with a short-term mindset (under 12 weeks) is unlikely to produce sustained results — the dose is still escalating during that window and weight loss typically accelerates after week 12.',
   11),
  ('other',
   'Half-life and clearance: what to expect when you stop',
   'With a ~6-day half-life, drug levels fall by roughly half every 6 days after the last injection. After about 5–6 half-lives (30–36 days) the peptide has cleared to near-zero. Expect appetite and energy intake to return gradually over this 4–5 week window rather than abruptly. Any GI symptoms present at stopping should also resolve over the same period.',
   12),
  ('other',
   'Lean mass and exercise during treatment',
   'Rapid weight loss driven by appetite suppression can reduce lean muscle mass alongside fat. Phase 2 participants who included resistance training maintained more lean mass and had a higher proportion of fat loss. If structured exercise is not already part of your routine, discussing it with your prescriber before starting dose escalation is worthwhile.',
   13)
) as v(category, title, body_markdown, ordinal)
where p.slug = 'retatrutide'
  and not exists (
    select 1 from public.drug_tips t
    where t.drug_id = p.id and t.title = v.title
  );
