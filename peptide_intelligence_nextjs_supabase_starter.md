# Peptide Intelligence Platform — Next.js + Supabase Starter

This starter is aligned to the safer PRD boundary:

- research and educational use only
- no dosage recommendations
- no protocol builder
- no personalised treatment guidance
- no supplier links
- evidence-backed summaries only
- guardrails to block prescriptive AI output

---

## 1. Recommended stack

- **Frontend:** Next.js 16 App Router + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Auth / DB / Storage:** Supabase
- **Optional backend expansion:** NestJS later if you outgrow route handlers
- **Payments:** Stripe for SaaS subscription to research platform access only
- **Hosting:** Vercel + Supabase

---

## 2. Suggested project structure

```txt
peptide-intelligence-platform/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   └── disclaimer/page.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── peptides/page.tsx
│   │   ├── peptides/[slug]/page.tsx
│   │   ├── studies/page.tsx
│   │   ├── account/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── peptides/route.ts
│   │   ├── peptides/[slug]/route.ts
│   │   ├── peptides/[slug]/dosage-range/route.ts
│   │   ├── peptides/[slug]/studies/route.ts
│   │   ├── ai/summarise/route.ts
│   │   └── webhook/stripe/route.ts
│   ├── auth/
│   │   ├── callback/route.ts
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── peptides/
│   │   ├── peptide-card.tsx
│   │   ├── peptide-header.tsx
│   │   ├── evidence-score.tsx
│   │   ├── observed-dosage-panel.tsx
│   │   ├── study-list.tsx
│   │   └── risk-panel.tsx
│   ├── shared/
│   │   ├── app-shell.tsx
│   │   ├── disclaimer-gate.tsx
│   │   ├── region-badge.tsx
│   │   └── source-citation.tsx
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── compliance/
│   │   ├── ai-guardrails.ts
│   │   ├── copy-rules.ts
│   │   └── region-policy.ts
│   ├── stripe.ts
│   ├── env.ts
│   ├── slug.ts
│   └── utils.ts
├── types/
│   ├── database.ts
│   ├── peptide.ts
│   └── api.ts
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql
│   ├── seed.sql
│   └── policies.sql
├── middleware.ts
├── package.json
├── tailwind.config.ts
├── components.json
├── tsconfig.json
└── README.md
```

---

## 3. Initial package.json

```json
{
  "name": "peptide-intelligence-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",
    "@stripe/stripe-js": "latest",
    "stripe": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "lucide-react": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest"
  }
}
```

---

## 4. Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=
```

---

## 5. Core Supabase schema

### `supabase/migrations/0001_init.sql`

```sql
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  region_code text default 'AU',
  role text not null default 'member' check (role in ('member','admin','editor')),
  disclaimer_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.peptides (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text unique not null,
  aliases jsonb not null default '[]'::jsonb,
  short_description text,
  mechanism_summary text,
  receptor_targets jsonb not null default '[]'::jsonb,
  evidence_score integer check (evidence_score between 0 and 100),
  status_label text not null default 'investigational',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.studies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  journal text,
  publication_date date,
  study_type text not null check (study_type in ('human','animal','in_vitro','review','meta_analysis')),
  sample_size integer,
  population text,
  source_url text not null,
  doi text,
  abstract text,
  created_at timestamptz not null default now()
);

create table public.study_peptides (
  id uuid primary key default gen_random_uuid(),
  peptide_id uuid not null references public.peptides(id) on delete cascade,
  study_id uuid not null references public.studies(id) on delete cascade,
  unique (peptide_id, study_id)
);

create table public.study_dosages (
  id uuid primary key default gen_random_uuid(),
  peptide_id uuid not null references public.peptides(id) on delete cascade,
  study_id uuid not null references public.studies(id) on delete cascade,
  dosage_value numeric,
  dosage_unit text,
  frequency text,
  duration text,
  context_note text,
  created_at timestamptz not null default now()
);

create table public.study_outcomes (
  id uuid primary key default gen_random_uuid(),
  peptide_id uuid not null references public.peptides(id) on delete cascade,
  study_id uuid not null references public.studies(id) on delete cascade,
  outcome_type text,
  description text not null,
  significance text,
  created_at timestamptz not null default now()
);

create table public.side_effects (
  id uuid primary key default gen_random_uuid(),
  peptide_id uuid not null references public.peptides(id) on delete cascade,
  study_id uuid not null references public.studies(id) on delete cascade,
  effect text not null,
  severity text,
  frequency text,
  created_at timestamptz not null default now()
);

