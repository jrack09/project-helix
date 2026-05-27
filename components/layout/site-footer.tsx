import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/25">
      <div className="section-shell py-10 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Explore</p>
            <Link href="/peptides" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Drug index</Link>
            <Link href="/studies" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Study explorer</Link>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Learn</p>
            <Link href="/guides" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Essential guides</Link>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Company</p>
            <Link href="/disclaimer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Platform scope</Link>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Legal</p>
            <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of service</Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          General lifestyle information only — not medical advice. Always follow your prescriber's instructions.
          Regulatory status and prescription requirements vary by jurisdiction.
        </p>
      </div>
    </footer>
  );
}
