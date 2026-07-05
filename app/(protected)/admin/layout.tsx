import { requireRole } from "@/lib/dal";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-content">{children}</div>
    </div>
  );
}