create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  peptide_id uuid not null unique references public.peptides(id) on delete cascade,
  summary_text text not null,
  model_name text,
  last_generated_at timestamptz not null default now(),
  guardrail_passed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_code text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create view public.peptide_observed_dosage_ranges as
select
  peptide_id,
  min(dosage_value) as min_dosage,
  max(dosage_value) as max_dosage,
  count(*) as observation_count
from public.study_dosages
where dosage_value is not null
group by peptide_id;
```

---

## 6. Basic RLS policies

### `supabase/policies.sql`

```sql
alter table public.profiles enable row level security;
alter table public.peptides enable row level security;
alter table public.studies enable row level security;
alter table public.study_peptides enable row level security;
alter table public.study_dosages enable row level security;
alter table public.study_outcomes enable row level security;
alter table public.side_effects enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id);

create policy "public_read_peptides"
on public.peptides for select
using (is_visible = true);

create policy "public_read_studies"
on public.studies for select
using (true);

create policy "public_read_study_peptides"
on public.study_peptides for select
using (true);

create policy "public_read_study_dosages"
on public.study_dosages for select
using (true);

create policy "public_read_study_outcomes"
on public.study_outcomes for select
using (true);

create policy "public_read_side_effects"
on public.side_effects for select
using (true);

create policy "public_read_ai_summaries"
on public.ai_summaries for select
using (true);

create policy "subscriptions_select_own"
on public.subscriptions for select
using (auth.uid() = user_id);
```

---

## 7. Supabase server/client utilities

### `lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### `lib/supabase/server.ts`

```ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

---

## 8. Compliance guardrails

### `lib/compliance/ai-guardrails.ts`

```ts
const BLOCKED_PATTERNS = [
  /should\s+take/i,
  /recommended\s+dosage/i,
  /take\s+\d+/i,
  /inject\s+\d+/i,
  /cycle\s+for\s+\d+/i,
  /best peptide for/i,
  /you should use/i,
  /stack with/i,
  /protocol/i,
];

export function assertSafeEducationalOutput(text: string) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error('AI output failed compliance guardrails');
    }
  }

  return true;
}

export function buildResearchOnlyPrompt(input: {
  peptide: string;
  evidence: string;
}) {
  return `You are generating an educational, research-only summary for ${input.peptide}.
Do not provide medical advice.
Do not provide dosage recommendations.
Do not provide instructions, treatment protocols, cycles, stacks, or prescriptive guidance.
Use language such as "observed in studies" and "reported in published research".
If evidence is limited, say so plainly.
Evidence:\n${input.evidence}`;
}
```

### `lib/compliance/copy-rules.ts`

```ts
export const SAFE_COPY_RULES = {
  dosageSectionTitle: 'Observed Research Dosage',
  dosageSectionSubtitle:
    'This section summarises dosage ranges reported in published studies. It is not a recommendation.',
  evidenceLabel: 'Evidence strength',
  riskLabel: 'Reported adverse events in studies',
};
```

### `lib/compliance/region-policy.ts`

```ts
export type RegionCode = 'AU' | 'US' | 'UK' | 'EU' | 'CA' | 'OTHER';

export function getRegionPolicy(region: RegionCode) {
  return {
    allowSupplierLinks: false,
    allowPersonalisedGuidance: false,
    highlightInvestigationalWarning: ['AU', 'UK', 'EU', 'CA'].includes(region),
  };
}
```

---

## 9. Core types

### `types/peptide.ts`

```ts
export type Peptide = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  short_description: string | null;
  mechanism_summary: string | null;
  evidence_score: number | null;
  status_label: string;
};

