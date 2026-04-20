import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main>
      <section className="section-shell section-gap">
        <div className="surface-panel fade-up rounded-[--radius-xl] p-6 sm:p-10">
          <div className="space-y-6 max-w-3xl fade-up fade-delay-1">
            <p className="eyebrow">Lifestyle guidance · Not medical advice</p>
            <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl">
              Your protocol-style companion for GLP-1 and weight-management medications
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed sm:text-lg max-w-2xl">
              Quickly understand what to expect, what to track, and how to stay consistent week to week.
              Designed for mobile-first use inside your Viora routine.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg">
                <Link href="/peptides">Browse drug companions</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/signup">Start free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell pb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Quickstart highlights', body: 'Scan high-signal guidance in seconds before diving into details.' },
            { title: 'Week-by-week flow', body: 'Clear expectation blocks that help reduce uncertainty and improve adherence.' },
            { title: 'Evidence and safety context', body: 'Research-linked detail plus practical caution language throughout.' },
          ].map((f) => (
            <div key={f.title} className="motion-lift fade-up fade-delay-2 rounded-[--radius-lg] border border-border bg-card p-5">
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell section-gap">
        <div className="space-y-3">
          <p className="eyebrow">Start here</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Choose your pathway</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: '/peptides', title: 'Drug companions', body: 'Protocol-style long-form guidance for each medication.' },
            { href: '/guides', title: 'Essential guides', body: 'Foundational articles on dosing context, side effects, and habits.' },
            { href: '/studies', title: 'Study explorer', body: 'Scan indexed publication summaries and source links.' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group motion-lift fade-up fade-delay-3 rounded-[--radius-lg] border border-border bg-card p-5 hover:border-primary/40">
              <p className="text-base font-semibold">{item.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              <p className="mt-3 text-xs font-medium text-primary group-hover:underline">Open section →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell pb-14">
        <div className="rounded-[--radius-xl] border border-border bg-muted/35 p-6 sm:p-8 text-center space-y-3">
          <p className="text-lg font-semibold">Built to support Viora app users</p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Use the site for clear guidance and the app for reminders, progress tracking, and day-to-day adherence.
          </p>
          <p className="text-xs text-muted-foreground">
            General lifestyle information only — not medical advice.
          </p>
        </div>
      </section>
    </main>
  );
}
