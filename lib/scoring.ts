// Pure scoring functions — ported from legacy/AIMS_QPS_v2.html's
// sectionScore()/overallScore()/getRoundSummary(), which operated on a
// global `auditState` object. These take state explicitly instead, so
// they're usable from Server Actions (finalizing a round) and Excel
// export (lib/export-round.ts) without a DOM.
//
// `sections` is passed in rather than imported — audit content is
// admin-managed (lib/sections-data.ts), not static, so callers fetch it once
// and thread it through instead of each pure function reaching for a global.
// Answers are keyed by item.id (a stable database uuid), not array position,
// since content can be reordered/edited/deleted by an admin at any time.
//
// Rules: Yes = 2 pts, Partial = 1 pt, No = 0 pt, N/A excluded from the
// denominator. ≥95% Excellent, ≥90% Good, ≥80% Needs Improvement, <80% Critical.

import type { Section } from "@/lib/sections";
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

  section.items.forEach((item) => {
    const comp = state[section.id]?.[item.id]?.comp;
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

export function overallScore(sections: Section[], state: RoundState): { pct: number | null } {
  let score = 0;
  let max = 0;

  sections.forEach((section) => {
    const s = sectionScore(section, state);
    score += s.score;
    max += s.max;
  });

  return { pct: max === 0 ? null : Math.round((score / max) * 100) };
}

export function getRoundSummary(sections: Section[], state: RoundState): RoundSummary {
  let score = 0;
  let max = 0;
  let totalItems = 0;
  let nonCompliant = 0;
  let partial = 0;
  let criticalNC = 0;

  sections.forEach((section) => {
    section.items.forEach((item) => {
      const comp = state[section.id]?.[item.id]?.comp;
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

// JCI-aligned compliance bands (see the "Scoring" section in CLAUDE.md) — the one place
// these numbers live. Every tier/color/label helper below, plus the ones in
// lib/export-round.ts and RoundClient.tsx, reads from here instead of each
// repeating its own 95/90/80 magic numbers.
export const COMPLIANCE_EXCELLENT = 95;
export const COMPLIANCE_GOOD = 90;
export const COMPLIANCE_NEEDS_IMPROVEMENT = 80;

export type BadgeTone = "success" | "warning" | "danger" | "neutral";

// A coarser 3-tier scale (no separate "good" band) used by the compliance
// Badge, the round-taking section bar, and round-history rows — the overall
// meter widget in RoundClient.tsx uses the finer 4-band scale instead and is
// a deliberate exception.
export function complianceBadgeTone(pct: number | null): BadgeTone {
  if (pct === null) return "neutral";
  if (pct >= COMPLIANCE_EXCELLENT) return "success";
  if (pct >= COMPLIANCE_NEEDS_IMPROVEMENT) return "warning";
  return "danger";
}

const TONE_COLOR_VAR: Record<BadgeTone, string> = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  neutral: "var(--color-text-faint)",
};

// Same 3-tier scale as complianceBadgeTone, but as a raw CSS color for
// inline styling (progress bars, colored numbers) rather than a Badge tone.
export function complianceColor(pct: number | null): string {
  return TONE_COLOR_VAR[complianceBadgeTone(pct)];
}
