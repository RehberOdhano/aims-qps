"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Save, RotateCcw } from "lucide-react";
import { SECTIONS, DEPARTMENTS, RISK_LABELS, type Section } from "@/lib/sections";
import { sectionScore, overallScore } from "@/lib/scoring";
import { autosaveDraft, saveRound, startNewRound } from "@/app/actions/rounds";
import { downloadRoundExport } from "@/lib/export-round";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Database, RoundState, RoundItemState } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];

type Props = {
  profile: Profile;
  draft: RoundRow | null;
};

function buildInitialState(existing?: RoundState): RoundState {
  const state: RoundState = {};
  SECTIONS.forEach((section) => {
    state[section.id] = {};
    section.items.forEach((_, i) => {
      state[section.id][i] = existing?.[section.id]?.[i] ?? { comp: null, note: "", person: "" };
    });
  });
  return state;
}

const SHIFTS = ["Morning", "Evening", "Night"] as const;
type Shift = (typeof SHIFTS)[number];

// The `rounds.date_shift` column stays a single text field (no migration
// needed) — these two helpers just move the *input* from free text to a
// structured date + shift picker, combining/splitting a formatted string
// ("05 Jul 2026 · Morning") at the boundary.
function todayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateShift(date: string, shift: Shift): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const formatted = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${formatted} · ${shift}`;
}

function parseDateShift(value: string | null | undefined): { date: string; shift: Shift } {
  const fallback = { date: todayInputValue(), shift: "Morning" as Shift };
  if (!value) return fallback;
  const [datePart, shiftPart] = value.split("·").map((s) => s.trim());
  const shift = SHIFTS.find((s) => s.toLowerCase() === (shiftPart ?? "").toLowerCase()) ?? fallback.shift;
  const parsed = datePart ? new Date(datePart) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return { date: fallback.date, shift };
  return {
    date: `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`,
    shift,
  };
}

function meterFillColor(pct: number | null): string {
  if (pct === null) return "rgba(255,255,255,0.2)";
  if (pct >= 95) return "#3DC990";
  if (pct >= 90) return "#5BC0BE";
  if (pct >= 80) return "#EFB44B";
  return "#E07070";
}

function meterStatus(pct: number | null): { text: string; color: string } {
  if (pct === null) return { text: "No items scored yet", color: "var(--color-accent-blue)" };
  if (pct >= 95) return { text: "● Excellent", color: "#3DC990" };
  if (pct >= 90) return { text: "● Good", color: "#82C79A" };
  if (pct >= 80) return { text: "● Needs Improvement", color: "#EFB44B" };
  return { text: "● Critical — Escalate now", color: "#E07070" };
}

function navDotClass(pct: number | null): string {
  if (pct === null) return "";
  if (pct >= 80) return "g";
  if (pct >= 60) return "a";
  return "r";
}

function sectionBarColor(pct: number | null): string {
  if (pct === null) return "var(--color-text-faint)";
  if (pct >= 95) return "var(--color-success)";
  if (pct >= 80) return "var(--color-warning)";
  return "var(--color-danger)";
}

const SECTION_GROUPS: { grp: Section["grp"]; sections: Section[] }[] = (() => {
  const groups: { grp: Section["grp"]; sections: Section[] }[] = [];
  SECTIONS.forEach((section) => {
    let group = groups.find((g) => g.grp === section.grp);
    if (!group) {
      group = { grp: section.grp, sections: [] };
      groups.push(group);
    }
    group.sections.push(section);
  });
  return groups;
})();

export default function RoundClient({ profile, draft }: Props) {
  const [dept, setDept] = useState(draft?.dept ?? "");
  const [date, setDate] = useState(() => parseDateShift(draft?.date_shift).date);
  const [shift, setShift] = useState<Shift>(() => parseDateShift(draft?.date_shift).shift);
  const dateShift = formatDateShift(date, shift);
  const [auditState, setAuditState] = useState<RoundState>(() => buildInitialState(draft?.state));
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [banner, setBanner] = useState<string | null>(null);
  const [showNewRoundConfirm, setShowNewRoundConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Debounced autosave — every change updates React state instantly (same
  // feel as legacy's synchronous localStorage write), but persistence to
  // Supabase waits for a pause in typing/clicking so we're not round-tripping
  // on every keystroke.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAutosaveState("saving");
      autosaveDraft({ state: auditState, dept, dateShift }).then((result) => {
        setAutosaveState("error" in result ? "error" : "saved");
      });
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [auditState, dept, dateShift]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 3500);
    return () => clearTimeout(t);
  }, [banner]);

  function setItemField(sectionId: string, i: number, patch: Partial<RoundItemState>) {
    setAuditState((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [i]: { ...prev[sectionId][i], ...patch },
      },
    }));
  }

  function handleSaveRound() {
    startTransition(async () => {
      const result = await saveRound({ state: auditState, dept, dateShift });
      if ("error" in result) {
        setBanner(result.error);
        return;
      }
      setBanner(`Round saved: ${dept || "Not specified"} · ${dateShift || "—"}`);
      setAuditState(buildInitialState());
      setActiveSection(null);
      setAutosaveState("idle");
    });
  }

  function handleConfirmNewRound() {
    setShowNewRoundConfirm(false);
    startTransition(async () => {
      const result = await startNewRound();
      if ("error" in result) {
        setBanner(result.error);
        return;
      }
      setAuditState(buildInitialState());
      setDept("");
      setDate(todayInputValue());
      setShift("Morning");
      setActiveSection(null);
      setAutosaveState("idle");
      setBanner("New round started");
    });
  }

  function handleExport() {
    downloadRoundExport({ dept, auditor: profile.fullname, dateShift, state: auditState });
    setBanner("Excel exported");
  }

  const { pct: overallPct } = overallScore(auditState);
  const status = meterStatus(overallPct);
  const section = activeSection ? SECTIONS.find((s) => s.id === activeSection) : null;
  const sectionStats = section ? sectionScore(section, auditState) : null;

  return (
    <div className="round-body">
      <div className="sidebar">
        {profile.role === "admin" && (
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 12px",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-accent-blue)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back
          </Link>
        )}
        <div className="sb-meta">
          <label>Department / Unit</label>
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">Select department…</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <label>Shift</label>
          <select value={shift} onChange={(e) => setShift(e.target.value as Shift)}>
            {SHIFTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="meter-box">
          <div className="meter-label">Overall compliance</div>
          <div className="meter-bar">
            <div
              className="meter-fill"
              style={{ width: `${overallPct ?? 0}%`, background: meterFillColor(overallPct) }}
            />
          </div>
          <div className="meter-pct">{overallPct !== null ? `${overallPct}%` : "—"}</div>
          <div className="meter-status" style={{ color: status.color }}>
            {status.text}
          </div>
          <div style={{ fontSize: 9, color: "var(--color-accent-blue)", opacity: 0.7, marginTop: 4 }}>
            {autosaveState === "saving" && "Saving…"}
            {autosaveState === "saved" && "All changes saved"}
            {autosaveState === "error" && "Autosave failed — check connection"}
          </div>
        </div>
        <div className="nav-list">
          {SECTION_GROUPS.map(({ grp, sections }) => (
            <div key={grp}>
              <div className="nav-grp">{grp}</div>
              {sections.map((s) => {
                const { pct } = sectionScore(s, auditState);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`nav-item${activeSection === s.id ? " active" : ""}`}
                    onClick={() => setActiveSection(s.id)}
                  >
                    <span className={`nav-dot ${navDotClass(pct)}`} />
                    <span style={{ flex: 1, lineHeight: 1.3 }}>{s.label}</span>
                    <span className="nav-pct">{pct !== null ? `${pct}%` : ""}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="sb-actions">
          <button type="button" className="sb-btn btn-export" onClick={handleExport}>
            <Download size={14} strokeWidth={2} />
            Export to Excel
          </button>
          <Button
            className="sb-btn"
            style={{ background: "var(--color-navy)", color: "#fff" }}
            onClick={handleSaveRound}
            isLoading={isPending}
            loadingLabel="Saving…"
          >
            <Save size={14} strokeWidth={2} />
            Save Round
          </Button>
          <button
            type="button"
            className="sb-btn btn-reset"
            onClick={() => setShowNewRoundConfirm(true)}
            disabled={isPending}
          >
            <RotateCcw size={14} strokeWidth={2} />
            New Round
          </button>
        </div>
      </div>

      <div className="main-area">
        <div className="sec-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div className="sec-title">{section ? section.label : "Select a section to begin"}</div>
              <div className="sec-std">
                {section ? `${section.std} · ${section.items.length} items` : "Click any section in the left panel"}
              </div>
            </div>
            {sectionStats && (
              <div className="sec-counts">
                <Badge tone="success">✓ {sectionStats.yes}</Badge>
                <Badge tone="warning">~ {sectionStats.partial}</Badge>
                <Badge tone="danger">✗ {sectionStats.no}</Badge>
              </div>
            )}
          </div>
          <div className="sec-score-row">
            <div className="sec-bar-wrap">
              <div
                className="sec-bar-fill"
                style={{
                  width: `${sectionStats?.pct ?? 0}%`,
                  background: sectionBarColor(sectionStats?.pct ?? null),
                }}
              />
            </div>
            <div
              className="sec-pct-label"
              style={{ color: sectionBarColor(sectionStats?.pct ?? null) }}
            >
              {sectionStats?.pct !== null && sectionStats?.pct !== undefined ? `${sectionStats.pct}%` : "—"}
            </div>
          </div>
        </div>

        <div className="scroll-area">
          {!section && (
            <div className="empty-state">
              <h3>Ready to begin rounding</h3>
              <p>Select a section from the left panel. Fill in the department and date before saving or exporting.</p>
            </div>
          )}
          {section &&
            section.items.map((item, i) => {
              const st = auditState[section.id]?.[i] ?? { comp: null, note: "", person: "" };
              const rowClass =
                st.comp === "no" ? " nc" : st.comp === "partial" ? " partial" : st.comp === "yes" ? " compliant" : "";
              return (
                <div key={i} className={`audit-row${rowClass}`}>
                  <div className="row-top">
                    <span className="row-num">{i + 1}</span>
                    <span className="row-std">{item.std}</span>
                    <span className="row-q">{item.q}</span>
                    <span className={`risk-tag risk-${item.risk}`}>{RISK_LABELS[item.risk]}</span>
                  </div>
                  <div className="row-controls">
                    <div className="comp-btns">
                      {(["yes", "partial", "no", "na"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          className={`comp-btn${st.comp === v ? ` sel-${v}` : ""}`}
                          onClick={() => setItemField(section.id, i, { comp: v })}
                        >
                          {v === "yes" ? "✓ Yes" : v === "partial" ? "~ Partial" : v === "no" ? "✗ No" : "N/A"}
                        </button>
                      ))}
                    </div>
                    <input
                      className="row-note"
                      placeholder="Comments / action required…"
                      value={st.note}
                      onChange={(e) => setItemField(section.id, i, { note: e.target.value })}
                    />
                    <input
                      className="person-input"
                      placeholder="Responsible person…"
                      value={st.person}
                      onChange={(e) => setItemField(section.id, i, { person: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {banner && <div className="toast-banner">{banner}</div>}

      {showNewRoundConfirm && (
        <ConfirmDialog
          title="Start New Round"
          message="Start a new round? The current round will be lost unless you saved it first."
          confirmLabel="Start New Round"
          tone="safe"
          isPending={isPending}
          onConfirm={handleConfirmNewRound}
          onCancel={() => setShowNewRoundConfirm(false)}
        />
      )}
    </div>
  );
}
