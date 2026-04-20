import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-6">
          <Link href="/admin" className="text-sm font-semibold hover:text-foreground text-muted-foreground transition-colors">
            Admin
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <Link href="/admin/drugs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Drugs
          </Link>
          <Link href="/" className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Public site
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-8">
        {children}
      </div>
    </div>
  );
}
