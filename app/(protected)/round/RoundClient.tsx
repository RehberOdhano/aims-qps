"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Save, RotateCcw, Check, Minus, X, Ban, type LucideIcon } from "lucide-react";
import { RISK_LABELS, type Section } from "@/lib/sections";
import {
  sectionScore,
  overallScore,
  complianceColor,
  COMPLIANCE_EXCELLENT,
  COMPLIANCE_GOOD,
  COMPLIANCE_NEEDS_IMPROVEMENT,
} from "@/lib/scoring";
import { autosaveDraft, saveRound } from "@/app/actions/rounds";
import { downloadRoundExport } from "@/lib/export-round";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useSidebar, SidebarBackdrop } from "@/components/MobileSidebar";
import type { Database, RoundState, RoundItemState } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type RoundRow = Database["public"]["Tables"]["rounds"]["Row"];

type Props = {
  profile: Profile;
  draft: RoundRow | null;
  sections: Section[];
  departments: string[];
};

function buildInitialState(sections: Section[], existing?: RoundState): RoundState {
  const state: RoundState = {};
  sections.forEach((section) => {
    state[section.id] = {};
    section.items.forEach((item) => {
      state[section.id][item.id] = existing?.[section.id]?.[item.id] ?? { comp: null, note: "", person: "" };
    });
  });
  return state;
}

const SHIFTS = ["Morning", "Evening", "Night"] as const;
type Shift = (typeof SHIFTS)[number];

const COMP_OPTIONS: { value: "yes" | "partial" | "no" | "na"; label: string; icon: LucideIcon }[] = [
  { value: "yes", label: "Yes", icon: Check },
  { value: "partial", label: "Partial", icon: Minus },
  { value: "no", label: "No", icon: X },
  { value: "na", label: "N/A", icon: Ban },
];

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
  if (pct >= COMPLIANCE_EXCELLENT) return "#3DC990";
  if (pct >= COMPLIANCE_GOOD) return "#5BC0BE";
  if (pct >= COMPLIANCE_NEEDS_IMPROVEMENT) return "#EFB44B";
  return "#E07070";
}

function meterStatus(pct: number | null): { text: string; color: string } {
  if (pct === null) return { text: "No items scored yet", color: "var(--color-accent-blue)" };
  if (pct >= COMPLIANCE_EXCELLENT) return { text: "● Excellent", color: "#3DC990" };
  if (pct >= COMPLIANCE_GOOD) return { text: "● Good", color: "#82C79A" };
  if (pct >= COMPLIANCE_NEEDS_IMPROVEMENT) return { text: "● Needs Improvement", color: "#EFB44B" };
  return { text: "● Critical — Escalate now", color: "#E07070" };
}

// Deliberately its own coarser scale (not the JCI compliance bands above) —
// a quick red/amber/green glance at section health in the sidebar nav list.
function navDotClass(pct: number | null): string {
  if (pct === null) return "";
  if (pct >= 80) return "g";
  if (pct >= 60) return "a";
  return "r";
}

function groupSections(sections: Section[]): { grp: Section["grp"]; sections: Section[] }[] {
  const groups: { grp: Section["grp"]; sections: Section[] }[] = [];
  sections.forEach((section) => {
    let group = groups.find((g) => g.grp === section.grp);
    if (!group) {
      group = { grp: section.grp, sections: [] };
      groups.push(group);
    }
    group.sections.push(section);
  });
  return groups;
}

