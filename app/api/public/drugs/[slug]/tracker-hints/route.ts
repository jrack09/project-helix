import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { envelope } from '@/lib/api/envelope';
import { globalDisclaimer } from '@/lib/compliance/disclaimers';
import { resolveKey, handleOptions, corsHeaders } from '@/lib/api/public-auth';

export type Biomarker =
  | 'weight_kg'
  | 'waist_cm'
  | 'nausea_0_10'
  | 'appetite_0_10'
  | 'energy_0_10'
  | 'hydration_l'
  | 'blood_glucose_mmol'
  | 'injection_site_reaction';

type TrackerHints = {
  biomarkers: Biomarker[];
  cadence: 'daily' | 'weekly';
  notes: string | null;
};

const DRUG_TRACKER_HINTS: Record<string, TrackerHints> = {
  default: {
    biomarkers: ['weight_kg', 'waist_cm', 'appetite_0_10', 'nausea_0_10', 'energy_0_10', 'hydration_l'],
    cadence: 'weekly',
    notes: null,
  },
  'semaglutide-wegovy': {
    biomarkers: ['weight_kg', 'waist_cm', 'appetite_0_10', 'nausea_0_10', 'energy_0_10', 'hydration_l', 'injection_site_reaction'],
    cadence: 'weekly',
    notes: 'Weight and waist measurements are most meaningful when taken at the same time each week.',
  },
  'semaglutide-ozempic': {
    biomarkers: ['weight_kg', 'waist_cm', 'blood_glucose_mmol', 'appetite_0_10', 'nausea_0_10', 'injection_site_reaction'],
    cadence: 'weekly',
    notes: 'Blood glucose monitoring frequency should be per your prescriber\'s instructions.',
  },
  'tirzepatide-mounjaro': {
    biomarkers: ['weight_kg', 'waist_cm', 'blood_glucose_mmol', 'appetite_0_10', 'nausea_0_10', 'injection_site_reaction'],
    cadence: 'weekly',
    notes: 'Blood glucose monitoring frequency should be per your prescriber\'s instructions.',
  },
  'tirzepatide-zepbound': {
    biomarkers: ['weight_kg', 'waist_cm', 'appetite_0_10', 'nausea_0_10', 'energy_0_10', 'injection_site_reaction'],
    cadence: 'weekly',
    notes: null,
  },
  'liraglutide-saxenda': {
    biomarkers: ['weight_kg', 'waist_cm', 'appetite_0_10', 'nausea_0_10', 'energy_0_10', 'hydration_l', 'injection_site_reaction'],
    cadence: 'daily',
    notes: 'Saxenda is a daily injection — daily tracking aligns with your dosing schedule.',
  },
};

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  const auth = await resolveKey(request);
  if (auth.error) return auth.error;

  const admin = createAdminSupabaseClient();
  const { data: drug } = await admin
    .from('peptides')
    .select('id, slug')
    .eq('slug', slug)
    .eq('publication_status', 'published')
    .eq('is_visible', true)
    .maybeSingle();

  if (!drug) {
    return NextResponse.json({ error: 'Drug not found.' }, { status: 404, headers: cors });
  }

  const hints = DRUG_TRACKER_HINTS[slug] ?? DRUG_TRACKER_HINTS.default;

  return NextResponse.json(
    envelope({ tracker_hints: hints }, globalDisclaimer()),
    { headers: cors },
  );
}
