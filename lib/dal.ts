import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

// Centralized authorization checks (Data Access Layer). proxy.ts does an
// optimistic redirect for UX, but every Server Component/Action that reads
// or mutates data must call through here too — proxy coverage silently
// disappears if a route's matcher changes or a Server Function moves.
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
});

export async function requireUser() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(...roles: UserRole[]) {
  const profile = await requireUser();
  if (!roles.includes(profile.role)) redirect("/round");
  return profile;
}
