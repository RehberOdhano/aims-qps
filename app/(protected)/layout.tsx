import { requireUser } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: "var(--color-navy)",
          padding: "0 16px",
          height: 46,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <h1 style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
          AIMS QPS Rounding
        </h1>
        <div style={{ flex: 1 }} />
        <span style={{ color: "var(--color-accent-blue)", fontSize: 11 }}>
          {profile.fullname} · {profile.role}
        </span>
        <form action={logout}>
          <button
            type="submit"
            style={{
              padding: "5px 12px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "var(--color-accent-blue)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </form>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
    </div>
  );
}
