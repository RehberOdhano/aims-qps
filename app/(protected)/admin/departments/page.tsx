import { requireRole } from "@/lib/dal";
import { getAllDepartmentRows } from "@/lib/sections-data";
import DepartmentsManagement from "./DepartmentsManagement";

export default async function AdminDepartmentsPage() {
  await requireRole("admin");
  const departments = await getAllDepartmentRows();

  return <DepartmentsManagement departments={departments} />;
}
