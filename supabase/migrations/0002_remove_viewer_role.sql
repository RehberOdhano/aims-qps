-- AIMS QPS: drop the viewer role — this deployment only uses admin/auditor.
-- The viewer role was scaffolded (matching the legacy prototype's 3-role
-- model) but never got a real read-only screen built for it; rather than
-- carry an unused role through the schema/RLS/UI indefinitely, it's removed.

-- Defensive: reassign any existing viewer accounts to auditor before
-- tightening the constraint below. Expected to affect 0 rows in practice
-- (no viewer-role UI has ever been built to create meaningful viewer use),
-- but this keeps the migration safe to run regardless.
update public.profiles set role = 'auditor' where role = 'viewer';

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'auditor'));

-- Dead policy now that no profile can hold role = 'viewer'.
drop policy "viewers select completed rounds" on public.rounds;
