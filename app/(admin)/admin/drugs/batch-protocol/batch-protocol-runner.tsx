'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { batchProtocolExtensionsAction, type BatchProtocolResult } from '../../actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type RunMode = 'dry' | 'apply';

const EMPTY_TOTALS = {
  protocol_timeline: 0,
  dose_cycle_profile: 0,
  symptom_playbooks: 0,
  food_tolerance_rules: 0,
  checkin_protocol: 0,
  red_flag_rules: 0,
  clinician_report_template: 0,
};

export function BatchProtocolRunner() {
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<BatchProtocolResult[] | null>(null);
  const [mode, setMode] = useState<RunMode | null>(null);
  const [publishedOnly, setPublishedOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = (chosen: RunMode) => {
    if (chosen === 'apply' && !window.confirm('Apply clean-replaces every drug’s existing protocol companion data. Continue?')) {
      return;
    }
    setError(null);
    setResults(null);
    setMode(chosen);
    startTransition(async () => {
      try {
        const r = await batchProtocolExtensionsAction({ dryRun: chosen === 'dry', publishedOnly });
        setResults(r);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const totals = results
    ? results.reduce((acc, r) => {
        if (!r.inserted) return acc;
        return {
          protocol_timeline: acc.protocol_timeline + r.inserted.protocol_timeline,
          dose_cycle_profile: acc.dose_cycle_profile + r.inserted.dose_cycle_profile,
          symptom_playbooks: acc.symptom_playbooks + r.inserted.symptom_playbooks,
          food_tolerance_rules: acc.food_tolerance_rules + r.inserted.food_tolerance_rules,
          checkin_protocol: acc.checkin_protocol + r.inserted.checkin_protocol,
          red_flag_rules: acc.red_flag_rules + r.inserted.red_flag_rules,
          clinician_report_template: acc.clinician_report_template + r.inserted.clinician_report_template,
        };
      }, { ...EMPTY_TOTALS })
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
              {mode === 'dry' ? 'Would write' : 'Wrote'} across the catalogue: timeline{' '}
              <strong>{totals.protocol_timeline}</strong> · dose cycle{' '}
              <strong>{totals.dose_cycle_profile}</strong> · playbooks{' '}
              <strong>{totals.symptom_playbooks}</strong> · food rules{' '}
              <strong>{totals.food_tolerance_rules}</strong> · check-in{' '}
              <strong>{totals.checkin_protocol}</strong> · red flags{' '}
              <strong>{totals.red_flag_rules}</strong> · clinician{' '}
              <strong>{totals.clinician_report_template}</strong>.
            </p>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Timeline</TableHead>
                  <TableHead className="text-center">Cycle</TableHead>
                  <TableHead className="text-center">Plays</TableHead>
                  <TableHead className="text-center">Food</TableHead>
                  <TableHead className="text-center">Check-in</TableHead>
                  <TableHead className="text-center">Red flag</TableHead>
                  <TableHead className="text-center">Clinician</TableHead>
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
                      {r.status === 'ok' && <Badge variant="success">{mode === 'dry' ? 'would write' : 'wrote'}</Badge>}
                      {r.status === 'skipped' && <Badge variant="outline">no data</Badge>}
                      {r.status === 'error' && <Badge variant="destructive">error</Badge>}
                    </TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.protocol_timeline ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.dose_cycle_profile ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.symptom_playbooks ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.food_tolerance_rules ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.checkin_protocol ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.red_flag_rules ?? '—'}</TableCell>
                    <TableCell className="text-center text-sm">{r.inserted?.clinician_report_template ?? '—'}</TableCell>
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
