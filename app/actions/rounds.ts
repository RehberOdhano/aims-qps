"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getRoundSummary } from "@/lib/scoring";
import type { RoundState } from "@/types/database";

export type RoundActionInput = {
  state: RoundState;
  dept: string;
  dateShift: string;
};

export type RoundActionResult = { error: string } | { ok: true };

export async function autosaveDraft(input: RoundActionInput): Promise<RoundActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: updated, error: updateError } = await supabase
    .from("rounds")
    .update({ state: input.state, dept: input.dept, date_shift: input.dateShift })
    .eq("auditor_id", profile.id)
    .eq("status", "draft")
    .select("id");

  if (updateError) return { error: updateError.message };
  if (updated && updated.length > 0) return { ok: true };

  const { error: insertError } = await supabase.from("rounds").insert({
    auditor_id: profile.id,
    status: "draft",
    state: input.state,
    dept: input.dept,
    date_shift: input.dateShift,
  });

  if (insertError) {
    // Unique violation (rounds_one_draft_per_auditor) means a concurrent
    // autosave already created the draft row — fall back to updating it
    // instead of surfacing a spurious error to the user.
    if (insertError.code === "23505") {
      const { error: retryError } = await supabase
        .from("rounds")
        .update({ state: input.state, dept: input.dept, date_shift: input.dateShift })
        .eq("auditor_id", profile.id)
        .eq("status", "draft");
      if (retryError) return { error: retryError.message };
      return { ok: true };
    }
    return { error: insertError.message };
  }

  return { ok: true };
}

export async function saveRound(input: RoundActionInput): Promise<RoundActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  // Compute the summary server-side — never trust a client-supplied score
  // for a record that feeds compliance reporting.
  const summary = getRoundSummary(input.state);
  const finalized = {
    status: "completed" as const,
    saved_at: new Date().toISOString(),
    pct: summary.pct,
    non_compliant: summary.nonCompliant,
    partial: summary.partial,
    critical_nc: summary.criticalNC,
    total_items: summary.totalItems,
    state: input.state,
    dept: input.dept,
    date_shift: input.dateShift,
  };

  const { data: updated, error: updateError } = await supabase
    .from("rounds")
    .update(finalized)
    .eq("auditor_id", profile.id)
    .eq("status", "draft")
    .select("id");

  if (updateError) return { error: updateError.message };
  if (updated && updated.length > 0) return { ok: true };

  // No draft existed (e.g. saved immediately, before the autosave debounce
  // fired) — insert the completed round directly.
  const { error: insertError } = await supabase.from("rounds").insert({
    auditor_id: profile.id,
    ...finalized,
  });
  if (insertError) return { error: insertError.message };

  return { ok: true };
}

export async function startNewRound(): Promise<RoundActionResult> {
  const profile = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("rounds")
    .delete()
    .eq("auditor_id", profile.id)
    .eq("status", "draft");

  if (error) return { error: error.message };
  return { ok: true };
}
