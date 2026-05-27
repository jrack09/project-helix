'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';

const STATUS_VARIANTS = {
  draft: 'secondary',
  in_review: 'warning',
  published: 'success',
  archived: 'outline',
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting started',
  administration: 'Administration',
  nutrition: 'Nutrition',
  side_effects: 'Side effects',
  lifestyle: 'Lifestyle',
  other: 'Other',
};

type Guide = {
  id: string;
  slug: string;
  title: string;
  category: string;
  publication_status: string;
  ordinal: number;
  updated_at: string;
};

export function GuideTableRows({ guides }: { guides: Guide[] }) {
  const router = useRouter();

  return (
    <TableBody>
      {guides.map((g) => (
        <TableRow
          key={g.id}
          className="cursor-pointer"
          onClick={() => router.push(`/admin/guides/${g.id}/edit`)}
        >
          <TableCell>
            <p className="font-medium text-sm">{g.title}</p>
            <p className="text-xs text-muted-foreground">/guides/{g.slug}</p>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {CATEGORY_LABELS[g.category] ?? g.category}
          </TableCell>
          <TableCell>
            <Badge variant={STATUS_VARIANTS[g.publication_status as keyof typeof STATUS_VARIANTS] ?? 'secondary'}>
              {g.publication_status}
            </Badge>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {new Date(g.updated_at).toLocaleDateString()}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
