import { requireUser } from "@/lib/dal";
import UserMenu from "@/components/UserMenu";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="topbar">
        <h1 className="topbar-title">AIMS QPS Rounding</h1>
        <div style={{ flex: 1 }} />
        <UserMenu fullname={profile.fullname} role={profile.role} />
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
    </div>
  );
}
