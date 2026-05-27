import Link from 'next/link';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/button';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DrugTableRows } from './drug-table-rows';

export default async function AdminDrugsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const supabase = createAdminSupabaseClient();

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
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/drugs/coverage">Coverage</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/drugs/batch-pip">Batch PIP</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/drugs/new">+ New drug</Link>
          </Button>
        </div>
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
            </TableRow>
          </TableHeader>
          <DrugTableRows drugs={drugs} />
        </Table>
      )}
    </div>
  );
}
