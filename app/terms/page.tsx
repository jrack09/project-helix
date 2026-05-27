import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 20, 2026</p>
      </div>

      <section className="rounded-lg border border-border p-6 space-y-3">
        <h2 className="text-base font-semibold">Nature of the service</h2>
        <p className="text-sm leading-relaxed">
          Peptide Intelligence Platform (&ldquo;PIP&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) provides structured access to scientific literature and
          research metadata for informational and educational purposes. The service does not provide medical advice,
          diagnoses, treatment plans, prescribing support, or instructions for use of any compound.
        </p>
      </section>

      <section className="rounded-lg border border-border p-6 space-y-3">
        <h2 className="text-base font-semibold">No reliance</h2>
        <p className="text-sm leading-relaxed">
          You agree not to rely on PIP as a substitute for professional medical advice. Always consult a qualified
          healthcare provider regarding health decisions. AI-generated summaries and aggregated statistics may be
          incomplete or outdated.
        </p>
      </section>

      <section className="rounded-lg border border-border p-6 space-y-3">
        <h2 className="text-base font-semibold">Subscriptions</h2>
        <p className="text-sm leading-relaxed">
          Paid features are billed through our payment provider. Subscription status controls access to certain
          analytical views as described in-product. You are responsible for maintaining accurate billing information.
        </p>
      </section>

      <section className="rounded-lg border border-border p-6 space-y-3">
        <h2 className="text-base font-semibold">Acceptable use</h2>
        <p className="text-sm leading-relaxed">
          You may not use PIP to facilitate illegal activity, to obtain prescribing instructions, to promote unsafe use
          of peptides, or to scrape the service in violation of our technical controls. We may suspend access for abuse.
        </p>
      </section>

      <section className="rounded-lg border border-border p-6 space-y-3">
        <h2 className="text-base font-semibold">Contact</h2>
        <p className="text-sm text-muted-foreground">For legal notices, use the contact channel published on your deployment.</p>
      </section>

      <p className="text-sm">
        <Link href="/" className="font-medium hover:underline">← Back home</Link>
      </p>
    </main>
  );
}
