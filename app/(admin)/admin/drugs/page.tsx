import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const STATUS_VARIANTS = {
  draft: 'secondary',
  in_review: 'warning',
  published: 'success',
  archived: 'outline',
} as const;

export default async function AdminDrugsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('peptides')
    .select('id, slug, name, generic_name, drug_class, publication_status, evidence_score, updated_at')
    .order('name', { ascending: true });

  if (status && ['draft', 'in_review', 'published', 'archived'].includes(status)) {
    query = query.eq('publication_status', status as 'draft' | 'in_review' | 'published' | 'archived');
  }
  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data: drugs } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drugs</h1>
        <Button asChild>
          <Link href="/admin/drugs/new">+ New drug</Link>
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['', 'draft', 'in_review', 'published', 'archived'] as const).map((s) => (
          <Link
            key={s || 'all'}
            href={s ? `/admin/drugs?status=${s}` : '/admin/drugs'}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              (status ?? '') === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      {!drugs?.length ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No drugs found.{' '}
          <Link href="/admin/drugs/new" className="underline">
            Add the first one.
          </Link>
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {drugs.map((drug) => (
              <TableRow key={drug.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{drug.name}</p>
                    {drug.generic_name && (
                      <p className="text-xs text-muted-foreground">{drug.generic_name}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {drug.drug_class ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[drug.publication_status as keyof typeof STATUS_VARIANTS] ?? 'secondary'}>
                    {drug.publication_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {drug.evidence_score !== null ? `${drug.evidence_score}/100` : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(drug.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/drugs/${drug.id}/edit`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
