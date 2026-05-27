'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function DisclaimerAcceptButton() {
  const router = useRouter();

  async function acceptDisclaimer() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    await supabase
      .from('profiles')
      .update({ disclaimer_accepted_at: new Date().toISOString() })
      .eq('id', user.id);

    router.push('/dashboard');
  }

  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      type="button"
      onClick={acceptDisclaimer}
    >
      I understand and want to continue
    </button>
  );
}
