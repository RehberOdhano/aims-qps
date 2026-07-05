import { requireRole } from "@/lib/dal";
import { getAllRoundsWithAuditor } from "@/lib/admin-data";
import RoundHistory from "./RoundHistory";

export default async function AdminRoundsPage() {
  const profile = await requireRole("admin");
  const rounds = await getAllRoundsWithAuditor();

  return <RoundHistory rounds={rounds} generatedBy={profile.fullname} />;
}
