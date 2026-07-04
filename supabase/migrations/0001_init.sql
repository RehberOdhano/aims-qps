-- AIMS QPS: initial schema — profiles, rounds, RLS policies.
-- Users are provisioned by admins server-side (service role); there is no
-- public signup and no trigger that auto-creates a profile on auth.users insert.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  fullname text not null,
  role text not null check (role in ('admin', 'auditor', 'viewer')),
  dept text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  last_login timestamptz,
  created_at timestamptz not null default now()
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  auditor_id uuid not null references public.profiles (id),
  dept text,
  date_shift text,
  status text not null check (status in ('draft', 'completed')),
  saved_at timestamptz,
  pct numeric,
  non_compliant int,
  partial int,
  critical_nc int,
  total_items int,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- One in-progress draft per auditor, mirroring the prototype's single
-- `currentRound` autosave slot.
create unique index rounds_one_draft_per_auditor
  on public.rounds (auditor_id)
  where status = 'draft';

create index rounds_auditor_id_idx on public.rounds (auditor_id);
create index rounds_status_idx on public.rounds (status);

alter table public.profiles enable row level security;
alter table public.rounds enable row level security;

-- SECURITY DEFINER so admin-role checks don't re-trigger RLS evaluation on
-- every policy that calls it (standard Supabase pattern for role lookups).
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles policies

create policy "admins full access to profiles"
  on public.profiles for all
  using (is_admin())
  with check (is_admin());

create policy "users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Role/status are provisioning concerns, not self-service — block changes to
-- those columns unless the actor is an admin (the admin policy above already
-- covers admins; this trigger fires for the "users can update own profile"
-- path and rejects any attempt to self-promote or reactivate/deactivate).
create function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    if new.role <> old.role or new.status <> old.status then
      raise exception 'Only admins can change role or status';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_self_role_change
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();

-- rounds policies

create policy "admins full access to rounds"
  on public.rounds for all
  using (is_admin())
  with check (is_admin());

create policy "auditors select own rounds"
  on public.rounds for select
  using (auditor_id = auth.uid());

create policy "auditors insert own rounds"
  on public.rounds for insert
  with check (auditor_id = auth.uid());

create policy "auditors update own rounds"
  on public.rounds for update
  using (auditor_id = auth.uid())
  with check (auditor_id = auth.uid());

-- No delete policy for auditors: only admins can delete round records.

create policy "viewers select completed rounds"
  on public.rounds for select
  using (
    status = 'completed'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'viewer'
    )
  );
