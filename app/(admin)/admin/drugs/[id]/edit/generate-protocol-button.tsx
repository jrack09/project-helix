'use client';

import { useState, useTransition } from 'react';
import { generateProtocolExtensionsAction } from '../../../actions';
import { Button } from '@/components/ui/button';

type InsertCounts = {
  protocol_timeline: number;
  dose_cycle_profile: number;
  symptom_playbooks: number;
  food_tolerance_rules: number;
  checkin_protocol: number;
  red_flag_rules: number;
  clinician_report_template: number;
};

export function GenerateProtocolExtensionsButton({ drugId }: { drugId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InsertCounts | null>(null);

  const onGenerate = () => {
    if (
      !window.confirm(
        'Generate protocol-companion fields with AI? This REPLACES any existing protocol timeline, dose-cycle profile, symptom playbooks, food rules, check-in protocol, red-flag rules and clinician report template for this drug. Review the tabs after.',
      )
    ) {
      return;
    }
    setError(null);
    setResult(null);
    start(async () => {
      try {
        const r = await generateProtocolExtensionsAction(drugId);
        setResult(r.inserted);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Generate protocol-companion fields with AI</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Drafts and saves the journey timeline, dose-cycle windows, symptom playbooks, contextual food rules,
          check-in protocol, red-flag rules, and clinician report template from the drug&apos;s cited sources.
          Clean-replaces the existing protocol data — review the tabs below before publishing.
        </p>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        {result && (
          <p className="text-xs text-success mt-1">
            Saved — timeline: {result.protocol_timeline} ·
            dose cycle: {result.dose_cycle_profile} ·
            playbooks: {result.symptom_playbooks} ·
            food rules: {result.food_tolerance_rules} ·
            check-in: {result.checkin_protocol} ·
            red flags: {result.red_flag_rules} ·
            clinician: {result.clinician_report_template}
          </p>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onGenerate}>
        {pending ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Generating…
          </span>
        ) : (
          '✦ Generate protocol companion'
        )}
      </Button>
    </div>
  );
}
