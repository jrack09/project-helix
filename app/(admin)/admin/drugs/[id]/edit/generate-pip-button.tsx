'use client';

import { useState, useTransition } from 'react';
import {
  draftPipExtensionsAction,
  acceptPipExtensionsDraftAction,
  type PipDraftResult,
} from '../../../actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type InsertCounts = {
  pk_fields_filled: number;
  warnings: number;
  missed_dose_rules: number;
  injection_sites: number;
  side_effect_windows: number;
  oral_administration: number;
};

export function GeneratePipExtensionsButton({ drugId }: { drugId: string }) {
  const [draftPending, startDraft] = useTransition();
  const [acceptPending, startAccept] = useTransition();
  const [draft, setDraft] = useState<PipDraftResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InsertCounts | null>(null);

  const onDraft = () => {
    setError(null);
    setResult(null);
    startDraft(async () => {
      try {
        const r = await draftPipExtensionsAction(drugId);
        setDraft(r);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const onAccept = () => {
    if (!draft) return;
    setError(null);
    startAccept(async () => {
      try {
        const r = await acceptPipExtensionsDraftAction(drugId, draft.draft);
        setResult(r.inserted);
        setDraft(null);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const onDiscard = () => {
    setDraft(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Draft PIP-extension fields with AI</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generates a preview of numeric PK, warnings, missed-dose rules, injection sites, side-effect windows,
            and oral admin from the drug's cited sources. Review before accepting — duplicates of existing rows
            are skipped automatically.
          </p>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          {result && (
            <p className="text-xs text-success mt-1">
              Inserted — PK: {result.pk_fields_filled} ·
              warnings: {result.warnings} ·
              missed-dose: {result.missed_dose_rules} ·
              sites: {result.injection_sites} ·
              SE windows: {result.side_effect_windows} ·
              oral: {result.oral_administration}
            </p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" disabled={draftPending || acceptPending} onClick={onDraft}>
          {draftPending ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Drafting…
            </span>
          ) : draft ? (
            '↺ Regenerate draft'
          ) : (
            '✦ Draft PIP fields'
          )}
        </Button>
      </div>

      {draft && (
        <DraftPreview
          draft={draft}
          accepting={acceptPending}
          onAccept={onAccept}
          onDiscard={onDiscard}
        />
      )}
    </div>
  );
}

function DraftPreview({
  draft, accepting, onAccept, onDiscard,
}: {
  draft: PipDraftResult;
  accepting: boolean;
  onAccept: () => void;
  onDiscard: () => void;
}) {
  const d = draft.draft;
  const dd = draft.dedup;

  const newCount = {
    pk: [dd.pk.half_life_will_fill, dd.pk.tmax_will_fill, dd.pk.duration_will_fill].filter(Boolean).length,
    warnings: dd.warnings_duplicate.filter((b) => !b).length,
    missed: dd.missed_dose_rules_duplicate.filter((b) => !b).length,
    sites: dd.injection_sites_duplicate.filter((b) => !b).length,
    windows: dd.side_effect_windows_duplicate.filter((b) => !b).length,
    oral: d.oral_administration.length,
  };
  const totalNew = Object.values(newCount).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-lg border border-primary/30 bg-background p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Review AI draft</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalNew === 0
              ? 'Everything in this draft is already covered — nothing would be inserted.'
              : `${totalNew} new entries will be inserted. Duplicates of existing rows are greyed and skipped.`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button type="button" variant="ghost" size="sm" onClick={onDiscard} disabled={accepting}>
            Discard
          </Button>
          <Button type="button" size="sm" onClick={onAccept} disabled={accepting || totalNew === 0}>
            {accepting ? 'Saving…' : `Accept ${totalNew > 0 ? `(${totalNew})` : ''}`}
          </Button>
        </div>
      </div>

      <Section title="Pharmacokinetics" count={newCount.pk}>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <PkPill label="Half-life" hours={d.pharmacokinetics.half_life_hours} willFill={dd.pk.half_life_will_fill} />
          <PkPill label="Tmax" hours={d.pharmacokinetics.tmax_hours} willFill={dd.pk.tmax_will_fill} />
          <PkPill label="Duration" hours={d.pharmacokinetics.duration_of_action_hours} willFill={dd.pk.duration_will_fill} />
        </div>
      </Section>

      <Section title="Warnings" count={newCount.warnings}>
        <ItemList
          items={d.warnings.map((w, i) => ({
            key: `${w.title}-${i}`,
            duplicate: dd.warnings_duplicate[i],
            label: (
              <>
                <Badge variant="outline" className="mr-1.5">{w.severity}</Badge>
                {w.is_red_flag && <Badge variant="destructive" className="mr-1.5">red flag</Badge>}
                <span className="font-medium">{w.title}.</span>{' '}
                <span className="text-muted-foreground">{w.body}</span>
              </>
            ),
          }))}
        />
      </Section>

      <Section title="Missed-dose rules" count={newCount.missed}>
        <ItemList
          items={d.missed_dose_rules.map((r, i) => ({
            key: `md-${i}`,
            duplicate: dd.missed_dose_rules_duplicate[i],
            label: (
              <>
                {r.formulation && <Badge variant="outline" className="mr-1.5">{r.formulation}</Badge>}
                {r.instruction}
                {r.restart_guidance && (
                  <span className="block text-muted-foreground text-xs mt-0.5">{r.restart_guidance}</span>
                )}
              </>
            ),
          }))}
        />
      </Section>

      <Section title="Injection sites" count={newCount.sites}>
        <ItemList
          items={d.injection_sites.map((s, i) => ({
            key: `is-${i}`,
            duplicate: dd.injection_sites_duplicate[i],
            label: (
              <>
                <Badge variant={s.preferred ? 'success' : 'outline'} className="mr-1.5">
                  {s.site}{s.preferred ? ' · preferred' : ''}
                </Badge>
                {s.rotation_guidance && <span>{s.rotation_guidance}</span>}
                {s.avoid_notes && (
                  <span className="block text-muted-foreground text-xs mt-0.5">Avoid: {s.avoid_notes}</span>
                )}
              </>
            ),
          }))}
        />
      </Section>

      <Section title="Side-effect windows" count={newCount.windows}>
        <ItemList
          items={d.side_effect_windows.map((w, i) => ({
            key: `sew-${i}`,
            duplicate: dd.side_effect_windows_duplicate[i],
            label: (
              <>
                <span className="font-medium">{w.effect}</span>
                <span className="block text-muted-foreground text-xs mt-0.5">
                  Onset {fmtRange(w.onset_hours_min, w.onset_hours_max, 'h')} ·{' '}
                  Peak {fmtRange(w.peak_hours_min, w.peak_hours_max, 'h')} ·{' '}
                  Resolves {w.resolution_days_typical != null ? `~${w.resolution_days_typical}d` : '—'}
                </span>
                {w.notes && <span className="block text-muted-foreground text-xs mt-0.5">{w.notes}</span>}
              </>
            ),
          }))}
        />
      </Section>

      <Section title="Oral administration" count={newCount.oral}>
        <ItemList
          items={d.oral_administration.map((o, i) => ({
            key: `oa-${i}`,
            duplicate: false,
            label: (
              <>
                <span className="font-medium">{o.formulation}</span>
                <span className="block text-muted-foreground text-xs mt-0.5">
                  {o.with_water_ml != null && <>With {o.with_water_ml} mL water · </>}
                  {o.time_of_day}
                  {(o.fasting_window_before_min != null || o.fasting_window_after_min != null) && (
                    <> · Fast {o.fasting_window_before_min ?? 0}m / {o.fasting_window_after_min ?? 0}m</>
                  )}
                </span>
                {o.interaction_notes && <span className="block text-muted-foreground text-xs mt-0.5">{o.interaction_notes}</span>}
              </>
            ),
          }))}
        />
      </Section>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <Badge variant={count > 0 ? 'secondary' : 'outline'} className="text-[10px]">
          {count > 0 ? `+${count}` : '0'}
        </Badge>
      </div>
      {children}
    </div>
  );
}

function ItemList({ items }: { items: Array<{ key: string; duplicate: boolean; label: React.ReactNode }> }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground italic">No drafted entries.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.key}
          className={`text-sm rounded border border-border p-2 ${
            item.duplicate ? 'opacity-40 line-through decoration-1' : 'bg-muted/20'
          }`}
        >
          {item.label}
          {item.duplicate && (
            <span className="ml-2 text-[10px] uppercase text-muted-foreground no-underline">duplicate</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function PkPill({ label, hours, willFill }: { label: string; hours: number | null; willFill: boolean }) {
  return (
    <div
      className={`rounded border border-border p-2 ${
        hours == null ? 'opacity-50' : willFill ? 'bg-muted/20' : 'opacity-40 line-through decoration-1'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{hours == null ? '—' : `${hours} h`}</p>
      {hours != null && !willFill && (
        <p className="text-[10px] text-muted-foreground no-underline">already set</p>
      )}
    </div>
  );
}

function fmtRange(lo: number | null, hi: number | null, unit: string): string {
  if (lo == null && hi == null) return '—';
  if (lo != null && hi != null && lo !== hi) return `${lo}–${hi} ${unit}`;
  return `${lo ?? hi} ${unit}`;
}
