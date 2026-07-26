import { requireRole } from "@/lib/dal";
import { getAllRoundsWithAuditor } from "@/lib/admin-data";
import { getAllSections } from "@/lib/sections-data";
import RoundHistory from "./RoundHistory";

export default async function AdminRoundsPage() {
  const profile = await requireRole("admin");
  const [rounds, sections] = await Promise.all([getAllRoundsWithAuditor(), getAllSections()]);

  return <RoundHistory rounds={rounds} sections={sections} generatedBy={profile.fullname} />;
}
