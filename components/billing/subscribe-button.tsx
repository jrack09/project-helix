'use client';

import { Button } from '@/components/ui/button';

export default function SubscribeButton() {
  async function startCheckout() {
    const response = await fetch('/api/stripe/checkout', { method: 'POST' });
    const payload = await response.json();

    if (!response.ok) {
      alert(payload.error || 'Failed to start checkout');
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <Button onClick={startCheckout}>
      Upgrade to Pro
    </Button>
  );
}
