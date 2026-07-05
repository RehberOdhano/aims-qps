// Pure scoring functions — ported from legacy/AIMS_QPS_v2.html's
// sectionScore()/overallScore()/getRoundSummary(), which operated on a
// global `auditState` object. These take state explicitly instead, so
// they're usable from Server Actions (finalizing a round) and Excel
// export (lib/export-round.ts) without a DOM.
//
// Rules: Yes = 2 pts, Partial = 1 pt, No = 0 pt, N/A excluded from the
// denominator. ≥95% Excellent, ≥90% Good, ≥80% Needs Improvement, <80% Critical.

import { SECTIONS, type Section } from "@/lib/sections";
import type { RoundState } from "@/types/database";

export type SectionScore = {
  score: number;
  max: number;
  pct: number | null;
  yes: number;
  partial: number;
  no: number;
};

export type RoundSummary = {
  pct: number | null;
  totalItems: number;
  nonCompliant: number;
  partial: number;
  criticalNC: number;
};

export function sectionScore(section: Section, state: RoundState): SectionScore {
  let score = 0;
  let max = 0;
  let yes = 0;
  let partial = 0;
  let no = 0;

  section.items.forEach((_, i) => {
    const comp = state[section.id]?.[i]?.comp;
    if (comp === "yes") {
      score += 2;
      max += 2;
      yes++;
    } else if (comp === "partial") {
      score += 1;
      max += 2;
      partial++;
    } else if (comp === "no") {
      max += 2;
      no++;
    }
  });

  return { score, max, pct: max === 0 ? null : Math.round((score / max) * 100), yes, partial, no };
}

export function overallScore(state: RoundState): { pct: number | null } {
  let score = 0;
  let max = 0;

  SECTIONS.forEach((section) => {
    const s = sectionScore(section, state);
    score += s.score;
    max += s.max;
  });

  return { pct: max === 0 ? null : Math.round((score / max) * 100) };
}

export function getRoundSummary(state: RoundState): RoundSummary {
  let score = 0;
  let max = 0;
  let totalItems = 0;
  let nonCompliant = 0;
  let partial = 0;
  let criticalNC = 0;

  SECTIONS.forEach((section) => {
    section.items.forEach((item, i) => {
      const comp = state[section.id]?.[i]?.comp;
      if (comp === "yes") {
        score += 2;
        max += 2;
        totalItems++;
      } else if (comp === "partial") {
        score += 1;
        max += 2;
        partial++;
        totalItems++;
      } else if (comp === "no") {
        max += 2;
        nonCompliant++;
        totalItems++;
        if (item.risk === "C") criticalNC++;
      }
    });
  });

  return {
    pct: max === 0 ? null : Math.round((score / max) * 100),
    totalItems,
    nonCompliant,
    partial,
    criticalNC,
  };
}

export type ComplianceTier = "excellent" | "good" | "needs_improvement" | "critical" | null;

// Returns the tier only — display strings/colors differ by context (UI meter
// vs. Excel "Performance" column), so consumers format their own label.
export function complianceTier(pct: number | null): ComplianceTier {
  if (pct === null) return null;
  if (pct >= 95) return "excellent";
  if (pct >= 90) return "good";
  if (pct >= 80) return "needs_improvement";
  return "critical";
}

// A coarser 3-tier scale (no separate "good" band) used by the compliance
// Badge — this is the scale legacy's section-progress bar and the admin
// pct badge both already used; complianceTier above is the finer 4-tier
// scale the overall meter widget uses and is a different, deliberate thing.
export function complianceBadgeTone(pct: number | null): "success" | "warning" | "danger" | "neutral" {
  if (pct === null) return "neutral";
  if (pct >= 95) return "success";
  if (pct >= 80) return "warning";
  return "danger";
}
