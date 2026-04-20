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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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
  count(*) as observation_count,
  min(dosage_unit) as dosage_unit
from public.study_dosages
where dosage_value is not null
group by peptide_id;

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
