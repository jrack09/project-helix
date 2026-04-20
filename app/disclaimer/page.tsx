import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getRegionNotice } from '@/lib/compliance/region-copy';
import { DisclaimerAcceptButton } from './disclaimer-client';

export default async function DisclaimerPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let regionNote: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('region_code').eq('id', user.id).single();
    regionNote = getRegionNotice(profile?.region_code);
  }

  return (
    <main className="container stack" style={{ paddingTop: 64 }}>
      <h1>Platform scope</h1>
      <div className="card stack">
        <p>This platform is provided for educational and research reference purposes only.</p>
        <p>
          It does not provide medical advice, treatment recommendations, dosage instructions, protocol guidance, or
          prescribing support.
        </p>
        <p>
          Any dosage information displayed represents ranges observed in published research and must not be interpreted as
          a recommendation.
        </p>
        <p>Regulatory status and legality vary by region.</p>
        {regionNote && (
          <p className="muted" style={{ borderLeft: '3px solid #e5e7eb', paddingLeft: 12 }}>
            {regionNote}
          </p>
        )}
      </div>
      <DisclaimerAcceptButton />
    </main>
  );
}
