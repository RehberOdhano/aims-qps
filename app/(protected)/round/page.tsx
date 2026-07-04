import { requireUser } from "@/lib/dal";

// Placeholder — Phase 2 ports the 19-section audit form here.
export default async function RoundPage() {
  const profile = await requireUser();

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-navy)" }}>
        Welcome, {profile.fullname}
      </h2>
      <p style={{ marginTop: 8, color: "var(--color-text-muted)" }}>
        The rounding form isn&apos;t ported yet — this confirms auth and
        routing are wired up end to end.
      </p>
    </div>
  );
}
