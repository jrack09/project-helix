import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SubscribeButton from '@/components/billing/subscribe-button';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('disclaimer_accepted_at')
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

  return (
    <main className="container stack" style={{ paddingTop: 48 }}>
      <h1>Dashboard</h1>
      <div className="card stack">
        <p>Logged in as <strong>{user.email}</strong></p>
        <p className="muted">Subscription status: {subscription?.status ?? 'none'}</p>
        <p className="muted">Plan: {subscription?.plan_code ?? 'free'}</p>
        <p className="muted">
          AI literature summaries use an active subscription. Issue an API key via{' '}
          <code style={{ fontSize: 13 }}>POST /api/api-keys</code> (authenticated) for programmatic access; keys inherit
          your subscription for premium JSON fields.
        </p>
        <SubscribeButton />
      </div>
    </main>
  );
}
