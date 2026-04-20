-- Demo fixtures for local development / staging
insert into public.peptides (slug, name, aliases, short_description, mechanism_summary, receptor_targets, evidence_score, status_label, is_visible)
select 'bpc-157',
  'BPC-157',
  '["Body Protection Compound-157"]'::jsonb,
  'Synthetic gastric-derived peptide investigated in regeneration and GI models.',
  'Thought to interact with growth factor signalling and nitric oxide pathways in preclinical models; mechanisms are not fully characterised in humans.',
  '["angiogenesis-related pathways"]'::jsonb,
  42,
  'investigational',
  true
where not exists (select 1 from public.peptides where slug = 'bpc-157');

insert into public.studies (title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract)
select
  'Example-controlled trial placeholder',
  'Journal of Example Studies',
  '2020-01-15',
  'human',
  24,
  'Healthy adults',
  'https://example.org/study/bpc-demo',
  '10.1000/example.demo',
  'Demonstration abstract for UI development — replace with curated literature excerpts.'
where not exists (select 1 from public.studies where source_url = 'https://example.org/study/bpc-demo');

insert into public.study_peptides (peptide_id, study_id)
select p.id, s.id
from public.peptides p
cross join public.studies s
where p.slug = 'bpc-157'
  and s.source_url = 'https://example.org/study/bpc-demo'
  and not exists (
    select 1 from public.study_peptides sp
    where sp.peptide_id = p.id and sp.study_id = s.id
  );

insert into public.study_dosages (peptide_id, study_id, dosage_value, dosage_unit, frequency, duration, context_note)
select p.id, s.id, 250, 'mcg', 'once daily', '4 weeks', 'Observed in cited human trial metadata (illustrative).'
from public.peptides p
join public.studies s on s.source_url = 'https://example.org/study/bpc-demo'
where p.slug = 'bpc-157'
  and not exists (
    select 1 from public.study_dosages d
    where d.peptide_id = p.id and d.study_id = s.id and d.dosage_value = 250
  );

insert into public.study_outcomes (peptide_id, study_id, outcome_type, description, significance)
select p.id, s.id, 'efficacy_proxy', 'Illustrative outcome row for dashboard wiring.', 'Not statistically interpreted here.'
from public.peptides p
join public.studies s on s.source_url = 'https://example.org/study/bpc-demo'
where p.slug = 'bpc-157'
  and not exists (
    select 1 from public.study_outcomes o
    where o.peptide_id = p.id and o.study_id = s.id and o.outcome_type = 'efficacy_proxy'
  );

insert into public.side_effects (peptide_id, study_id, effect, severity, frequency)
select p.id, s.id, 'Illustrative mild GI discomfort', 'mild', 'unspecified'
from public.peptides p
join public.studies s on s.source_url = 'https://example.org/study/bpc-demo'
where p.slug = 'bpc-157'
  and not exists (
    select 1 from public.side_effects e
    where e.peptide_id = p.id and e.study_id = s.id and e.effect = 'Illustrative mild GI discomfort'
  );

insert into public.ai_summaries (peptide_id, summary_text, model_name, guardrail_passed, evidence_strength, limitations_text)
select p.id,
  'This peptide has been studied primarily in animal models and small human trials; evidence quality varies by endpoint. No usage or dosing guidance is implied.',
  'seed',
  true,
  'moderate_preclinical_some_human',
  'Summaries are informational only; literature coverage may be incomplete.'
from public.peptides p
where p.slug = 'bpc-157'
on conflict (peptide_id) do nothing;
