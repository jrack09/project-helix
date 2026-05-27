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

type Drug = {
  id: string;
  slug: string;
  name: string;
  generic_name: string | null;
  drug_class: string | null;
  publication_status: string;
  evidence_score: number | null;
  updated_at: string;
};

export function DrugTableRows({ drugs }: { drugs: Drug[] }) {
  const router = useRouter();

  return (
    <TableBody>
      {drugs.map((drug) => (
        <TableRow
          key={drug.id}
          className="cursor-pointer"
          onClick={() => router.push(`/admin/drugs/${drug.id}/edit`)}
        >
          <TableCell>
            <p className="font-medium text-sm">{drug.name}</p>
            {drug.generic_name && (
              <p className="text-xs text-muted-foreground">{drug.generic_name}</p>
            )}
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
        </TableRow>
      ))}
    </TableBody>
  );
}
