import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { GuideEditForm } from './guide-edit-form';

const STATUS_VARIANT = {
  draft: 'secondary',
  in_review: 'warning',
  published: 'success',
  archived: 'outline',
} as const;

export default async function GuideEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: guide } = await supabase.from('guides').select('*').eq('id', id).maybeSingle();
  if (!guide) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/guides" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to guides
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{guide.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">/guides/{guide.slug}</p>
        </div>
        <Badge variant={STATUS_VARIANT[guide.publication_status as keyof typeof STATUS_VARIANT] ?? 'secondary'}>
          {guide.publication_status}
        </Badge>
      </div>

      <GuideEditForm guide={guide} />
    </div>
  );
}
