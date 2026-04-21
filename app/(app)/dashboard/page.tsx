import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SubscribeButton from '@/components/billing/subscribe-button';
import CreateApiKeySection from '@/components/api-keys/create-api-key-section';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('disclaimer_accepted_at, role')
    .eq('id', user.id)
    .single();

  if (!profile?.disclaimer_accepted_at) {
    redirect('/disclaimer');
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plan_code, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  const isStaff = profile?.role === 'editor' || profile?.role === 'admin';

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {isStaff && (
        <div className="rounded-lg border border-border bg-muted/40 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">You have {profile?.role} access</p>
            <p className="text-xs text-muted-foreground mt-0.5">Author and publish drug companion content from the admin panel.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin">Go to Admin</Link>
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border p-6 space-y-4">
        <p className="text-sm">Logged in as <strong>{user.email}</strong></p>
        <p className="text-sm text-muted-foreground">Subscription status: {subscription?.status ?? 'none'}</p>
        <p className="text-sm text-muted-foreground">Plan: {subscription?.plan_code ?? 'free'}</p>
        <CreateApiKeySection />
        <SubscribeButton />
      </div>
    </main>
  );
}
