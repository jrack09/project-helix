import Link from 'next/link';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/button';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GuideTableRows } from './guide-table-rows';

export default async function AdminGuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from('guides')
    .select('id, slug, title, category, publication_status, ordinal, updated_at')
    .order('ordinal', { ascending: true })
    .order('title', { ascending: true });

  if (status && ['draft', 'in_review', 'published', 'archived'].includes(status)) {
    query = query.eq('publication_status', status as 'draft' | 'in_review' | 'published' | 'archived');
  }

  const { data: guides } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guides</h1>
        <Button asChild>
          <Link href="/admin/guides/new">+ New guide</Link>
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['', 'draft', 'in_review', 'published', 'archived'] as const).map((s) => (
          <Link
            key={s || 'all'}
            href={s ? `/admin/guides?status=${s}` : '/admin/guides'}
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

      {!guides?.length ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No guides yet.{' '}
          <Link href="/admin/guides/new" className="underline">Add the first one.</Link>
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <GuideTableRows guides={guides} />
        </Table>
      )}
    </div>
  );
}
