// Excel export — ported from legacy/AIMS_QPS_v2.html's buildAndExportRound()
// (CDN SheetJS script tag) to the `xlsx` npm package. Sheet layout, column
// widths, and CAPA timeline wording are preserved exactly; this file is
// client-only (the workbook is generated and downloaded in the browser, same
// as legacy — nothing is uploaded to Supabase).
//
// `sections` (admin-managed content, see lib/sections-data.ts) is passed in
// by the caller rather than imported, and answers are looked up by item.id
// rather than array position — same reasoning as lib/scoring.ts. For a
// *completed* round, prefer the question/std/risk snapshotted onto each
// answer at save time (app/actions/rounds.ts's saveRound()) over the live
// `sections` lookup, so an export of a finalized round reflects exactly what
// was asked at the time, even if the content has since been edited.
"use client";

import * as XLSX from "xlsx";
import { RISK_LABELS, type Section, type RiskLevel } from "@/lib/sections";
import {
  sectionScore,
  COMPLIANCE_EXCELLENT,
  COMPLIANCE_GOOD,
  COMPLIANCE_NEEDS_IMPROVEMENT,
} from "@/lib/scoring";
import type { RoundState, RoundItemState } from "@/types/database";

export type ExportableRound = {
  dept: string | null;
  auditor: string | null;
  dateShift: string | null;
  state: RoundState;
};

// Snapshotted fields (present only on a saved/completed round's answers)
// win over the live section content, so a finalized export is immune to
// content edits made after the round was taken.
function answerQuestion(a: RoundItemState | undefined, liveQuestion: string): string {
  return a?.question ?? liveQuestion;
}
function answerStd(a: RoundItemState | undefined, liveStd: string): string {
  return a?.std ?? liveStd;
}
function answerRisk(a: RoundItemState | undefined, liveRisk: RiskLevel): RiskLevel {
  return a?.risk ?? liveRisk;
}
function answerSectionLabel(state: RoundState, sectionId: string, liveLabel: string): string {
  const firstAnswer = Object.values(state[sectionId] ?? {})[0];
  return firstAnswer?.sectionLabel ?? liveLabel;
}

function performanceLabel(pct: number | null): string {
  if (pct === null) return "—";
  if (pct >= COMPLIANCE_EXCELLENT) return "EXCELLENT";
  if (pct >= COMPLIANCE_GOOD) return "GOOD";
  if (pct >= COMPLIANCE_NEEDS_IMPROVEMENT) return "NEEDS IMPROVEMENT";
  return "CRITICAL";
}

