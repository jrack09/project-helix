import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="container stack" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <h1>Terms of Service</h1>
      <p className="muted">Last updated: April 20, 2026</p>

      <section className="card stack">
        <h2 style={{ marginTop: 0 }}>Nature of the service</h2>
        <p>
          Peptide Intelligence Platform (“PIP”, “we”, “us”) provides structured access to scientific literature and
          research metadata for informational and educational purposes. The service does not provide medical advice,
          diagnoses, treatment plans, prescribing support, or instructions for use of any compound.
        </p>
      </section>

      <section className="card stack">
        <h2 style={{ marginTop: 0 }}>No reliance</h2>
        <p>
          You agree not to rely on PIP as a substitute for professional medical advice. Always consult a qualified
          healthcare provider regarding health decisions. AI-generated summaries and aggregated statistics may be
          incomplete or outdated.
        </p>
      </section>

      <section className="card stack">
        <h2 style={{ marginTop: 0 }}>Subscriptions</h2>
        <p>
          Paid features are billed through our payment provider. Subscription status controls access to certain
          analytical views as described in-product. You are responsible for maintaining accurate billing information.
        </p>
      </section>

      <section className="card stack">
        <h2 style={{ marginTop: 0 }}>Acceptable use</h2>
        <p>
          You may not use PIP to facilitate illegal activity, to obtain prescribing instructions, to promote unsafe use
          of peptides, or to scrape the service in violation of our technical controls. We may suspend access for abuse.
        </p>
      </section>

      <section className="card stack">
        <h2 style={{ marginTop: 0 }}>Contact</h2>
        <p className="muted">For legal notices, use the contact channel published on your deployment.</p>
      </section>

      <p>
        <Link href="/">← Back home</Link>
      </p>
    </main>
  );
}
