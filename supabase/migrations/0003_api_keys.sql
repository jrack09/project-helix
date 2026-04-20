create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  key_prefix text not null,
  key_hash text not null unique,
  name text,
  rate_limit_per_minute integer not null default 60,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index api_keys_user_id_idx on public.api_keys (user_id);

alter table public.api_keys enable row level security;

create policy "api_keys_select_own"
on public.api_keys for select
using (auth.uid() = user_id);

create policy "api_keys_insert_own"
on public.api_keys for insert
with check (auth.uid() = user_id);

create policy "api_keys_update_own"
on public.api_keys for update
using (auth.uid() = user_id);
