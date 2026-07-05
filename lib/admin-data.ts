import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Round = Database["public"]["Tables"]["rounds"]["Row"];
export type RoundWithAuditor = Round & { auditorName: string };

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
  return data ?? [];
}

// Round <-> auditor-name join done in JS rather than PostgREST embedding —
// trivial at this data scale and avoids depending on the FK's generated
// embedding name matching, since types/database.ts is hand-authored.
export async function getAllRoundsWithAuditor(): Promise<RoundWithAuditor[]> {
  const supabase = await createClient();
  const [{ data: rounds }, { data: profiles }] = await Promise.all([
    supabase.from("rounds").select("*").eq("status", "completed").order("saved_at", { ascending: false }),
    supabase.from("profiles").select("id, fullname"),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.fullname]));
  return (rounds ?? []).map((r) => ({ ...r, auditorName: nameById.get(r.auditor_id) ?? "—" }));
}

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  totalRounds: number;
  roundsThisMonth: number;
};

export function computeAdminStats(profiles: Profile[], rounds: RoundWithAuditor[]): AdminStats {
  const now = new Date();
  const roundsThisMonth = rounds.filter((r) => {
    if (!r.saved_at) return false;
    const d = new Date(r.saved_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return {
    totalUsers: profiles.length,
    activeUsers: profiles.filter((p) => p.status === "active").length,
    totalRounds: rounds.length,
    roundsThisMonth,
  };
}
