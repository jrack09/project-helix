'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type TocItem = { id: string; label: string };

export function TocScrollSpy({
  items,
  compact = false,
}: {
  items: TocItem[];
  compact?: boolean;
}) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (!itemIds.length) return;

    const elements = itemIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      {
        root: null,
        // Bias toward section headers in view beneath sticky nav.
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0.2, 0.4, 0.6, 0.8],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [itemIds]);

  if (compact) {
    return (
      <nav aria-label="Page sections" className="surface-panel rounded-[--radius-lg] p-2">
        <div className="scrollbar-none flex gap-2 overflow-x-auto px-1 py-1">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-primary/35 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Page sections" className="surface-panel rounded-[--radius-lg] p-3">
      <p className="px-1 text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">On this page</p>
      <ul className="mt-2 grid gap-1">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'block rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
