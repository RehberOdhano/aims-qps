import { requireRole } from "@/lib/dal";
import { getAllSections } from "@/lib/sections-data";
import SectionsManagement from "./SectionsManagement";

export default async function AdminSectionsPage() {
  await requireRole("admin");
  const sections = await getAllSections();
  const coreSections = sections.filter((s) => s.grp === "Core Sections");

  return <SectionsManagement sections={coreSections} group="Core Sections" title="Core Sections" />;
}
