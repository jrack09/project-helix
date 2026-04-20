import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-4">
        <div className="flex flex-wrap gap-6">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/disclaimer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Platform scope
          </Link>
          <Link href="/peptides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Drug index
          </Link>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          General lifestyle information only — not medical advice. Always follow your prescriber's instructions.
          Regulatory status and prescription requirements vary by jurisdiction.
        </p>
      </div>
    </footer>
  );
}
