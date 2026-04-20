import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = {
  title: 'Drug companions — PIP',
  description: 'Research-backed companion guides for GLP-1s and weight-management medications.',
};

const CLASS_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
  'GLP-1 receptor agonist': 'default',
  'GLP-1 / GIP dual receptor agonist': 'default',
};

export default async function DrugsIndexPage() {
  const supabase = await createServerSupabaseClient();
  const { data: drugs } = await supabase
    .from('peptides')
    .select('id, slug, name, generic_name, brand_names, drug_class, short_description, prescription_required, publication_status')
    .eq('is_visible', true)
    .eq('publication_status', 'published')
    .order('name');

  const prescribed = (drugs ?? []).filter((d) => d.prescription_required);
  const investigational = (drugs ?? []).filter((d) => !d.prescription_required);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-12">
      <div className="space-y-3 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Drug companion guides</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          General lifestyle information for people starting GLP-1s and related weight-management medications.
          Not medical advice — always follow your prescriber's instructions.
        </p>
      </div>

      {prescribed.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Prescription medications</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {prescribed.map((drug) => {
              const brands = Array.isArray(drug.brand_names) ? (drug.brand_names as string[]) : [];
              return (
                <Link key={drug.id} href={`/peptides/${drug.slug}`}>
                  <Card className="h-full hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{drug.name}</CardTitle>
                        {drug.drug_class && (
                          <Badge variant={CLASS_BADGE[drug.drug_class] ?? 'secondary'} className="shrink-0 text-xs">
                            {drug.drug_class.replace('receptor agonist', 'RA')}
                          </Badge>
                        )}
                      </div>
                      {brands.length > 0 && (
                        <CardDescription>{brands.join(', ')}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {drug.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{drug.short_description}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {investigational.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Investigational peptides</h2>
          <p className="text-sm text-muted-foreground">Not approved for human therapeutic use. Research context only.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {investigational.map((drug) => (
              <Link key={drug.id} href={`/peptides/${drug.slug}`}>
                <Card className="h-full hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{drug.name}</CardTitle>
                    <CardDescription>{drug.drug_class}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {drug.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{drug.short_description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(!drugs || drugs.length === 0) && (
        <p className="text-muted-foreground">No drug companions published yet.</p>
      )}
    </main>
  );
}
