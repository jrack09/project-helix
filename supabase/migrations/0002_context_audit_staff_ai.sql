-- Dosage observations segmented by study context (human vs animal vs in vitro)
create or replace view public.peptide_observed_dosage_ranges_by_context as
select
  sd.peptide_id,
  case
    when s.study_type = 'human' then 'human'
    when s.study_type = 'animal' then 'animal'
    when s.study_type = 'in_vitro' then 'in_vitro'
    else 'other'
  end as context_bucket,
  min(sd.dosage_value) as min_dosage,
  max(sd.dosage_value) as max_dosage,
  count(*)::bigint as observation_count,
  min(sd.dosage_unit) as dosage_unit
from public.study_dosages sd
join public.studies s on s.id = sd.study_id
where sd.dosage_value is not null
group by sd.peptide_id,
  case
    when s.study_type = 'human' then 'human'
    when s.study_type = 'animal' then 'animal'
    when s.study_type = 'in_vitro' then 'in_vitro'
    else 'other'
  end;

alter table public.ai_summaries add column evidence_strength text;
alter table public.ai_summaries add column limitations_text text;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create or replace function public.is_staff_editor()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('editor', 'admin')
  );
$$;

create or replace function public.is_staff_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  );
$$;

create policy "audit_logs_admin_select"
on public.audit_logs for select
using (public.is_staff_admin());

create policy "audit_logs_staff_insert"
on public.audit_logs for insert
with check (public.is_staff_editor());

-- Staff write access for editorial workflows
create policy "staff_insert_peptides"
on public.peptides for insert
with check (public.is_staff_editor());

create policy "staff_update_peptides"
on public.peptides for update
using (public.is_staff_editor());

create policy "staff_delete_peptides"
on public.peptides for delete
using (public.is_staff_admin());

create policy "staff_insert_studies"
on public.studies for insert
with check (public.is_staff_editor());

create policy "staff_update_studies"
on public.studies for update
using (public.is_staff_editor());

create policy "staff_delete_studies"
on public.studies for delete
using (public.is_staff_admin());

create policy "staff_insert_study_peptides"
on public.study_peptides for insert
with check (public.is_staff_editor());

create policy "staff_delete_study_peptides"
on public.study_peptides for delete
using (public.is_staff_editor());

create policy "staff_insert_study_dosages"
on public.study_dosages for insert
with check (public.is_staff_editor());

create policy "staff_update_study_dosages"
on public.study_dosages for update
using (public.is_staff_editor());

create policy "staff_delete_study_dosages"
on public.study_dosages for delete
using (public.is_staff_editor());

create policy "staff_insert_study_outcomes"
on public.study_outcomes for insert
with check (public.is_staff_editor());

create policy "staff_update_study_outcomes"
on public.study_outcomes for update
using (public.is_staff_editor());

create policy "staff_delete_study_outcomes"
on public.study_outcomes for delete
using (public.is_staff_editor());

create policy "staff_insert_side_effects"
on public.side_effects for insert
with check (public.is_staff_editor());

create policy "staff_update_side_effects"
on public.side_effects for update
using (public.is_staff_editor());

create policy "staff_delete_side_effects"
on public.side_effects for delete
using (public.is_staff_editor());

create policy "staff_insert_ai_summaries"
on public.ai_summaries for insert
with check (public.is_staff_editor());

create policy "staff_update_ai_summaries"
on public.ai_summaries for update
using (public.is_staff_editor());

create policy "staff_delete_ai_summaries"
on public.ai_summaries for delete
using (public.is_staff_admin());
