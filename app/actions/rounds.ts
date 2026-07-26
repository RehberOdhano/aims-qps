"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getRoundSummary } from "@/lib/scoring";
import { getAllSections } from "@/lib/sections-data";
import type { RoundState } from "@/types/database";

// An auditor can have multiple concurrent draft rounds (see
// 0005_allow_multiple_drafts.sql), so every action here operates on a
// specific round by id rather than assuming "the" draft for this auditor.
// `roundId` is absent only for a round that's never been saved yet — in
// that case the first save inserts a new row and reports its id back to
// the caller, which must remember it for subsequent saves.
export type RoundActionInput = {
  roundId?: string;
  state: RoundState;
  dept: string;
  dateShift: string;
};

export type RoundActionResult = { error: string } | { ok: true };
export type AutosaveResult = { error: string } | { ok: true; id: string };

export async function autosaveDraft(input: RoundActionInput): Promise<AutosaveResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  if (input.roundId) {
    const { error } = await supabase
      .from("rounds")
      .update({ state: input.state, dept: input.dept, date_shift: input.dateShift })
      .eq("id", input.roundId)
      .eq("auditor_id", profile.id)
      .eq("status", "draft");
    if (error) return { error: error.message };
    return { ok: true, id: input.roundId };
  }

  const { data, error: insertError } = await supabase
    .from("rounds")
    .insert({
      auditor_id: profile.id,
      status: "draft",
      state: input.state,
      dept: input.dept,
      date_shift: input.dateShift,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };
  return { ok: true, id: data.id };
}

export async function saveRound(input: RoundActionInput): Promise<RoundActionResult> {
  const profile = await requireUser();

  // A department is required to finalize a round — enforced here too (not
  // just the disabled Save button client-side), since a Server Action is a
  // directly callable endpoint regardless of what the UI allows.
  if (!input.dept.trim()) {
    return { error: "Department is required before saving a round." };
  }

  const supabase = await createClient();

  // Compute the summary server-side — never trust a client-supplied score
  // for a record that feeds compliance reporting.
  const sections = await getAllSections();
  const summary = getRoundSummary(sections, input.state);

  // Snapshot each answered item's question/std/risk/section label into the
  // finalized state, so this completed round stays self-contained and
  // immune to later edits an admin makes to the live audit content (see
  // lib/export-round.ts and RoundHistory.tsx, which both prefer these
  // snapshotted fields over a live section lookup).
  const snapshotState: RoundState = {};
  sections.forEach((section) => {
    const sectionAnswers = input.state[section.id];
    if (!sectionAnswers) return;
    snapshotState[section.id] = {};
    section.items.forEach((item) => {
      const answer = sectionAnswers[item.id];
      if (!answer) return;
      snapshotState[section.id][item.id] = {
        ...answer,
        question: item.q,
        std: item.std,
        risk: item.risk,
        sectionLabel: section.label,
      };
    });
  });

  const finalized = {
    status: "completed" as const,
    saved_at: new Date().toISOString(),
    pct: summary.pct,
    non_compliant: summary.nonCompliant,
    partial: summary.partial,
    critical_nc: summary.criticalNC,
    total_items: summary.totalItems,
    state: snapshotState,
    dept: input.dept,
    date_shift: input.dateShift,
  };

  if (input.roundId) {
    const { error } = await supabase
      .from("rounds")
      .update(finalized)
      .eq("id", input.roundId)
      .eq("auditor_id", profile.id)
      .eq("status", "draft");
    if (error) return { error: error.message };
    return { ok: true };
  }

  // No roundId — saved immediately, before any autosave ever fired. Insert
  // the completed round directly.
  const { error: insertError } = await supabase.from("rounds").insert({
    auditor_id: profile.id,
    ...finalized,
  });
  if (insertError) return { error: insertError.message };

  return { ok: true };
}
