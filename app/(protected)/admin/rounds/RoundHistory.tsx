"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RISK_LABELS, type Section } from "@/lib/sections";
import { complianceBadgeTone, complianceColor } from "@/lib/scoring";
import { deleteRound } from "@/app/actions/admin-rounds";
import { downloadRoundExport, downloadAllRoundsExport } from "@/lib/export-round";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Badge from "@/components/Badge";
import type { RoundWithAuditor } from "@/lib/admin-data";

type Props = {
  rounds: RoundWithAuditor[];
  sections: Section[];
  generatedBy: string;
};

export default function RoundHistory({ rounds, sections, generatedBy }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const viewingRound = rounds.find((r) => r.id === viewingId);
  const deletingRound = rounds.find((r) => r.id === deletingId);

  function handleExport(round: RoundWithAuditor) {
    downloadRoundExport(sections, {
      dept: round.dept,
      auditor: round.auditorName,
      dateShift: round.date_shift,
      state: round.state,
    });
  }

  function handleExportAll() {
    downloadAllRoundsExport(
      rounds.map((r) => ({
        id: r.id,
        dept: r.dept,
        dateShift: r.date_shift,
        auditor: r.auditorName,
        pct: r.pct,
        totalItems: r.total_items,
        nonCompliant: r.non_compliant,
        partial: r.partial,
        criticalNC: r.critical_nc,
        savedAt: r.saved_at,
      })),
      generatedBy,
    );
  }

  function handleConfirmDelete() {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteRound(deletingId);
      if ("error" in result) {
        setDeleteError(result.error);
        return;
      }
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <Card
      title="Round History & Audit Log"
      headerExtra={
        rounds.length > 0 ? (
          <button type="button" className="tbl-btn" onClick={handleExportAll}>
            Export All to Excel
          </button>
        ) : undefined
      }
      bodyStyle={{ padding: 0 }}
    >
      {rounds.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--color-text-faint)" }}>
          No completed rounds yet. Start auditing to see history here.
        </div>
      ) : (
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Round ID</th>
              <th>Date / Shift</th>
              <th>Department</th>
              <th>Auditor</th>
              <th>Compliance</th>
              <th>Items</th>
              <th>Non-Compliant</th>
              <th>Partial</th>
              <th>Critical Findings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r.id}>
                <td style={{ fontSize: 10, color: "var(--color-text-faint)", fontWeight: 600 }}>{r.id.slice(0, 8)}</td>
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
                <td style={{ fontSize: 11 }}>{r.total_items || 0}</td>
                <td style={{ fontSize: 11, color: "var(--color-danger)", fontWeight: 700 }}>{r.non_compliant || 0}</td>
                <td style={{ fontSize: 11, color: "var(--color-warning)", fontWeight: 700 }}>{r.partial || 0}</td>
                <td style={{ fontSize: 11, color: "var(--color-danger)" }}>{r.critical_nc || 0} critical</td>
                <td style={{ display: "flex", gap: 5 }}>
                  <button type="button" className="tbl-btn edit" onClick={() => setViewingId(r.id)}>
                    View
                  </button>
                  <button type="button" className="tbl-btn" onClick={() => handleExport(r)}>
                    Export
                  </button>
                  <button
                    type="button"
                    className="tbl-btn del"
                    onClick={() => {
                      setDeletingId(r.id);
                      setDeleteError(null);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {viewingRound && (
        <Modal width={600} style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClose={() => setViewingId(null)}>
          <div style={{ overflowY: "auto" }}>
            <h2>
              Round: {viewingRound.dept || "—"} — {viewingRound.date_shift || viewingRound.id}
            </h2>
            <table style={{ width: "100%", fontSize: 12, marginBottom: 16, borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "4px 0", color: "var(--color-text-muted)", width: 140 }}>Department</td>
                  <td>
                    <strong>{viewingRound.dept || "—"}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "var(--color-text-muted)" }}>Auditor</td>
                  <td>{viewingRound.auditorName}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "var(--color-text-muted)" }}>Date / Shift</td>
                  <td>{viewingRound.date_shift || "—"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "var(--color-text-muted)" }}>Saved At</td>
                  <td>{viewingRound.saved_at ? new Date(viewingRound.saved_at).toLocaleString("en-GB") : "—"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "var(--color-text-muted)" }}>Overall Compliance</td>
                  <td>
                    <strong style={{ color: complianceColor(viewingRound.pct) }}>
                      {viewingRound.pct !== null ? `${viewingRound.pct}%` : "Not fully assessed"}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "var(--color-text-muted)" }}>Non-Compliant Items</td>
                  <td style={{ color: "var(--color-danger)", fontWeight: 700 }}>{viewingRound.non_compliant || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "var(--color-text-muted)" }}>Partial Items</td>
                  <td style={{ color: "var(--color-warning)", fontWeight: 700 }}>{viewingRound.partial || 0}</td>
                </tr>
              </tbody>
            </table>

            {(viewingRound.non_compliant ?? 0) > 0 || (viewingRound.partial ?? 0) > 0 ? (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-danger)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Non-Compliant &amp; Partial Items
                </div>
                {sections.map((section) => {
                  const sectionState = viewingRound.state?.[section.id];
                  if (!sectionState) return null;
                  return section.items.map((item) => {
                    // Prefer the snapshot saved onto the answer at finalize
                    // time — it's what was actually asked, even if the live
                    // question has since been edited by an admin.
                    const st = sectionState[item.id];
                    if (!st || (st.comp !== "no" && st.comp !== "partial")) return null;
                    const risk = st.risk ?? item.risk;
                    const question = st.question ?? item.q;
                    return (
                      <div
                        key={`${section.id}-${item.id}`}
                        style={{
                          background: st.comp === "no" ? "var(--color-danger-bg)" : "var(--color-warning-bg)",
                          borderRadius: 5,
                          padding: "7px 10px",
                          marginBottom: 5,
                          fontSize: 11,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: st.comp === "no" ? "var(--color-danger-text)" : "var(--color-warning-text)",
                          }}
                        >
                          {st.comp === "no" ? "✗ Non-Compliant" : "~ Partial"} · {RISK_LABELS[risk]} Risk
                        </div>
                        <div style={{ color: "var(--color-text)", marginTop: 2 }}>{question}</div>
                        {st.note && (
                          <div style={{ color: "var(--color-text-muted)", marginTop: 3, fontStyle: "italic" }}>
                            {st.note}
                          </div>
                        )}
                        {st.person && (
                          <div style={{ color: "var(--color-teal)", marginTop: 2, fontWeight: 600 }}>
                            Responsible: {st.person}
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </>
            ) : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setViewingId(null)}>
              Close
            </button>
            <button type="button" className="btn-confirm safe" onClick={() => handleExport(viewingRound)}>
              Export this Round
            </button>
          </div>
        </Modal>
      )}

      {deletingRound && (
        <ConfirmDialog
          title="Delete Round"
          message={
            <>
              Delete this round record ({deletingRound.dept || "—"} · {deletingRound.date_shift || deletingRound.id})?
              This cannot be undone.
            </>
          }
          confirmLabel="Delete Round"
          isPending={isPending}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </Card>
  );
}
