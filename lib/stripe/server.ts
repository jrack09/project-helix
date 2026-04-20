import Stripe from 'stripe';

let stripeSingleton: Stripe | null = null;

/** Avoid instantiating Stripe at module load so `next build` succeeds without secrets. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export const BILLING_PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY || '']: 'pro_monthly',
};
