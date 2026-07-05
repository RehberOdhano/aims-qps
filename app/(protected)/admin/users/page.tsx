import { requireRole } from "@/lib/dal";
import { getAllProfiles } from "@/lib/admin-data";
import UserManagement from "./UserManagement";

export default async function AdminUsersPage() {
  const profile = await requireRole("admin");
  const profiles = await getAllProfiles();

  return <UserManagement currentProfile={profile} profiles={profiles} />;
}
