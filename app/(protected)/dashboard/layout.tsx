import AuditorSidebar from "@/components/AuditorSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <AuditorSidebar />
      <div className="admin-content">{children}</div>
    </div>
  );
}
