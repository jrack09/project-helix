'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type DosageChartSummary = {
  id: string;
  vial_size_mg: number;
  intro_text: string;
  highlight_reconstitute: string;
  highlight_weekly_range: string;
  highlight_measuring: string;
  highlight_storage: string;
  bac_water_ml: number;
  concentration_mg_per_ml: number;
  source_id: string | null;
  ordinal: number;
};

const HIGHLIGHT_LABELS: Record<keyof Pick<DosageChartSummary, 'highlight_reconstitute' | 'highlight_weekly_range' | 'highlight_measuring' | 'highlight_storage'>, string> = {
  highlight_reconstitute: 'Reconstitute',
  highlight_weekly_range: 'Typical weekly range',
  highlight_measuring: 'Easy measuring',
  highlight_storage: 'Storage',
};

type Props = {
  charts: DosageChartSummary[];
  drugName: string;
  imageUrl?: string | null;
  onVialChange?: (vialSizeMg: number) => void;
  className?: string;
};

export function VialDosageChartPanel({ charts, drugName, imageUrl, onVialChange, className }: Props) {
  const sorted = [...charts].sort((a, b) => a.ordinal - b.ordinal || a.vial_size_mg - b.vial_size_mg);
  const [activeVial, setActiveVial] = useState(sorted[0]?.vial_size_mg ?? 0);
  const active = sorted.find((c) => c.vial_size_mg === activeVial) ?? sorted[0];

  if (!active) return null;

  const selectVial = (vial: number) => {
    setActiveVial(vial);
    onVialChange?.(vial);
  };

  const highlights = (
    ['highlight_reconstitute', 'highlight_weekly_range', 'highlight_measuring', 'highlight_storage'] as const
  ).map((key) => ({ label: HIGHLIGHT_LABELS[key], text: active[key] }));

  return (
    <div className={cn('rounded-[--radius-xl] border border-primary/20 bg-primary/5 p-4 sm:p-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Dosage chart</p>
            <h3 className="text-lg font-semibold tracking-tight">{drugName} — {active.vial_size_mg} mg vial</h3>
          </div>

          {sorted.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Vial size">
              {sorted.map((chart) => (
                <button
                  key={chart.id}
                  type="button"
                  role="tab"
                  aria-selected={chart.vial_size_mg === activeVial}
                  onClick={() => selectVial(chart.vial_size_mg)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    chart.vial_size_mg === activeVial
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {chart.vial_size_mg} mg
                </button>
              ))}
            </div>
          )}

          <p className="text-sm leading-relaxed text-muted-foreground">{active.intro_text}</p>

          <ul className="space-y-2">
            {highlights.map((item) => (
              <li key={item.label} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>
                  <span className="font-medium">{item.label}:</span> {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {imageUrl && (
          <div className="relative mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-[--radius-lg] border border-border/60 bg-background/80 sm:mx-0 sm:h-44 sm:w-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={`${drugName} ${active.vial_size_mg} mg vial`} className="h-full w-full object-contain p-3" />
          </div>
        )}
      </div>
    </div>
  );
}
