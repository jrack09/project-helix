'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type RailItem = { id: string; label: string };

export function MobileSectionRail({
  items,
  ctaHref = '/auth/signup',
  ctaLabel = 'App signup',
}: {
  items: RailItem[];
  ctaHref?: string;
  ctaLabel?: string;
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
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0.2, 0.4, 0.6, 0.8],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [itemIds]);

  return (
    <div className="fixed inset-x-0 bottom-3 z-30 px-4 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 rounded-full border border-border bg-background/95 p-2 shadow-[var(--shadow-card)] backdrop-blur">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? 'location' : undefined}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {item.label}
            </a>
          );
        })}
        <Link href={ctaHref} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
