import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export const metadata: Metadata = {
  title: 'Peptide Intelligence Platform',
  description: 'Research-grade peptide knowledge and literature summaries.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    role = profile?.role ?? null;
  }

  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen">
        <SiteHeader email={user?.email ?? null} role={role} />
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
