import Link from 'next/link';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
  const supabase = createAdminSupabaseClient();

  const [drugsRes, reviewsRes] = await Promise.all([
    supabase
      .from('peptides')
      .select('publication_status', { count: 'exact' }),
    supabase
      .from('content_reviews')
      .select('id, entity_type, action, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const drugs = drugsRes.data ?? [];
  const counts = {
    draft: drugs.filter((d) => d.publication_status === 'draft').length,
    in_review: drugs.filter((d) => d.publication_status === 'in_review').length,
    published: drugs.filter((d) => d.publication_status === 'published').length,
    archived: drugs.filter((d) => d.publication_status === 'archived').length,
  };
  const recentReviews = reviewsRes.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Drug Companion Content Platform</p>
        </div>
        <Button asChild>
          <Link href="/admin/drugs/new">+ New drug</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: 'Draft', count: counts.draft, variant: 'secondary' },
          { label: 'In review', count: counts.in_review, variant: 'warning' },
          { label: 'Published', count: counts.published, variant: 'success' },
          { label: 'Archived', count: counts.archived, variant: 'outline' },
        ] as const).map(({ label, count, variant }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{count}</span>
                <Badge variant={variant} className="mb-1">{label}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/drugs">View all drugs</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/drugs?status=draft">Review drafts ({counts.draft})</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentReviews.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.entity_type}</span>
                    <Badge variant={r.action === 'approved' ? 'success' : r.action === 'rejected' ? 'destructive' : 'secondary'}>
                      {r.action}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
