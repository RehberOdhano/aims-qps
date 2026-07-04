import { requireRole } from "@/lib/dal";

// Placeholder — Phase 2 ports user management, round history, and CAPA export here.
export default async function AdminPage() {
  const profile = await requireRole("admin");

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-navy)" }}>
        Admin panel
      </h2>
      <p style={{ marginTop: 8, color: "var(--color-text-muted)" }}>
        Signed in as {profile.fullname} ({profile.role}). User management and
        round history aren&apos;t ported yet.
      </p>
    </div>
  );
}
