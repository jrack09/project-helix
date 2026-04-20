import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRegionNotice } from '@/lib/compliance/region-copy';

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

  const [expectationsRes, foodRes, tipsRes, sideEffectsRes, studyLinksRes, dosagesRes, outcomesRes] = await Promise.all([
    supabase.from('drug_expectations').select('id, week_number, milestone, description, is_common').eq('drug_id', drug.id).order('week_number').limit(6),
    supabase.from('drug_food_guidance').select('id, category, item, rationale').eq('drug_id', drug.id).order('ordinal').limit(12),
    supabase.from('drug_tips').select('id, category, title, body_markdown').eq('drug_id', drug.id).order('ordinal').limit(6),
    supabase.from('side_effects').select('id, effect, severity, frequency').eq('peptide_id', drug.id).limit(10),
    supabase.from('study_peptides').select('study_id').eq('peptide_id', drug.id),
    supabase.from('study_dosages').select('id, study_id, dosage_value, dosage_unit, frequency, duration, context_note').eq('peptide_id', drug.id),
    supabase.from('study_outcomes').select('id, study_id, outcome_type, description, significance').eq('peptide_id', drug.id),
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

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">
      {/* Back nav */}
      <Link href="/peptides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← All drugs
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{drug.name}</h1>
          {drug.prescription_required && <Badge>Prescription only</Badge>}
          {drug.drug_class && <Badge variant="secondary">{drug.drug_class}</Badge>}
        </div>
        {brands.length > 0 && (
          <p className="text-sm text-muted-foreground">Also known as: {brands.join(', ')}</p>
        )}
        {drug.short_description && (
          <p className="text-base text-muted-foreground leading-relaxed">{drug.short_description}</p>
        )}
      </div>

      {/* Disclaimer */}
      <Alert variant="info">
        <AlertDescription className="text-sm">
          <strong>General information only — not medical advice.</strong> Always follow your prescriber's instructions.
          {regionNote && <> {regionNote}</>}
        </AlertDescription>
      </Alert>

      {/* Mechanism */}
      {drug.mechanism_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{drug.mechanism_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Dosing schedule (descriptive) */}
      {drug.typical_dosing_schedule && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Typical dosing schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{drug.typical_dosing_schedule}</p>
            <p className="text-xs text-muted-foreground mt-3">
              Dosing is always prescribed and managed by your healthcare provider. This is general context, not a prescription.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Weekly expectations */}
      {expectations.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What to expect</h2>
          <div className="space-y-3">
            {expectations.map((e) => (
              <div key={e.id} className="flex gap-4 items-start">
                <Badge variant="outline" className="shrink-0 mt-0.5">Week {e.week_number}</Badge>
                <div>
                  <p className="text-sm font-medium">{e.milestone}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Food guidance */}
      {food.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Food & nutrition guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['prefer', 'limit', 'avoid', 'hydrate'] as const).filter((c) => foodByCategory[c].length > 0).map((cat) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{FOOD_LABEL[cat]}</p>
                <div className="flex flex-wrap gap-2">
                  {foodByCategory[cat].map((f) => (
                    <span key={f.id} className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs">
                      {f.item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-2">
              General dietary suggestions — not a prescription diet plan. Consult a dietitian for individual advice.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Tips for getting the most from your treatment</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {tips.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{t.category}</Badge>
                    <CardTitle className="text-sm">{t.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.body_markdown}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Side effects */}
      {sideEffects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Common side effects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sideEffects.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs">
                  {s.effect}
                  {s.severity && <span className="text-muted-foreground">({s.severity})</span>}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              If you experience severe or persistent side effects, contact your prescriber or seek medical attention immediately.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contraindications */}
      {drug.contraindications && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who should not take this</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm leading-relaxed whitespace-pre-line">{drug.contraindications}</p>
            <p className="text-xs text-muted-foreground">
              This is a general list — always disclose your full medical history to your prescriber so they can determine whether this medicine is appropriate for you.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Drug interactions */}
      {interactionList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Known drug interactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {interactionList.map((i, idx) => (
                <li key={idx} className="text-sm">
                  {i.drug && <span className="font-medium">{i.drug}</span>}
                  {i.severity && (
                    <Badge variant="outline" className="ml-2 text-xs">{i.severity}</Badge>
                  )}
                  {i.interaction && (
                    <p className="text-sm text-muted-foreground mt-0.5">{i.interaction}</p>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Give your prescriber a complete list of every prescription, over-the-counter, supplement, and herbal product you take.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Storage & handling */}
      {drug.storage_handling && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Storage & handling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-line">{drug.storage_handling}</p>
          </CardContent>
        </Card>
      )}

      {/* Pharmacokinetics */}
      {pkEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pharmacokinetics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {pkEntries.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-muted-foreground uppercase">{PK_LABEL[k] ?? k.replace(/_/g, ' ')}</dt>
                  <dd className="text-sm mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              Values are drawn from published pharmacology — individual absorption and clearance vary.
            </p>
          </CardContent>
        </Card>
      )}

      {/* What the research shows */}
      {studies.length > 0 && (
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">What the research shows</h2>
            <p className="text-sm text-muted-foreground">
              Indexed publications tied to this peptide. Metadata is for research navigation — not a prescription or clinical recommendation.
            </p>
          </div>
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
                    {meta.length > 0 && (
                      <p className="text-xs text-muted-foreground">{meta.join(' · ')}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {s.abstract && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.abstract}</p>
                    )}
                    {studyOutcomes.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Reported outcomes</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {studyOutcomes.map((o) => (
                            <li key={o.id} className="text-sm">
                              {o.outcome_type && <span className="text-muted-foreground">{o.outcome_type}: </span>}
                              {o.description}
                              {o.significance && <span className="text-muted-foreground"> ({o.significance})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {studyDosages.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Dosage reported in study</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {studyDosages.map((d) => {
                            const parts = [
                              d.dosage_value != null && d.dosage_unit ? `${d.dosage_value} ${d.dosage_unit}` : null,
                              d.frequency,
                              d.duration,
                            ].filter(Boolean);
                            return (
                              <li key={d.id} className="text-sm">
                                {parts.length > 0 ? parts.join(' · ') : 'See source'}
                                {d.context_note && <span className="text-muted-foreground"> — {d.context_note}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 pt-1 text-xs">
                      <a
                        href={citation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {s.doi ? `DOI: ${s.doi}` : 'Source'} ↗
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Reported study dosages describe what was administered in published trials. They are not dosing guidance for you — your prescriber determines appropriate dosing for your situation.
          </p>
        </section>
      )}

      {/* App CTA */}
      <div className="rounded-[--radius] border border-border bg-muted/30 p-6 text-center space-y-3">
        <p className="font-semibold">Get the full companion experience in Viora</p>
        <p className="text-sm text-muted-foreground">
          Week-by-week reminders, food & symptom tracking, and the complete companion guide — all in the Viora app.
        </p>
        <p className="text-xs text-muted-foreground">Available on iOS and Android.</p>
      </div>
    </main>
  );
}