export type ObservedDosageRange = {
  min_dosage: number | null;
  max_dosage: number | null;
  observation_count: number;
  dosage_unit?: string | null;
};
```

---

## 10. Peptides API route

### `app/api/peptides/route.ts`

```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('peptides')
    .select('id, slug, name, aliases, short_description, mechanism_summary, evidence_score, status_label')
    .eq('is_visible', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

---

## 11. Single peptide API route

### `app/api/peptides/[slug]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('peptides')
    .select(`
      id,
      slug,
      name,
      aliases,
      short_description,
      mechanism_summary,
      evidence_score,
      status_label,
      ai_summaries(summary_text, last_generated_at)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
}
```

---

## 12. Observed dosage range API route

### `app/api/peptides/[slug]/dosage-range/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: peptide } = await supabase
    .from('peptides')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!peptide) {
    return NextResponse.json({ error: 'Peptide not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('peptide_observed_dosage_ranges')
    .select('*')
    .eq('peptide_id', peptide.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    messaging: {
      title: 'Observed Research Dosage',
      disclaimer: 'Summarised from published studies. Not a recommendation or instruction.',
    },
  });
}
```

---

## 13. AI summary route with guardrails

### `app/api/ai/summarise/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { assertSafeEducationalOutput, buildResearchOnlyPrompt } from '@/lib/compliance/ai-guardrails';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { peptide, evidence } = body;

  if (!peptide || !evidence) {
    return NextResponse.json({ error: 'Missing peptide or evidence' }, { status: 400 });
  }

  const prompt = buildResearchOnlyPrompt({ peptide, evidence });

  // Replace with your preferred model call.
  const generatedText = `
${peptide} has been studied in published research for several experimental contexts.
Current evidence is mixed and varies by study design, population, and endpoint.
Reported findings should be interpreted as research observations rather than treatment guidance.
More robust human evidence may be needed before stronger conclusions can be drawn.
  `.trim();

  try {
    assertSafeEducationalOutput(generatedText);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Guardrail failure', prompt },
      { status: 422 }
    );
  }

  return NextResponse.json({ data: { summary: generatedText } });
}
```

---

## 14. Protected app layout

### `app/(app)/layout.tsx`

```tsx
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('disclaimer_accepted_at')
    .eq('id', user.id)
    .single();

  if (!profile?.disclaimer_accepted_at) {
    redirect('/disclaimer');
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
```

---

## 15. Marketing homepage starter

### `app/page.tsx`

```tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-3xl space-y-6">
        <span className="inline-flex rounded-full border px-3 py-1 text-sm">
          Research-grade peptide knowledge platform
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Published peptide research, structured for clarity.
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore mechanisms, observed dosage ranges in studies, evidence strength, and reported adverse events.
          Built for educational and research purposes only.
        </p>
        <div className="flex gap-3">
          <Link href="/auth/signup" className="rounded-xl bg-black px-5 py-3 text-white">
            Start free
          </Link>
          <Link href="/disclaimer" className="rounded-xl border px-5 py-3">
            Read platform scope
          </Link>
        </div>
      </div>
    </main>
  );
}
```

---

## 16. Disclaimer page

### `app/(marketing)/disclaimer/page.tsx`

```tsx
export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 space-y-6">
      <h1 className="text-3xl font-semibold">Platform scope</h1>
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>This platform is provided for educational and research reference purposes only.</p>
        <p>It does not provide medical advice, treatment recommendations, dosage instructions, protocol guidance, or prescribing support.</p>
        <p>Any dosage information displayed represents ranges observed in published research and must not be interpreted as a recommendation.</p>
        <p>Regulatory status and legality vary by region.</p>
      </div>
    </main>
  );
}
```

---

## 17. Peptides list page

### `app/(app)/peptides/page.tsx`

```tsx
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function PeptidesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: peptides } = await supabase
    .from('peptides')
    .select('id, slug, name, short_description, evidence_score, status_label')
    .eq('is_visible', true)
    .order('name');

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Peptides</h1>
        <p className="text-muted-foreground">Browse structured summaries derived from published research.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {peptides?.map((peptide) => (
          <Link key={peptide.id} href={`/peptides/${peptide.slug}`} className="rounded-2xl border p-5 hover:shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium">{peptide.name}</h2>
                <span className="rounded-full border px-2 py-1 text-xs">{peptide.status_label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{peptide.short_description}</p>
              <p className="text-sm">Evidence score: {peptide.evidence_score ?? 'N/A'}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

---

## 18. Peptide detail page starter

### `app/(app)/peptides/[slug]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SAFE_COPY_RULES } from '@/lib/compliance/copy-rules';

export default async function PeptideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: peptide } = await supabase
    .from('peptides')
    .select('id, slug, name, short_description, mechanism_summary, evidence_score, status_label')
    .eq('slug', slug)
    .single();

  if (!peptide) notFound();

  const { data: dosageRange } = await supabase
    .from('peptide_observed_dosage_ranges')
    .select('*')
    .eq('peptide_id', peptide.id)
    .single();

  const { data: studies } = await supabase
    .from('study_peptides')
    .select('studies(id, title, journal, publication_date, study_type, source_url)')
    .eq('peptide_id', peptide.id)
    .limit(10);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold">{peptide.name}</h1>
          <span className="rounded-full border px-2 py-1 text-xs">{peptide.status_label}</span>
        </div>
        <p className="text-muted-foreground">{peptide.short_description}</p>
        <div className="rounded-2xl border p-5">
          <h2 className="font-medium">Mechanism summary</h2>
          <p className="mt-2 text-sm text-muted-foreground">{peptide.mechanism_summary}</p>
        </div>
      </section>

      <section className="rounded-2xl border p-5 space-y-2">
        <h2 className="font-medium">{SAFE_COPY_RULES.dosageSectionTitle}</h2>
        <p className="text-sm text-muted-foreground">{SAFE_COPY_RULES.dosageSectionSubtitle}</p>
        <div className="grid gap-4 pt-2 sm:grid-cols-3">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Minimum observed</p>
            <p className="text-lg font-semibold">{dosageRange?.min_dosage ?? 'N/A'}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Maximum observed</p>
            <p className="text-lg font-semibold">{dosageRange?.max_dosage ?? 'N/A'}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Observations</p>
            <p className="text-lg font-semibold">{dosageRange?.observation_count ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-5 space-y-4">
        <h2 className="font-medium">Recent linked studies</h2>
        <div className="space-y-3">
          {studies?.map((entry: any) => {
            const study = entry.studies;
            return (
              <a
                key={study.id}
                href={study.source_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border p-4 hover:bg-muted/40"
              >
                <p className="font-medium">{study.title}</p>
                <p className="text-sm text-muted-foreground">
                  {study.journal} • {study.study_type} • {study.publication_date}
                </p>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}
```

---

## 19. Stripe monetisation pattern

### Safe product framing

Sell access to:
- research database
- evidence summaries
- study explorer
- AI-powered literature summaries

Do **not** sell:
- peptide products
- affiliate peptide links
- medical guidance
- dosing plans

### Suggested plans

| Plan | Description |
|---|---|
| Free | Limited peptide access |
| Pro | Full research database + AI summaries |
| Teams | Shared workspace / analyst features |

### Stripe product copy

Use copy like:

> Subscription access to a biomedical research reference platform that organises published literature into searchable summaries.

Avoid copy like:

> Peptide dosage platform
> Peptide use guidance
> Performance enhancement peptide support

---

## 20. Seed data example

### `supabase/seed.sql`

```sql
insert into public.peptides (
  slug,
  name,
  aliases,
  short_description,
  mechanism_summary,
  evidence_score,
  status_label
)
values (
  'bpc-157',
  'BPC-157',
  '["Body Protection Compound 157"]'::jsonb,
  'Experimental peptide discussed in published research and secondary literature.',
  'Published discussions describe experimental interactions related to repair and recovery pathways, though evidence quality varies by study type.',
  42,
  'investigational'
);
```

---

## 21. What to build next after starter

### Immediate next tasks

1. Add Supabase auth pages
2. Add profile creation trigger for new users
3. Add Stripe checkout + subscription sync
4. Add ingestion pipeline for PubMed / curated literature imports
5. Add AI summary generation job with moderation log
6. Add admin CMS for editor-reviewed content

### Strong next enhancement

- create `content_reviews` table
- require editor approval before publishing AI summary
- record prompt, model, output hash, reviewer id, approval timestamp

That gives you a much stronger governance posture.

---

## 22. Recommended production guardrails

Before public launch, add:

- server-side AI moderation log
- admin-only publishing workflow
- terms / privacy / disclaimer acceptance logging
- region-aware warnings
- search synonym controls to avoid “best peptide for X” style output
- analytics that exclude sensitive health profiling

---

## 23. Best implementation path for you

Given your background, the practical path is:

- scaffold UI quickly
- wire Supabase directly
- keep route handlers for MVP
- add NestJS only when you need heavier ingestion / queue / moderation / B2B API separation

---

## 24. Next files worth generating

After this starter, the best sequence is:

1. full Supabase SQL migration pack
2. auth pages and middleware
3. Stripe checkout + billing portal
4. peptide detail UI in polished shadcn style
5. admin ingestion dashboard

If you want, the next step should be generating the **full SQL migrations + auth flow + Stripe integration files** in code form.

