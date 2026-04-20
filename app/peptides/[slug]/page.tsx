import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRegionNotice } from '@/lib/compliance/region-copy';
import { QuickFactsPanel, ProtocolBlock } from '@/components/ui/content-blocks';
import { TocScrollSpy } from '@/components/ui/toc-scrollspy';
import { MobileSectionRail } from '@/components/ui/mobile-section-rail';

type Props = { params: Promise<{ slug: string }> };

export default async function DrugDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: drug } = await supabase
    .from('peptides')
    .select('id, slug, name, generic_name, brand_names, drug_class, administration_route, typical_dosing_schedule, short_description, mechanism_summary, evidence_score, status_label, prescription_required, contraindications, drug_interactions, storage_handling, pharmacokinetics')
    .eq('slug', slug)
    .eq('is_visible', true)
    .eq('publication_status', 'published')
    .maybeSingle();

  if (!drug) notFound();

  const [expectationsRes, foodRes, tipsRes, sideEffectsRes, studyLinksRes, dosagesRes, outcomesRes, injectionGuideRes] = await Promise.all([
    supabase.from('drug_expectations').select('id, week_number, milestone, description, is_common').eq('drug_id', drug.id).order('week_number').limit(6),
    supabase.from('drug_food_guidance').select('id, category, item, rationale').eq('drug_id', drug.id).order('ordinal').limit(12),
    supabase.from('drug_tips').select('id, category, title, body_markdown').eq('drug_id', drug.id).order('ordinal').limit(6),
    supabase.from('side_effects').select('id, effect, severity, frequency').eq('peptide_id', drug.id).limit(10),
    supabase.from('study_peptides').select('study_id').eq('peptide_id', drug.id),
    supabase.from('study_dosages').select('id, study_id, dosage_value, dosage_unit, frequency, duration, context_note').eq('peptide_id', drug.id),
    supabase.from('study_outcomes').select('id, study_id, outcome_type, description, significance').eq('peptide_id', drug.id),
    supabase.from('drug_injection_guide').select('id, step_type, ordinal, title, body').eq('drug_id', drug.id).order('ordinal'),
  ]);

  const studyIds = (studyLinksRes.data ?? []).map((r) => r.study_id);
  const studiesRes = studyIds.length > 0
    ? await supabase
        .from('studies')
        .select('id, title, journal, publication_date, study_type, sample_size, population, source_url, doi, abstract')
        .in('id', studyIds)
        .eq('publication_status', 'published')
        .order('publication_date', { ascending: false })
    : { data: [] as Array<{ id: string; title: string; journal: string | null; publication_date: string | null; study_type: string; sample_size: number | null; population: string | null; source_url: string; doi: string | null; abstract: string | null }> };

  let regionNote: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('region_code').eq('id', user.id).single();
    regionNote = getRegionNotice(profile?.region_code);
  }

  const brands = Array.isArray(drug.brand_names) ? (drug.brand_names as string[]) : [];
  const expectations = expectationsRes.data ?? [];
  const food = foodRes.data ?? [];
  const tips = tipsRes.data ?? [];
  const sideEffects = sideEffectsRes.data ?? [];
  const studies = studiesRes.data ?? [];
  const dosages = dosagesRes.data ?? [];
  const outcomes = outcomesRes.data ?? [];

  const injectionGuide = injectionGuideRes.data ?? [];
  const injectionByType = (['supply', 'step', 'warning', 'disposal'] as const).reduce(
    (acc, t) => ({ ...acc, [t]: injectionGuide.filter((g) => g.step_type === t) }),
    {} as Record<string, typeof injectionGuide>,
  );

  const dosagesByStudy = dosages.reduce<Record<string, typeof dosages>>((acc, d) => {
    (acc[d.study_id] ||= []).push(d);
    return acc;
  }, {});
  const outcomesByStudy = outcomes.reduce<Record<string, typeof outcomes>>((acc, o) => {
    (acc[o.study_id] ||= []).push(o);
    return acc;
  }, {});

  const STUDY_TYPE_LABEL: Record<string, string> = {
    human: 'Human trial',
    animal: 'Animal study',
    in_vitro: 'In vitro',
    review: 'Review',
    meta_analysis: 'Meta-analysis',
  };

  type DrugInteraction = { drug?: string; interaction?: string; severity?: string };
  const interactionList: DrugInteraction[] = Array.isArray(drug.drug_interactions)
    ? (drug.drug_interactions as DrugInteraction[])
    : [];
  const pk = (drug.pharmacokinetics && typeof drug.pharmacokinetics === 'object' && !Array.isArray(drug.pharmacokinetics))
    ? (drug.pharmacokinetics as Record<string, string>)
    : {};
  const PK_LABEL: Record<string, string> = {
    half_life: 'Elimination half-life',
    tmax: 'Time to peak concentration (Tmax)',
    bioavailability_note: 'Bioavailability',
    clearance: 'Clearance',
  };
  const pkEntries = Object.entries(pk).filter(([, v]) => typeof v === 'string' && v.length > 0);

  const FOOD_LABEL: Record<string, string> = { prefer: '✅ Prefer', limit: '⚠️ Limit', avoid: '❌ Avoid', hydrate: '💧 Hydrate' };
  const foodByCategory = (['prefer', 'limit', 'avoid', 'hydrate'] as const).reduce(
    (acc, cat) => ({ ...acc, [cat]: food.filter((f) => f.category === cat) }),
    {} as Record<string, typeof food>,
  );

  const tocItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'expectations', label: 'What to expect' },
    { id: 'guidance', label: 'Food and practical guidance' },
    ...(injectionGuide.length > 0 ? [{ id: 'injection', label: 'Injection guide' }] : []),
    { id: 'safety', label: 'Safety and interactions' },
    { id: 'evidence', label: 'Research evidence' },
  ];

  const quickFacts = [
    { label: 'Drug Class', value: drug.drug_class || 'General companion info' },
    { label: 'Route', value: drug.administration_route || 'See prescribing information' },
    { label: 'Schedule', value: drug.typical_dosing_schedule || 'Individualized by prescriber' },
    { label: 'Evidence', value: drug.evidence_score != null ? String(drug.evidence_score) : 'Published literature linked below' },
  ];

  return (
    <main className="section-shell py-8 pb-24 sm:py-10 sm:pb-10">
      <div className="space-y-8">
        <div className="sticky top-[4.5rem] z-30 lg:hidden">
          <TocScrollSpy items={tocItems} compact />
        </div>
        <Link href="/peptides" className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← All drugs
        </Link>

        <header id="overview" className="space-y-4 fade-up">
          <p className="eyebrow">Drug companion protocol</p>
          <div className="space-y-3">
            <div className="flex flex-wrap items-start gap-2.5">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{drug.name}</h1>
              {drug.prescription_required && <Badge>Prescription only</Badge>}
              {drug.drug_class && <Badge variant="secondary">{drug.drug_class}</Badge>}
            </div>
            {brands.length > 0 ? <p className="text-sm text-muted-foreground">Also known as: {brands.join(', ')}</p> : null}
            {drug.short_description ? (
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{drug.short_description}</p>
            ) : null}
          </div>
          <QuickFactsPanel items={quickFacts} />
          <Alert variant="info">
            <AlertDescription className="text-sm">
              <strong>General information only — not medical advice.</strong> Always follow your prescriber's instructions.
              {regionNote ? <> {regionNote}</> : null}
            </AlertDescription>
          </Alert>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-8">
            {(drug.mechanism_summary || drug.typical_dosing_schedule || expectations.length > 0) && (
              <ProtocolBlock id="expectations" title="What to expect" subtitle="How this medication is generally described in evidence-backed companion content.">
                <div className="space-y-5">
                  {drug.mechanism_summary ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How it works</p>
                      <p className="mt-1.5 text-sm leading-relaxed">{drug.mechanism_summary}</p>
                    </div>
                  ) : null}
                  {drug.typical_dosing_schedule ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Typical schedule context</p>
                      <p className="mt-1.5 text-sm leading-relaxed">{drug.typical_dosing_schedule}</p>
                    </div>
                  ) : null}
                  {expectations.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Week-by-week milestones</p>
                      {expectations.map((e) => (
                        <div key={e.id} className="rounded-[--radius] border border-border/85 bg-background p-3">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5 shrink-0">
                              Week {e.week_number}
                            </Badge>
                            <div>
                              <p className="text-sm font-semibold">{e.milestone}</p>
                              <p className="text-sm text-muted-foreground">{e.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </ProtocolBlock>
            )}

            {(food.length > 0 || tips.length > 0 || sideEffects.length > 0) && (
              <ProtocolBlock id="guidance" title="Food and practical guidance" subtitle="Daily-use support information designed for fast mobile scanning.">
                <div className="space-y-6">
                  {food.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Food and hydration</p>
                      <div className="mt-2 space-y-3">
                        {(['prefer', 'limit', 'avoid', 'hydrate'] as const)
                          .filter((c) => foodByCategory[c].length > 0)
                          .map((cat) => (
                            <div key={cat}>
                              <p className="mb-1 text-xs font-semibold text-muted-foreground">{FOOD_LABEL[cat]}</p>
                              <div className="flex flex-wrap gap-2">
                                {foodByCategory[cat].map((f) => (
                                  <span key={f.id} className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs">
                                    {f.item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}

                  {tips.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tips to improve adherence</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {tips.map((t) => (
                          <Card key={t.id} className="h-full">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{t.category}</Badge>
                                <CardTitle className="text-sm">{t.title}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm leading-relaxed text-muted-foreground">{t.body_markdown}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {sideEffects.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Common side effects</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sideEffects.map((s) => (
                          <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs">
                            {s.effect}
                            {s.severity ? <span className="text-muted-foreground">({s.severity})</span> : null}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </ProtocolBlock>
            )}

            {injectionGuide.length > 0 && (
              <ProtocolBlock id="injection" title="Injection guide" subtitle="Supplies, step-by-step technique, safety notes, and AU sharps disposal.">
                <div className="space-y-6">
                  {injectionByType.supply.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you need</p>
                      <ul className="mt-2 space-y-2">
                        {injectionByType.supply.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-muted-foreground">◦</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <span className="text-muted-foreground"> — {g.body}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {injectionByType.step.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step-by-step</p>
                      <ol className="mt-2 space-y-2">
                        {injectionByType.step.map((g, i) => (
                          <li key={g.id} className="flex gap-3 text-sm">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <p className="mt-0.5 text-muted-foreground">{g.body}</p>}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {injectionByType.warning.length > 0 && (
                    <div className="rounded-[--radius] border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Important notes</p>
                      <ul className="mt-2 space-y-1.5">
                        {injectionByType.warning.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">!</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <p className="mt-0.5 text-muted-foreground">{g.body}</p>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {injectionByType.disposal.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sharps disposal</p>
                      <ul className="mt-2 space-y-1.5">
                        {injectionByType.disposal.map((g) => (
                          <li key={g.id} className="flex gap-2 text-sm">
                            <span className="mt-0.5 shrink-0 text-muted-foreground">◦</span>
                            <span>
                              <span className="font-medium">{g.title}</span>
                              {g.body && <span className="text-muted-foreground"> — {g.body}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ProtocolBlock>
            )}

            {(drug.contraindications || interactionList.length > 0 || drug.storage_handling || pkEntries.length > 0) && (
              <ProtocolBlock id="safety" title="Safety and interactions" subtitle="Share this information with your prescriber for personalized care decisions.">
                <div className="space-y-4">
                  {drug.contraindications ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Who should not take this</p>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{drug.contraindications}</p>
                    </div>
                  ) : null}
                  {interactionList.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Known interactions</p>
                      <ul className="mt-1.5 space-y-1.5">
                        {interactionList.map((i, idx) => (
                          <li key={idx} className="text-sm">
                            {i.drug ? <span className="font-medium">{i.drug}</span> : null}
                            {i.severity ? <Badge variant="outline" className="ml-2">{i.severity}</Badge> : null}
                            {i.interaction ? <p className="text-muted-foreground">{i.interaction}</p> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {drug.storage_handling ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Storage and handling</p>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{drug.storage_handling}</p>
                    </div>
                  ) : null}
                  {pkEntries.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pharmacokinetics</p>
                      <dl className="mt-1.5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        {pkEntries.map(([k, v]) => (
                          <div key={k}>
                            <dt className="text-xs font-semibold text-muted-foreground">{PK_LABEL[k] ?? k.replace(/_/g, ' ')}</dt>
                            <dd className="text-sm">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </div>
              </ProtocolBlock>
            )}

            {studies.length > 0 ? (
              <ProtocolBlock id="evidence" title="Research evidence" subtitle="Published studies connected to this peptide with dosage and outcomes context.">
                <div className="space-y-3">
                  {studies.map((s) => {
                    const meta = [
                      STUDY_TYPE_LABEL[s.study_type] ?? s.study_type,
                      s.publication_date ? new Date(s.publication_date).getFullYear() : null,
                      s.journal,
                      s.sample_size != null ? `n=${s.sample_size}` : null,
                      s.population,
                    ].filter(Boolean);
                    const studyDosages = dosagesByStudy[s.id] ?? [];
                    const studyOutcomes = outcomesByStudy[s.id] ?? [];
                    const citation = s.doi ? `https://doi.org/${s.doi}` : s.source_url;
                    return (
                      <Card key={s.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm leading-snug">{s.title}</CardTitle>
                          {meta.length > 0 ? <p className="text-xs text-muted-foreground">{meta.join(' · ')}</p> : null}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {s.abstract ? <p className="text-sm leading-relaxed text-muted-foreground">{s.abstract}</p> : null}
                          {studyOutcomes.length > 0 ? (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reported outcomes</p>
                              <ul className="mt-1 list-disc space-y-1 pl-5">
                                {studyOutcomes.map((o) => (
                                  <li key={o.id} className="text-sm">
                                    {o.outcome_type ? <span className="text-muted-foreground">{o.outcome_type}: </span> : null}
                                    {o.description}
                                    {o.significance ? <span className="text-muted-foreground"> ({o.significance})</span> : null}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {studyDosages.length > 0 ? (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reported dosage</p>
                              <ul className="mt-1 list-disc space-y-1 pl-5">
                                {studyDosages.map((d) => {
                                  const parts = [
                                    d.dosage_value != null && d.dosage_unit ? `${d.dosage_value} ${d.dosage_unit}` : null,
                                    d.frequency,
                                    d.duration,
                                  ].filter(Boolean);
                                  return (
                                    <li key={d.id} className="text-sm">
                                      {parts.length > 0 ? parts.join(' · ') : 'See source'}
                                      {d.context_note ? <span className="text-muted-foreground"> — {d.context_note}</span> : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : null}
                          <a href={citation} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline">
                            {s.doi ? `DOI: ${s.doi}` : 'Source'} ↗
                          </a>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ProtocolBlock>
            ) : null}

            <div className="surface-panel rounded-[--radius-xl] p-6 text-center">
              <p className="text-lg font-semibold">Get the full companion experience in Viora</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Week-by-week reminders, food and symptom tracking, and the complete companion guide in one place.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Available on iOS and Android.</p>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TocScrollSpy items={tocItems} />
            </div>
          </aside>
        </div>

        <MobileSectionRail
          items={[
            { id: 'overview', label: 'Top' },
            { id: 'guidance', label: 'Guidance' },
            { id: 'evidence', label: 'Evidence' },
          ]}
          ctaHref="/auth/signup"
          ctaLabel="App signup"
        />
      </div>
    </main>
  );
}
