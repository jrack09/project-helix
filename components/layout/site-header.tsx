import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function SiteHeader({ email, role }: { email?: string | null; role?: string | null }) {
  const isStaff = role === 'editor' || role === 'admin';
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <nav className="section-shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">V</span>
          <span className="text-sm font-bold tracking-tight">Viora Companion</span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <Link href="/peptides" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Drugs</Link>
          <Link href="/guides" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Guides</Link>
          <Link href="/studies" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Studies</Link>
          {email ? (
            <>
              {isStaff ? <Link href="/admin" className="text-sm font-medium hover:underline">Admin</Link> : null}
              <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
              <span className="text-xs text-muted-foreground">{email}</span>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>
              <Button asChild size="sm"><Link href="/auth/signup">Start free</Link></Button>
            </>
          )}
        </div>

        <details className="md:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-border px-3 py-1.5 text-sm font-medium">
            Menu
          </summary>
          <div className="absolute right-4 top-14 w-52 rounded-[--radius-lg] border border-border bg-card p-3 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/peptides" className="rounded px-2 py-1.5 hover:bg-accent">Drugs</Link>
              <Link href="/guides" className="rounded px-2 py-1.5 hover:bg-accent">Guides</Link>
              <Link href="/studies" className="rounded px-2 py-1.5 hover:bg-accent">Studies</Link>
              {email ? (
                <>
                  {isStaff ? <Link href="/admin" className="rounded px-2 py-1.5 hover:bg-accent">Admin</Link> : null}
                  <Link href="/dashboard" className="rounded px-2 py-1.5 hover:bg-accent">Dashboard</Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="rounded px-2 py-1.5 hover:bg-accent">Sign in</Link>
                  <Button asChild size="sm" className="mt-1 w-full"><Link href="/auth/signup">Start free</Link></Button>
                </>
              )}
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
