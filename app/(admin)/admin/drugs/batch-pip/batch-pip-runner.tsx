'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { batchPipExtensionsAction, type BatchPipResult } from '../../actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type RunMode = 'dry' | 'apply';

export function BatchPipRunner() {
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<BatchPipResult[] | null>(null);
  const [mode, setMode] = useState<RunMode | null>(null);
  const [publishedOnly, setPublishedOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = (chosen: RunMode) => {
    setError(null);
    setResults(null);
    setMode(chosen);
    startTransition(async () => {
      try {
        const r = await batchPipExtensionsAction({ dryRun: chosen === 'dry', publishedOnly });
        setResults(r);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const totals = results
    ? results.reduce(
        (acc, r) => {
          if (!r.inserted) return acc;
          return {
            pk_fields_filled: acc.pk_fields_filled + r.inserted.pk_fields_filled,
            warnings: acc.warnings + r.inserted.warnings,
            missed_dose_rules: acc.missed_dose_rules + r.inserted.missed_dose_rules,
            injection_sites: acc.injection_sites + r.inserted.injection_sites,
            side_effect_windows: acc.side_effect_windows + r.inserted.side_effect_windows,
            oral_administration: acc.oral_administration + r.inserted.oral_administration,
          };
        },
        { pk_fields_filled: 0, warnings: 0, missed_dose_rules: 0, injection_sites: 0, side_effect_windows: 0, oral_administration: 0 },
      )
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publishedOnly}
            onChange={(e) => setPublishedOnly(e.target.checked)}
            disabled={pending}
          />
          Only run on published drugs (skip drafts and archived)
        </label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => run('dry')} disabled={pending}>
            {pending && mode === 'dry' ? 'Dry running…' : '🔍 Dry run'}
          </Button>
          <Button onClick={() => run('apply')} disabled={pending}>
            {pending && mode === 'apply' ? 'Applying…' : '✦ Apply across catalogue'}
          </Button>
        </div>
        {pending && (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Running — each drug takes ~15-20s. Do not close this tab.
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {results && totals && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold">
              {mode === 'dry' ? 'Dry run summary' : 'Apply summary'} ·{' '}
              <span className="text-muted-foreground font-normal">
                {results.filter((r) => r.status === 'ok').length} ok ·{' '}
                {results.filter((r) => r.status === 'skipped').length} skipped ·{' '}
                {results.filter((r) => r.status === 'error').length} errors
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'dry' ? 'Would insert' : 'Inserted'} across the catalogue: PK fields{' '}
              <strong>{totals.pk_fields_filled}</strong> · warnings <strong>{totals.warnings}</strong> ·
              missed-dose <strong>{totals.missed_dose_rules}</strong> · sites{' '}
              <strong>{totals.injection_sites}</strong> · SE windows{' '}
              <strong>{totals.side_effect_windows}</strong> · oral{' '}
              <strong>{totals.oral_administration}</strong>.
            </p>
            {mode === 'apply' && (
              <p className="text-xs text-muted-foreground mt-2">
                <Link href="/admin/drugs/coverage" className="underline">View coverage matrix →</Link>
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">PK</TableHead>
                  <TableHead className="text-center">Warn</TableHead>
                  <TableHead className="text-center">Missed</TableHead>
                  <TableHead className="text-center">Sites</TableHead>
                  <TableHead className="text-center">SE win</TableHead>
                  <TableHead className="text-center">Oral</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.drug_id}>
                    <TableCell>
                      <Link href={`/admin/drugs/${r.drug_id}/edit`} className="hover:underline">
                        <span className="font-medium">{r.name}</span>
                        <span className="block text-xs text-muted-foreground">{r.slug}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {r.status === 'ok' && <Badge variant="success">{mode === 'dry' ? 'would write' : 'inserted'}</Badge>}
                      {r.status === 'skipped' && <Badge variant="outline">no gaps</Badge>}
                      {r.status === 'error' && <Badge variant="destructive">error</Badge>}
                    </TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.pk_fields_filled ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.warnings ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.missed_dose_rules ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.injection_sites ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.side_effect_windows ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.oral_administration ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{r.error ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
