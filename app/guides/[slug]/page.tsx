import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ReactMarkdown from 'react-markdown';

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting started',
  administration: 'Administration',
  nutrition: 'Nutrition',
  side_effects: 'Side effects',
  lifestyle: 'Lifestyle',
  other: 'Other',
};

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: guide } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', slug)
    .eq('publication_status', 'published')
    .maybeSingle();

  if (!guide) notFound();

  return (
    <main className="section-shell max-w-3xl py-10 space-y-8">
      <div className="surface-panel rounded-[--radius-xl] p-6 sm:p-8 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {CATEGORY_LABELS[guide.category] ?? guide.category}
        </p>
        {guide.cover_emoji && <span className="text-4xl">{guide.cover_emoji}</span>}
        <h1 className="text-3xl font-bold tracking-tight">{guide.title}</h1>
        {guide.subtitle && (
          <p className="text-lg text-muted-foreground">{guide.subtitle}</p>
        )}
      </div>

      <div className="rounded-[--radius-lg] border border-border bg-card p-5 sm:p-6">
        <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-sm [&_strong]:font-semibold">
        <ReactMarkdown>{guide.body_markdown}</ReactMarkdown>
        </div>
      </div>

      <div className="border-t border-border pt-6 space-y-2">
        <p className="text-xs text-muted-foreground">
          General lifestyle information only — not medical advice. Always follow your prescriber&apos;s instructions.
        </p>
        <p className="text-sm">
          <Link href="/guides" className="font-medium hover:underline">← All guides</Link>
        </p>
      </div>
    </main>
  );
}
