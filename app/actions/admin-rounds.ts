"use server";

import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type AdminActionResult = { error: string } | { ok: true };

export async function deleteRound(id: string): Promise<AdminActionResult> {
  await requireRole("admin");

  // RLS's "admins full access to rounds" policy already covers delete for
  // the acting admin's own session client — no service role needed here.
  const supabase = await createClient();
  const { error } = await supabase.from("rounds").delete().eq("id", id);
  if (error) return { error: error.message };

  return { ok: true };
}
