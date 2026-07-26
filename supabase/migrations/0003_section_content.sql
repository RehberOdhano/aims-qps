-- AIMS QPS: move audit content (sections/questions/departments) out of
-- static app code and into the database, admin-managed via the admin panel.
--
-- Items/sections are referenced from rounds.state by their uuid `id`, not by
-- array position, so editing/reordering/deleting content never corrupts what
-- an existing round's answers refer to.

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  grp text not null check (grp in ('Core Sections', 'Department Modules')),
  std text,
  sort_order int not null,
  created_at timestamptz not null default now()
);

create table public.section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  std text,
  question text not null,
  risk text not null check (risk in ('C', 'H', 'M', 'L')),
  sort_order int not null,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null,
  created_at timestamptz not null default now()
);

create index section_items_section_id_idx on public.section_items (section_id);

alter table public.sections enable row level security;
alter table public.section_items enable row level security;
alter table public.departments enable row level security;

-- Read: any authenticated user (auditors need this to render the round
-- tool). Write: admins only, reusing the is_admin() helper from 0001_init.sql.

create policy "authenticated users can view sections"
  on public.sections for select
  using (auth.uid() is not null);

create policy "admins manage sections"
  on public.sections for all
  using (is_admin())
  with check (is_admin());

create policy "authenticated users can view section items"
  on public.section_items for select
  using (auth.uid() is not null);

create policy "admins manage section items"
  on public.section_items for all
  using (is_admin())
  with check (is_admin());

create policy "authenticated users can view departments"
  on public.departments for select
  using (auth.uid() is not null);

create policy "admins manage departments"
  on public.departments for all
  using (is_admin())
  with check (is_admin());

-- Clean cutover: rounds.state moves from index-keyed to uuid-keyed answers.
-- No completed rounds exist yet — only 2 empty draft test rows in the old
-- index-keyed shape, which are incompatible with the new shape. Confirmed
-- with the project owner before applying: nothing real is lost.
delete from public.rounds where status = 'draft';
