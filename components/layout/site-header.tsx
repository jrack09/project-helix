import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function SiteHeader({ email, role }: { email?: string | null; role?: string | null }) {
  const isStaff = role === 'editor' || role === 'admin';
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-bold tracking-tight">
          PIP · Drug Companion
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/peptides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Drugs
          </Link>
          {email ? (
            <>
              {isStaff && (
                <Link href="/admin" className="text-sm font-medium text-foreground hover:underline transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <span className="text-xs text-muted-foreground">{email}</span>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
