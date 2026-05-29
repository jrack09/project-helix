'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  listProtocolBatchTargetsAction,
  runProtocolForDrugAction,
  type BatchProtocolResult,
} from '../../actions';
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
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BatchProtocolResult[]>([]);
  const [mode, setMode] = useState<RunMode | null>(null);
  const [publishedOnly, setPublishedOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);

  const run = async (chosen: RunMode) => {
    if (chosen === 'apply' && !window.confirm('Apply clean-replaces every drug’s existing protocol companion data. Continue?')) {
      return;
    }
    setError(null);
    setResults([]);
    setProgress(null);
    setMode(chosen);
    setRunning(true);
    let targets: Awaited<ReturnType<typeof listProtocolBatchTargetsAction>>;
    try {
      // One request fetches the list; then one request PER DRUG so no single
      // request runs long enough to hit the serverless function timeout.
      targets = await listProtocolBatchTargetsAction({ publishedOnly });
    } catch (e) {
      setError(`Could not load the drug list: ${(e as Error).message}`);
      setRunning(false);
      return;
    }
    if (targets.length === 0) {
      setError('No drugs matched. Uncheck "published only" if your catalogue is still in draft.');
      setRunning(false);
      return;
    }

    // Each drug is isolated: a network-level failure (e.g. "Failed to fetch"
    // from a single request timing out) is recorded as an error row and the
    // loop carries on, so one bad drug never aborts the whole batch.
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      setProgress({ done: i, total: targets.length, current: t.name });
      let r: BatchProtocolResult;
      try {
        r = await runProtocolForDrugAction(t, { dryRun: chosen === 'dry' });
      } catch {
        // Request itself failed (timeout / network) — retry once, then give up on this drug only.
        try {
          r = await runProtocolForDrugAction(t, { dryRun: chosen === 'dry' });
        } catch (e2) {
          r = { ...t, status: 'error', error: `Request failed (timeout or network): ${(e2 as Error).message}` };
        }
      }
      setResults((prev) => [...prev, r]);
    }
    setProgress({ done: targets.length, total: targets.length, current: '' });
    setRunning(false);
  };

  const totals = results.reduce((acc, r) => {
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
  }, { ...EMPTY_TOTALS });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publishedOnly}
            onChange={(e) => setPublishedOnly(e.target.checked)}
            disabled={running}
          />
          Only run on published drugs (skip drafts and archived)
        </label>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => run('dry')} disabled={running}>
            {running && mode === 'dry' ? 'Dry running…' : '🔍 Dry run'}
          </Button>
          <Button onClick={() => run('apply')} disabled={running}>
            {running && mode === 'apply' ? 'Applying…' : '✦ Apply across catalogue'}
          </Button>
        </div>
        {running && progress && (
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {progress.done}/{progress.total} — {progress.current ? `processing ${progress.current}…` : 'finishing…'}{' '}
            Each drug takes ~15-20s. You can leave this tab open.
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold">
              {mode === 'dry' ? 'Dry run' : 'Apply'} {running ? 'in progress' : 'complete'} ·{' '}
              <span className="text-muted-foreground font-normal">
                {results.filter((r) => r.status === 'ok').length} ok ·{' '}
                {results.filter((r) => r.status === 'skipped').length} skipped ·{' '}
                {results.filter((r) => r.status === 'error').length} errors
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'dry' ? 'Would write' : 'Wrote'} so far: timeline{' '}
              <strong>{totals.protocol_timeline}</strong> · dose cycle{' '}
              <strong>{totals.dose_cycle_profile}</strong> · playbooks{' '}
              <strong>{totals.symptom_playbooks}</strong> · food rules{' '}
              <strong>{totals.food_tolerance_rules}</strong> · check-in{' '}
              <strong>{totals.checkin_protocol}</strong> · red flags{' '}
              <strong>{totals.red_flag_rules}</strong> · clinician{' '}
              <strong>{totals.clinician_report_template}</strong>.
            </p>
            {!running && mode === 'apply' && (
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
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={r.error ?? ''}>{r.error ?? ''}</TableCell>
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
