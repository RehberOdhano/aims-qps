import { requireRole } from "@/lib/dal";
import ChangePasswordCard from "@/components/ChangePasswordCard";

export default async function AdminSettingsPage() {
  await requireRole("admin");

  return <ChangePasswordCard />;
}
