import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MyLastRound = {
  dept: string | null;
  dateShift: string | null;
  pct: number | null;
  savedAt: string | null;
};

export type MyRoundStats = {
  totalCompleted: number;
  completedThisMonth: number;
  lastRound: MyLastRound | null;
};

// Auditor's own stats for the dashboard — scoped to auditor_id, which RLS's
// "auditors select own rounds" policy already enforces regardless, but the
// explicit filter keeps the query legible and correct if that policy ever
// changes.
export async function getMyRoundStats(auditorId: string): Promise<MyRoundStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rounds")
    .select("dept, date_shift, pct, saved_at")
    .eq("auditor_id", auditorId)
    .eq("status", "completed")
    .order("saved_at", { ascending: false });

  const rounds = data ?? [];
  const now = new Date();
  const completedThisMonth = rounds.filter((r) => {
    if (!r.saved_at) return false;
    const d = new Date(r.saved_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const first = rounds[0];
  return {
    totalCompleted: rounds.length,
    completedThisMonth,
    lastRound: first
      ? { dept: first.dept, dateShift: first.date_shift, pct: first.pct, savedAt: first.saved_at }
      : null,
  };
}

export type MyDraft = {
  id: string;
  dept: string | null;
  dateShift: string | null;
  createdAt: string;
};

// An auditor can have multiple concurrent drafts (see
// 0005_allow_multiple_drafts.sql) — this lists all of them, for the
// dashboard's "resume one of these" view, rather than assuming just one.
export async function getMyDrafts(auditorId: string): Promise<MyDraft[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rounds")
    .select("id, dept, date_shift, created_at")
    .eq("auditor_id", auditorId)
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({ id: r.id, dept: r.dept, dateShift: r.date_shift, createdAt: r.created_at }));
}
