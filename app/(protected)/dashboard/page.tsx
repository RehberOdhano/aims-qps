import Link from "next/link";
import { ClipboardCheck, CalendarCheck, Percent } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getMyRoundStats, getMyDrafts } from "@/lib/rounds-data";
import { complianceBadgeTone } from "@/lib/scoring";
import Card from "@/components/Card";
import Badge from "@/components/Badge";

// Icon carries the status color; value/label text stays in text tokens
// (never colored by the stat itself) — the tone still reads clearly from
// the icon circle alone, backed by the label beside it.
function toneColors(tone: ReturnType<typeof complianceBadgeTone>): { bg: string; color: string } {
  switch (tone) {
    case "success":
      return { bg: "var(--color-success-bg)", color: "var(--color-success)" };
    case "warning":
      return { bg: "var(--color-warning-bg)", color: "var(--color-warning)" };
    case "danger":
      return { bg: "var(--color-danger-bg)", color: "var(--color-danger)" };
    default:
      return { bg: "var(--color-bg)", color: "var(--color-text-faint)" };
  }
}

export default async function DashboardPage() {
  const profile = await requireUser();

  const [drafts, stats] = await Promise.all([getMyDrafts(profile.id), getMyRoundStats(profile.id)]);
  const complianceTone = complianceBadgeTone(stats.lastRound?.pct ?? null);
  const complianceColors = toneColors(complianceTone);

  return (
    <div>
      <Card
        title={`Welcome, ${profile.fullname}`}
        headerExtra={
          drafts.length > 0 ? (
            <Link href="/round" className="tbl-btn edit">
              + Start Another Round
            </Link>
          ) : undefined
        }
      >
        {drafts.length === 0 ? (
          <>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No round in progress right now.</p>
            <div style={{ marginTop: 14 }}>
              <Link
                href="/round"
                className="btn-primary"
                style={{ display: "inline-flex", width: "auto", padding: "9px 20px", textDecoration: "none" }}
              >
                Start a Round
              </Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 10 }}>
              {drafts.length === 1 ? "You have 1 round in progress:" : `You have ${drafts.length} rounds in progress:`}
            </p>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Date / Shift</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.dept || "Not specified"}</strong>
                      </td>
                      <td style={{ fontSize: 11 }}>{d.dateShift || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/round?draft=${d.id}`} className="tbl-btn edit">
                          Continue
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <div className="stat-row" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(27, 58, 107, 0.1)" }}>
            <ClipboardCheck size={18} strokeWidth={2} color="var(--color-navy)" />
          </div>
          <div className="stat-card-body">
            <div className="val">{stats.totalCompleted}</div>
            <div className="lbl">Rounds completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(14, 124, 123, 0.12)" }}>
            <CalendarCheck size={18} strokeWidth={2} color="var(--color-teal)" />
          </div>
          <div className="stat-card-body">
            <div className="val">{stats.completedThisMonth}</div>
            <div className="lbl">This month</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: complianceColors.bg }}>
            <Percent size={18} strokeWidth={2} color={complianceColors.color} />
          </div>
          <div className="stat-card-body">
            <div className="val">
              {stats.lastRound?.pct !== null && stats.lastRound?.pct !== undefined ? `${stats.lastRound.pct}%` : "—"}
            </div>
            <div className="lbl">Last compliance</div>
          </div>
        </div>
      </div>

      {stats.lastRound && (
        <Card title="Most Recent Round" style={{ marginTop: 20 }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 0", color: "var(--color-text-muted)", width: 140 }}>Department</td>
                <td>
                  <strong>{stats.lastRound.dept || "—"}</strong>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: "var(--color-text-muted)" }}>Date / Shift</td>
                <td>{stats.lastRound.dateShift || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: "var(--color-text-muted)" }}>Compliance</td>
                <td>
                  <Badge tone={complianceBadgeTone(stats.lastRound.pct)}>
                    {stats.lastRound.pct !== null ? `${stats.lastRound.pct}%` : "—"}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
