import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, BILLING_PLAN_MAP } from '@/lib/stripe/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;

    if (userId && subscriptionId) {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      const firstItem = subscription.items.data[0];
      const priceId = firstItem?.price?.id ?? '';

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
        stripe_subscription_id: subscription.id,
        plan_code: BILLING_PLAN_MAP[priceId] || 'unknown',
        status: subscription.status,
        current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' });
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const firstItem = subscription.items.data[0];
    const priceId = firstItem?.price?.id ?? '';

    await supabase
      .from('subscriptions')
      .update({
        plan_code: BILLING_PLAN_MAP[priceId] || 'unknown',
        status: subscription.status,
        current_period_end: firstItem?.current_period_end
          ? new Date(firstItem.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  return NextResponse.json({ received: true });
}
