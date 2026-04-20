import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting started',
  administration: 'Administration',
  nutrition: 'Nutrition',
  side_effects: 'Side effects',
  lifestyle: 'Lifestyle',
  other: 'Other',
};

export default async function GuidesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: guides } = await supabase
    .from('guides')
    .select('slug, title, subtitle, category, cover_emoji')
    .eq('publication_status', 'published')
    .order('ordinal', { ascending: true })
    .order('title', { ascending: true });

  const byCategory = (guides ?? []).reduce<Record<string, typeof guides>>((acc, g) => {
    const cat = g!.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(g);
    return acc;
  }, {});

  const categoryOrder = ['getting_started', 'administration', 'nutrition', 'side_effects', 'lifestyle', 'other'];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Essential Guides</h1>
        <p className="text-muted-foreground max-w-2xl">
          New to GLP-1 medications? Start here. These guides cover what you need to know to get the most from your treatment.
        </p>
      </div>

      {guides?.length === 0 && (
        <p className="text-sm text-muted-foreground">No guides published yet.</p>
      )}

      {categoryOrder
        .filter((cat) => byCategory[cat]?.length)
        .map((cat) => (
          <section key={cat} className="space-y-4">
            <h2 className="text-lg font-semibold">{CATEGORY_LABELS[cat]}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byCategory[cat]!.map((g) => (
                <Link
                  key={g!.slug}
                  href={`/guides/${g!.slug}`}
                  className="group rounded-lg border border-border p-5 space-y-2 hover:border-foreground/30 transition-colors"
                >
                  {g!.cover_emoji && (
                    <span className="text-2xl">{g!.cover_emoji}</span>
                  )}
                  <p className="font-semibold text-sm group-hover:underline">{g!.title}</p>
                  {g!.subtitle && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{g!.subtitle}</p>
                  )}
                  <p className="text-xs font-medium text-muted-foreground">Read the guide →</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

      <p className="text-xs text-muted-foreground max-w-2xl border-t border-border pt-6">
        General lifestyle information only — not medical advice. Always follow your prescriber&apos;s instructions.
      </p>
    </main>
  );
}
