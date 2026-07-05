import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getAllProfiles, getAllRoundsWithAuditor, computeAdminStats } from "@/lib/admin-data";
import { complianceBadgeTone } from "@/lib/scoring";
import Card from "@/components/Card";
import Badge from "@/components/Badge";

export default async function AdminDashboardPage() {
  await requireRole("admin");

  const [profiles, rounds] = await Promise.all([getAllProfiles(), getAllRoundsWithAuditor()]);
  const stats = computeAdminStats(profiles, rounds);
  const recentRounds = rounds.slice(0, 5);

  return (
    <div>
      <div className="stat-row">
        <div className="stat-box">
          <div className="val">{stats.totalUsers}</div>
          <div className="lbl">Total Users</div>
        </div>
        <div className="stat-box">
          <div className="val">{stats.activeUsers}</div>
          <div className="lbl">Active Users</div>
        </div>
        <div className="stat-box">
          <div className="val">{stats.totalRounds}</div>
          <div className="lbl">Rounds Saved</div>
        </div>
        <div className="stat-box">
          <div className="val">{stats.roundsThisMonth}</div>
          <div className="lbl">Rounds This Month</div>
        </div>
      </div>

      <Card
        title="Recent Rounds"
        headerExtra={
          recentRounds.length > 0 ? (
            <Link href="/admin/rounds" className="tbl-btn">
              View all
            </Link>
          ) : undefined
        }
        bodyStyle={{ padding: 0 }}
      >
        {recentRounds.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--color-text-faint)" }}>
            No completed rounds yet. Start auditing to see history here.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date / Shift</th>
                <th>Department</th>
                <th>Auditor</th>
                <th>Compliance</th>
              </tr>
            </thead>
            <tbody>
              {recentRounds.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontSize: 11 }}>
                    {r.date_shift || (r.saved_at ? new Date(r.saved_at).toLocaleString("en-GB") : "—")}
                  </td>
                  <td>
                    <strong>{r.dept || "—"}</strong>
                  </td>
                  <td style={{ fontSize: 11 }}>{r.auditorName}</td>
                  <td>
                    <Badge tone={complianceBadgeTone(r.pct)}>{r.pct !== null ? `${r.pct}%` : "—"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
