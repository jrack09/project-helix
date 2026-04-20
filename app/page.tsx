import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container stack" style={{ paddingTop: 64 }}>
      <span className="card" style={{ display: 'inline-block', width: 'fit-content' }}>
        Research-grade peptide knowledge platform
      </span>
      <h1 style={{ fontSize: 48, margin: 0 }}>Published peptide research, structured for clarity.</h1>
      <p className="muted" style={{ fontSize: 18 }}>
        Explore mechanisms, observed dosage ranges in studies, evidence strength, and reported adverse events.
        Built for educational and research purposes only.
      </p>
      <div className="row">
        <Link href="/peptides" className="button">
          Browse peptides
        </Link>
        <Link href="/auth/signup" className="button secondary">
          Start free
        </Link>
        <Link href="/disclaimer" className="button secondary">
          Read platform scope
        </Link>
      </div>
    </main>
  );
}
