import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 space-y-10">
      <div className="space-y-6 max-w-3xl">
        <div className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Lifestyle guidance · Not medical advice
        </div>
        <h1 className="text-5xl font-bold tracking-tight leading-tight">
          Your companion for GLP-1s and weight-management medications
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Week-by-week expectations, food guidance, coping tips for side effects, and tracking —
          all in one place. Built for people who want to get the most from their treatment.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/peptides">Browse drug companions</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/signup">Start free</Link>
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 pt-6">
        {[
          { title: 'What to expect', body: 'Week-by-week milestones so you\'re never caught off guard by what\'s normal.' },
          { title: 'Food & hydration', body: 'What to eat more of, what to limit, and how to stay hydrated to reduce side effects.' },
          { title: 'Side-effect coping', body: 'Practical strategies for common issues like nausea, fatigue, and injection-site reactions.' },
        ].map((f) => (
          <div key={f.title} className="rounded-[--radius] border border-border p-5 space-y-2">
            <p className="font-semibold text-sm">{f.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        General lifestyle information only — not medical advice. Always follow your prescriber's instructions.
        Regulatory status and prescription requirements vary by jurisdiction.
      </p>
    </main>
  );
}
