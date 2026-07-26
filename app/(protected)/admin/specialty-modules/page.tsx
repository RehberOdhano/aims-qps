import { requireRole } from "@/lib/dal";
import { getAllSections } from "@/lib/sections-data";
import SectionsManagement from "../sections/SectionsManagement";

// Reuses the same SectionsManagement component as /admin/sections, just
// scoped to the "Specialty Modules" group (ED/ICU specialty checklists) —
// see CLAUDE.md for why these are distinct from the `departments` table
// (the ward/unit picker), despite both involving the word "department".
export default async function AdminSpecialtyModulesPage() {
  await requireRole("admin");
  const sections = await getAllSections();
  const specialtyModules = sections.filter((s) => s.grp === "Specialty Modules");

  return <SectionsManagement sections={specialtyModules} group="Specialty Modules" title="Specialty Modules" />;
}
