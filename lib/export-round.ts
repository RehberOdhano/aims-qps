// Excel export — ported from legacy/AIMS_QPS_v2.html's buildAndExportRound()
// (CDN SheetJS script tag) to the `xlsx` npm package. Sheet layout, column
// widths, and CAPA timeline wording are preserved exactly; this file is
// client-only (the workbook is generated and downloaded in the browser, same
// as legacy — nothing is uploaded to Supabase).
"use client";

import * as XLSX from "xlsx";
import { SECTIONS, RISK_LABELS } from "@/lib/sections";
import type { RoundState } from "@/types/database";

export type ExportableRound = {
  dept: string | null;
  auditor: string | null;
  dateShift: string | null;
  state: RoundState;
};

function performanceLabel(pct: number | null): string {
  if (pct === null) return "—";
  if (pct >= 95) return "EXCELLENT";
  if (pct >= 90) return "GOOD";
  if (pct >= 80) return "NEEDS IMPROVEMENT";
  return "CRITICAL";
}

export function buildRoundWorkbook(round: ExportableRound): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const dept = round.dept || "Not specified";
  const auditor = round.auditor || "—";
  const dateStr = round.dateShift || "—";
  const state = round.state || {};

  // Summary sheet
  let totalScore = 0;
  let totalMax = 0;
  const summaryRows: (string | number)[][] = [
    ["ARIA INSTITUTE OF MEDICAL SCIENCES (AIMS)"],
    ["DAILY QUALITY & PATIENT SAFETY ROUNDING CHECKLIST — AIMS-QPS-RC-001"],
    [""],
    ["Department:", dept, "Auditor:", auditor, "Date / Shift:", dateStr],
    [""],
    ["SECTION", "Items", "Score", "Max", "Compliance %", "Performance"],
  ];
  SECTIONS.forEach((section) => {
    let score = 0;
    let max = 0;
    section.items.forEach((_, i) => {
      const comp = state[section.id]?.[i]?.comp;
      if (comp === "yes") {
        score += 2;
        max += 2;
      } else if (comp === "partial") {
        score += 1;
        max += 2;
      } else if (comp === "no") {
        max += 2;
      }
    });
    totalScore += score;
    totalMax += max;
    const pct = max === 0 ? null : Math.round((score / max) * 100);
    summaryRows.push([
      section.label,
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
    SECTIONS.reduce((a, s) => a + s.items.length, 0),
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
  SECTIONS.forEach((section) => {
    section.items.forEach((item, i) => {
      const c = state[section.id]?.[i];
      if (c?.comp === "no" || c?.comp === "partial") {
        capaRows.push([
          n++,
          section.label,
          RISK_LABELS[item.risk],
          item.q,
          c.comp === "no" ? "Non-Compliant" : "Partial",
          c.note || "",
          c.person || "",
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
  SECTIONS.forEach((section) => {
    const rows: (string | number)[][] = [
      [`AIMS DAILY QPS — ${section.label.toUpperCase()}`],
      ["Standard:", section.std],
      ["Department:", dept, "Auditor:", auditor, "Date:", dateStr],
      [""],
      ["#", "Audit Standard", "Audit Question", "Risk", "Compliance", "Comments", "Responsible Person"],
    ];
    section.items.forEach((item, i) => {
      const c = state[section.id]?.[i];
      const complianceLabel =
        c?.comp === "yes"
          ? "Yes — Compliant"
          : c?.comp === "partial"
            ? "Partial"
            : c?.comp === "no"
              ? "No — Non-Compliant"
              : c?.comp === "na"
                ? "N/A"
                : "Not Assessed";
      rows.push([i + 1, item.std, item.q, RISK_LABELS[item.risk], complianceLabel, c?.note || "", c?.person || ""]);
    });
    let score = 0;
    let max = 0;
    section.items.forEach((_, i) => {
      const comp = state[section.id]?.[i]?.comp;
      if (comp === "yes") {
        score += 2;
        max += 2;
      } else if (comp === "partial") {
        score += 1;
        max += 2;
      } else if (comp === "no") {
        max += 2;
      }
    });
    const pct = max === 0 ? null : Math.round((score / max) * 100);
    rows.push([""], ["", "Score:", `${score}/${max}`, "Compliance:", pct !== null ? `${pct}%` : "—", "", ""]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 4 }, { wch: 24 }, { wch: 62 }, { wch: 12 }, { wch: 18 }, { wch: 38 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      section.label.replace(/[^\w\s]/g, "").trim().substring(0, 31),
    );
  });

  return wb;
}

export function downloadRoundExport(round: ExportableRound) {
  const wb = buildRoundWorkbook(round);
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
