-- Rename the "Department Modules" section group to "Specialty Modules".
-- The original name collided with the unrelated `departments` table (the
-- ward/unit picker), causing confusion between two different concepts:
-- ED/ICU specialty checklists (this group) vs. hospital wards (departments).

-- Drop the constraint before the data update below — the old constraint
-- doesn't allow 'Specialty Modules' yet, so the UPDATE would violate it
-- if run first.
alter table public.sections drop constraint sections_grp_check;

update public.sections set grp = 'Specialty Modules' where grp = 'Department Modules';

alter table public.sections add constraint sections_grp_check check (grp in ('Core Sections', 'Specialty Modules'));
