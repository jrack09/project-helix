import Link from 'next/link';
import { cn } from '@/lib/utils';

export function SectionShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn('section-shell section-gap', className)}>{children}</section>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3 max-w-3xl', className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {description ? <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p> : null}
    </div>
  );
}

export function QuickFactsPanel({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="surface-panel rounded-[--radius-xl] p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quickstart Highlights</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-[--radius] border border-border/80 bg-card/70 px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 text-sm font-medium leading-snug">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function TOCNav({ items }: { items: Array<{ id: string; label: string }> }) {
  return (
    <nav aria-label="Page sections" className="surface-panel rounded-[--radius-lg] p-3">
      <p className="px-1 text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">On this page</p>
      <ul className="mt-2 grid gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ProtocolBlock({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="rounded-[--radius-lg] border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5">{children}</div>
    </section>
  );
}

export function EvidenceCard({
  title,
  meta,
  sourceUrl,
}: {
  title: string;
  meta?: string;
  sourceUrl: string;
}) {
  return (
    <article className="rounded-[--radius] border border-border bg-card p-4">
      <p className="text-sm font-semibold leading-snug">{title}</p>
      {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
      <Link href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium hover:underline">
        View source
      </Link>
    </article>
  );
}
