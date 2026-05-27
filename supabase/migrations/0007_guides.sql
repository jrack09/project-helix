-- ============================================================
-- 0007_guides.sql — Essential Guides content table
-- ============================================================

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  body_markdown text not null default '',
  category text not null default 'getting_started'
    check (category in ('getting_started','administration','nutrition','side_effects','lifestyle','other')),
  cover_emoji text,
  ordinal integer not null default 0,
  publication_status text not null default 'draft'
    check (publication_status in ('draft','in_review','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guides enable row level security;

create policy "public_read_guides"
  on public.guides for select
  using (publication_status = 'published');

create policy "staff_all_guides"
  on public.guides for all
  using (is_staff_editor() or is_staff_admin());

-- Update content_reviews entity_type to allow 'guide'
alter table public.content_reviews
  drop constraint if exists content_reviews_entity_type_check;

alter table public.content_reviews
  add constraint content_reviews_entity_type_check
  check (entity_type in ('drug','expectation','food_guidance','tip','side_effect_tip','ai_summary','guide'));
