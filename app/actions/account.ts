"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/username-email";

export type AccountActionResult = { error: string } | { ok: true };

export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AccountActionResult> {
  const profile = await requireUser();

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }

  const supabase = await createClient();

  // No direct "verify current password" API — re-authenticating with it
  // confirms it's correct without disturbing the existing session (same
  // account, so the cookie-based session just gets refreshed in place).
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(profile.username),
    password: currentPassword,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { error: updateError.message };

  return { ok: true };
}