export default function RoundClient({ profile, draft, sections, departments }: Props) {
  const router = useRouter();
  const [roundId, setRoundId] = useState<string | null>(draft?.id ?? null);
  const [dept, setDept] = useState(draft?.dept ?? "");
  const [date, setDate] = useState(() => parseDateShift(draft?.date_shift).date);
  const [shift, setShift] = useState<Shift>(() => parseDateShift(draft?.date_shift).shift);
  const dateShift = formatDateShift(date, shift);
  const [auditState, setAuditState] = useState<RoundState>(() => buildInitialState(sections, draft?.state));
  const SECTION_GROUPS = groupSections(sections);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [banner, setBanner] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { isOpen: sidebarOpen, close: closeSidebar } = useSidebar();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set explicitly by the actual mutation handlers below (never by this
  // effect), so it reflects a real user edit rather than "how many times has
  // this effect run" — a naive isFirstRender-on-mount guard looks equivalent
  // in production, but React Strict Mode's dev-only double-invocation of
  // effects defeats it: the second invocation sees the guard already
  // flipped and fires anyway, silently creating an empty draft row before
  // the user has touched anything.
  const hasUserInteracted = useRef(false);
  // Guards against a narrow race on a brand-new round's very first save:
  // two edits close enough together that the second timer fires before the
  // first insert's response comes back would otherwise both see
  // `roundId === null` and each insert their own row. While a first-ever
  // insert is in flight, later firings just wait — once it resolves and
  // `roundId` is set, the effect reruns and the next debounce correctly
  // updates that same row instead of creating another one.
  const isCreatingRef = useRef(false);

  // Debounced autosave — every change updates React state instantly (same
  // feel as legacy's synchronous localStorage write), but persistence to
  // Supabase waits for a pause in typing/clicking so we're not round-tripping
  // on every keystroke.
  useEffect(() => {
    if (!hasUserInteracted.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!roundId && isCreatingRef.current) return;
      if (!roundId) isCreatingRef.current = true;
      setAutosaveState("saving");
      autosaveDraft({ roundId: roundId ?? undefined, state: auditState, dept, dateShift }).then((result) => {
        isCreatingRef.current = false;
        if ("error" in result) {
          setAutosaveState("error");
          return;
        }
        setAutosaveState("saved");
        // First-ever save of a brand-new round — remember its id so later
        // autosaves update this same row, and reflect it in the URL so a
        // refresh resumes this draft instead of showing blank.
        if (!roundId) {
          setRoundId(result.id);
          router.replace(`/round?draft=${result.id}`, { scroll: false });
        }
      });
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [auditState, dept, dateShift, roundId, router]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 3500);
    return () => clearTimeout(t);
  }, [banner]);

  function setItemField(sectionId: string, itemId: string, patch: Partial<RoundItemState>) {
    hasUserInteracted.current = true;
    setAuditState((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [itemId]: { ...prev[sectionId][itemId], ...patch },
      },
    }));
  }

  function handleDeptChange(value: string) {
    hasUserInteracted.current = true;
    setDept(value);
  }

  function handleDateChange(value: string) {
    hasUserInteracted.current = true;
    setDate(value);
  }

  function handleShiftChange(value: Shift) {
    hasUserInteracted.current = true;
    setShift(value);
  }

  // Gate before finalizing: a department is required outright (the button is
  // also disabled without one, this is just a defensive double-check), and
  // saving with zero items assessed gets a confirmation rather than a silent
  // no-op completed round — `overallPct` is null exactly when nothing has
  // been scored yes/partial/no yet.
  function handleSaveClick() {
    if (!dept) return;
    if (overallPct === null) {
      setShowEmptyConfirm(true);
      return;
    }
    handleSaveRound();
  }

  function handleSaveRound() {
    startTransition(async () => {
      const result = await saveRound({ roundId: roundId ?? undefined, state: auditState, dept, dateShift });
      if ("error" in result) {
        setBanner(result.error);
        return;
      }
      setBanner(`Round saved: ${dept || "Not specified"} · ${dateShift || "—"}`);
      // Reset to a blank slate for the next round — and require a genuine
      // edit before autosaving it, so finishing a round doesn't immediately
      // persist an empty draft nobody's touched yet.
      hasUserInteracted.current = false;
      setRoundId(null);
      setAuditState(buildInitialState(sections));
      setActiveSection(null);
      setAutosaveState("idle");
      router.replace("/round", { scroll: false });
    });
  }

  // An auditor can have several drafts at once (see
  // 0005_allow_multiple_drafts.sql), so starting another one no longer
  // discards anything — it's a plain client-side reset, no server call and
  // no confirmation needed, since the current draft (if any) stays exactly
  // as autosaved.
  function handleNewRound() {
    hasUserInteracted.current = false;
    setRoundId(null);
    setAuditState(buildInitialState(sections));
    setDept("");
    setDate(todayInputValue());
    setShift("Morning");
    setActiveSection(null);
    setAutosaveState("idle");
    router.replace("/round", { scroll: false });
    setBanner("Started a new round — your other drafts are still saved.");
  }

  function handleExport() {
    downloadRoundExport(sections, { dept, auditor: profile.fullname, dateShift, state: auditState });
    setBanner("Excel exported");
  }

  const { pct: overallPct } = overallScore(sections, auditState);
  const status = meterStatus(overallPct);
  const section = activeSection ? sections.find((s) => s.id === activeSection) : null;
  const sectionStats = section ? sectionScore(section, auditState) : null;

  return (
    <div className="round-body">
      <SidebarBackdrop />
      <div className={`sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        <Link
          href={profile.role === "admin" ? "/admin" : "/dashboard"}
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
        <div className="sb-meta">
          <label>Department / Unit</label>
          <select value={dept} onChange={(e) => handleDeptChange(e.target.value)}>
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} />
          <label>Shift</label>
          <select value={shift} onChange={(e) => handleShiftChange(e.target.value as Shift)}>
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
                    onClick={() => {
                      setActiveSection(s.id);
                      closeSidebar();
                    }}
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
            onClick={handleSaveClick}
            isLoading={isPending}
            loadingLabel="Saving…"
            disabled={!dept}
          >
            <Save size={14} strokeWidth={2} />
            Save Round
          </Button>
          {!dept && (
            <div style={{ fontSize: 9, color: "var(--color-accent-blue)", opacity: 0.7, textAlign: "center" }}>
              Select a department before saving
            </div>
          )}
          <button type="button" className="sb-btn btn-reset" onClick={handleNewRound} disabled={isPending}>
            <RotateCcw size={14} strokeWidth={2} />
            Start Another Round
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
                  background: complianceColor(sectionStats?.pct ?? null),
                }}
              />
            </div>
            <div
              className="sec-pct-label"
              style={{ color: complianceColor(sectionStats?.pct ?? null) }}
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
              const st = auditState[section.id]?.[item.id] ?? { comp: null, note: "", person: "" };
              const rowClass =
                st.comp === "no" ? " nc" : st.comp === "partial" ? " partial" : st.comp === "yes" ? " compliant" : "";
              return (
                <div key={item.id} className={`audit-row${rowClass}`}>
                  <div className="row-top">
                    <span className="row-num">{i + 1}</span>
                    <span className="row-std">{item.std}</span>
                    <span className="row-q">{item.q}</span>
                    <span className={`risk-tag risk-${item.risk}`}>{RISK_LABELS[item.risk]}</span>
                  </div>
                  <div className="row-controls">
                    <div className="comp-btns">
                      {COMP_OPTIONS.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          className={`comp-btn${st.comp === value ? ` sel-${value}` : ""}`}
                          onClick={() => setItemField(section.id, item.id, { comp: value })}
                        >
                          <Icon size={12} strokeWidth={2.75} />
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      className="row-note"
                      placeholder="Comments / action required…"
                      value={st.note}
                      onChange={(e) => setItemField(section.id, item.id, { note: e.target.value })}
                    />
                    <input
                      className="person-input"
                      placeholder="Responsible person…"
                      value={st.person}
                      onChange={(e) => setItemField(section.id, item.id, { person: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {banner && <div className="toast-banner">{banner}</div>}

      {showEmptyConfirm && (
        <ConfirmDialog
          title="Save Incomplete Round?"
          message="No items have been assessed yet (everything is still unanswered or N/A). Save this round anyway?"
          confirmLabel="Save Anyway"
          tone="safe"
          isPending={isPending}
          onConfirm={() => {
            setShowEmptyConfirm(false);
            handleSaveRound();
          }}
          onCancel={() => setShowEmptyConfirm(false)}
        />
      )}
    </div>
  );
}