export function buildRoundWorkbook(sections: Section[], round: ExportableRound): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const dept = round.dept || "Not specified";
  const auditor = round.auditor || "—";
  const dateStr = round.dateShift || "—";
  const state = round.state || {};

  // Summary sheet
  let totalScore = 0;
  let totalMax = 0;
  let totalItemCount = 0;
  const summaryRows: (string | number)[][] = [
    ["ARIA INSTITUTE OF MEDICAL SCIENCES (AIMS)"],
    ["DAILY QUALITY & PATIENT SAFETY ROUNDING CHECKLIST — AIMS-QPS-RC-001"],
    [""],
    ["Department:", dept, "Auditor:", auditor, "Date / Shift:", dateStr],
    [""],
    ["SECTION", "Items", "Score", "Max", "Compliance %", "Performance"],
  ];
  sections.forEach((section) => {
    const { score, max, pct } = sectionScore(section, state);
    totalScore += score;
    totalMax += max;
    totalItemCount += section.items.length;
    const label = answerSectionLabel(state, section.id, section.label);
    summaryRows.push([
      label,
      section.items.length,
      score,
      max,
      pct !== null ? `${pct}%` : "Not started",
      performanceLabel(pct),
    ]);
  });
  const overallPct = totalMax === 0 ? null : Math.round((totalScore / totalMax) * 100);
  summaryRows.push([""]);
  summaryRows.push([
    "OVERALL",
    totalItemCount,
    totalScore,
    totalMax,
    overallPct !== null ? `${overallPct}%` : "Not started",
    performanceLabel(overallPct),
  ]);
  const summaryWS = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWS["!cols"] = [{ wch: 38 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

  // CAPA tracker
  const capaRows: (string | number)[][] = [
    ["AIMS QPS — CAPA TRACKER"],
    ["Department:", dept, "Auditor:", auditor, "Date:", dateStr],
    [""],
    ["CAPA Timelines: Critical — 24h | High — 48h | Moderate — 7 days | Low — 30 days"],
    [""],
    [
      "#",
      "Section",
      "Risk",
      "Item",
      "Compliance",
      "Comments",
      "Responsible Person",
      "Root Cause",
      "Corrective Action",
      "Preventive Action",
      "Target Date",
      "Status",
    ],
  ];
  let n = 1;
  sections.forEach((section) => {
    const label = answerSectionLabel(state, section.id, section.label);
    section.items.forEach((item) => {
      const a = state[section.id]?.[item.id];
      if (a?.comp === "no" || a?.comp === "partial") {
        capaRows.push([
          n++,
          label,
          RISK_LABELS[answerRisk(a, item.risk)],
          answerQuestion(a, item.q),
          a.comp === "no" ? "Non-Compliant" : "Partial",
          a.note || "",
          a.person || "",
          "",
          "",
          "",
          "",
          "Open",
        ]);
      }
    });
  });
  if (n === 1) capaRows.push(["", "No non-compliant or partial items recorded."]);
  const capaWS = XLSX.utils.aoa_to_sheet(capaRows);
  capaWS["!cols"] = [
    { wch: 4 },
    { wch: 28 },
    { wch: 10 },
    { wch: 55 },
    { wch: 14 },
    { wch: 35 },
    { wch: 22 },
    { wch: 28 },
    { wch: 28 },
    { wch: 28 },
    { wch: 12 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, capaWS, "CAPA Tracker");

  // One sheet per section
  sections.forEach((section) => {
    const label = answerSectionLabel(state, section.id, section.label);
    const rows: (string | number)[][] = [
      [`AIMS DAILY QPS — ${label.toUpperCase()}`],
      ["Standard:", section.std],
      ["Department:", dept, "Auditor:", auditor, "Date:", dateStr],
      [""],
      ["#", "Audit Standard", "Audit Question", "Risk", "Compliance", "Comments", "Responsible Person"],
    ];
    section.items.forEach((item, i) => {
      const a = state[section.id]?.[item.id];
      const complianceLabel =
        a?.comp === "yes"
          ? "Yes — Compliant"
          : a?.comp === "partial"
            ? "Partial"
            : a?.comp === "no"
              ? "No — Non-Compliant"
              : a?.comp === "na"
                ? "N/A"
                : "Not Assessed";
      rows.push([
        i + 1,
        answerStd(a, item.std),
        answerQuestion(a, item.q),
        RISK_LABELS[answerRisk(a, item.risk)],
        complianceLabel,
        a?.note || "",
        a?.person || "",
      ]);
    });
    const { score, max, pct } = sectionScore(section, state);
    rows.push([""], ["", "Score:", `${score}/${max}`, "Compliance:", pct !== null ? `${pct}%` : "—", "", ""]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 4 }, { wch: 24 }, { wch: 62 }, { wch: 12 }, { wch: 18 }, { wch: 38 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      label.replace(/[^\w\s]/g, "").trim().substring(0, 31),
    );
  });

  return wb;
}

export function downloadRoundExport(sections: Section[], round: ExportableRound) {
  const wb = buildRoundWorkbook(sections, round);
  const dept = (round.dept || "Not-specified").replace(/[\s/\\]/g, "-");
  const fname = `AIMS-QPS-${dept}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

export type RoundHistoryEntry = {
  id: string;
  dept: string | null;
  dateShift: string | null;
  auditor: string | null;
  pct: number | null;
  totalItems: number | null;
  nonCompliant: number | null;
  partial: number | null;
  criticalNC: number | null;
  savedAt: string | null;
};

// Single-sheet summary of every round — ported from legacy's exportAllRounds().
export function buildAllRoundsWorkbook(rounds: RoundHistoryEntry[], generatedBy: string): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const rows: (string | number)[][] = [
    ["AIMS QPS — ALL ROUNDS EXPORT"],
    ["Generated:", new Date().toLocaleString("en-GB"), "By:", generatedBy],
    [""],
    ["Round ID", "Date / Shift", "Department", "Auditor", "Compliance %", "Total Items", "Non-Compliant", "Partial", "Critical NC", "Saved At"],
  ];
  rounds.forEach((r) => {
    rows.push([
      r.id,
      r.dateShift || "",
      r.dept || "",
      r.auditor || "",
      r.pct !== null ? `${r.pct}%` : "—",
      r.totalItems || 0,
      r.nonCompliant || 0,
      r.partial || 0,
      r.criticalNC || 0,
      r.savedAt ? new Date(r.savedAt).toLocaleString("en-GB") : "",
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "All Rounds");
  return wb;
}

export function downloadAllRoundsExport(rounds: RoundHistoryEntry[], generatedBy: string) {
  const wb = buildAllRoundsWorkbook(rounds, generatedBy);
  XLSX.writeFile(wb, `AIMS-QPS-AllRounds-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
