import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { DrugEditTabs } from './drug-edit-tabs';
import { GenerateContentButton } from './generate-button';
import { GeneratePipExtensionsButton } from './generate-pip-button';

export default async function DrugEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const [
    drugRes, expectationsRes, foodRes, tipsRes,
    warningsRes, injectionSitesRes, sideEffectWindowsRes, oralAdminRes, sideEffectsRes,
  ] = await Promise.all([
    supabase.from('peptides').select('*').eq('id', id).maybeSingle(),
    supabase.from('drug_expectations').select('*').eq('drug_id', id).order('week_number'),
    supabase.from('drug_food_guidance').select('*').eq('drug_id', id).order('ordinal'),
    supabase.from('drug_tips').select('*').eq('drug_id', id).order('ordinal'),
    supabase.from('drug_warnings').select('*').eq('drug_id', id).order('ordinal'),
    supabase.from('drug_injection_sites').select('*').eq('drug_id', id).order('ordinal'),
    supabase.from('drug_side_effect_windows').select('*').eq('drug_id', id).order('ordinal'),
    supabase.from('drug_oral_administration').select('*').eq('drug_id', id).order('ordinal'),
    supabase.from('side_effects').select('id, effect').eq('peptide_id', id),
  ]);

  const hasContent =
    (expectationsRes.data?.length ?? 0) > 0 ||
    (foodRes.data?.length ?? 0) > 0 ||
    (tipsRes.data?.length ?? 0) > 0;

  if (!drugRes.data) notFound();
  const drug = drugRes.data;

  const STATUS_VARIANT = {
    draft: 'secondary',
    in_review: 'warning',
    published: 'success',
    archived: 'outline',
  } as const;

  return (
    <div className="space-y-6">
      <Link href="/admin/drugs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to drugs
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{drug.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">/admin/drugs/{id}/edit</p>
        </div>
        <Badge variant={STATUS_VARIANT[drug.publication_status as keyof typeof STATUS_VARIANT] ?? 'secondary'}>
          {drug.publication_status}
        </Badge>
      </div>

      <GenerateContentButton drugId={id} hasContent={hasContent} />
      <GeneratePipExtensionsButton drugId={id} />

      <DrugEditTabs
        drug={drug}
        expectations={expectationsRes.data ?? []}
        foodGuidance={foodRes.data ?? []}
        tips={tipsRes.data ?? []}
        warnings={warningsRes.data ?? []}
        injectionSites={injectionSitesRes.data ?? []}
        sideEffectWindows={sideEffectWindowsRes.data ?? []}
        oralAdministration={oralAdminRes.data ?? []}
        sideEffects={sideEffectsRes.data ?? []}
      />
    </div>
  );
}
