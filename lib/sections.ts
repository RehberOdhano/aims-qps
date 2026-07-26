// Audit content types. The actual content (sections/items/departments) is
// admin-managed and lives in the `sections`/`section_items`/`departments`
// tables (see lib/sections-data.ts for the read layer and
// app/actions/admin-content.ts for the admin CRUD) — originally a verbatim
// port of `SECTIONS` from legacy/AIMS_QPS_v2.html, migrated to the database
// via scripts/seed-sections.mjs so it's editable without a code deploy.

export type RiskLevel = "C" | "H" | "M" | "L";

export type SectionItem = {
  id: string;
  std: string;
  q: string;
  risk: RiskLevel;
};

export type SectionGroup = "Core Sections" | "Specialty Modules";

export type Section = {
  id: string;
  label: string;
  grp: SectionGroup;
  std: string;
  items: SectionItem[];
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  C: "Critical",
  H: "High",
  M: "Moderate",
  L: "Low",
};
