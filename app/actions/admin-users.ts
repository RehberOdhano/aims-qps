"use server";

import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usernameToEmail } from "@/lib/username-email";
import type { UserRole, UserStatus } from "@/types/database";

export type AdminActionResult = { error: string } | { ok: true };

export type CreateUserInput = {
  username: string;
  fullname: string;
  password: string;
  role: UserRole;
};

export async function createUser(input: CreateUserInput): Promise<AdminActionResult> {
  await requireRole("admin");

  const username = input.username.trim();
  const fullname = input.fullname.trim();
  if (!username || !fullname || !input.password) {
    return { error: "All fields are required." };
  }
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const admin = createAdminClient();

  // Both the auth user and its profile row are created via the service-role
  // client — this is an INSERT, not an UPDATE, so the prevent_self_role_change
  // trigger (which only fires on UPDATE) never enters into it.
  const { data, error: authError } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password: input.password,
    email_confirm: true,
  });
  if (authError) {
    return { error: authError.message.includes("already been registered") ? "Username already exists." : authError.message };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    username,
    fullname,
    role: input.role,
    status: "active",
  });
  if (profileError) {
    // Clean up the orphaned auth user rather than leaving a half-created account.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: profileError.message };
  }

  return { ok: true };
}

export type UpdateUserInput = {
  id: string;
  fullname: string;
  role: UserRole;
  status: UserStatus;
  newPassword?: string;
};

export async function updateUser(input: UpdateUserInput): Promise<AdminActionResult> {
  const actor = await requireRole("admin");

  if (input.id === actor.id) {
    if (input.role !== "admin" || input.status !== "active") {
      return { error: "You cannot change your own role or deactivate your own account." };
    }
  } else if (input.role !== "admin" || input.status !== "active") {
    // Demoting/deactivating someone else who is currently the last active
    // admin would lock everyone out — block it.
    const supabase = await createClient();
    const { data: target } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", input.id)
      .single();
    if (target?.role === "admin" && target.status === "active") {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("status", "active");
      if ((count ?? 0) <= 1) {
        return { error: "Cannot demote or deactivate the last active admin." };
      }
    }
  }

  // Profile field edits go through the acting admin's own session client
  // (not the service-role client): RLS's "admins full access to profiles"
  // policy allows it, and — critically — auth.uid() resolves to a real user
  // here, so is_admin() reads true inside prevent_self_role_change() and the
  // trigger doesn't fire. The service-role client's auth.uid() is null,
  // which would make that trigger wrongly reject this exact update.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ fullname: input.fullname.trim(), role: input.role, status: input.status })
    .eq("id", input.id);
  if (error) return { error: error.message };

  if (input.newPassword) {
    if (input.newPassword.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }
    const admin = createAdminClient();
    const { error: pwError } = await admin.auth.admin.updateUserById(input.id, {
      password: input.newPassword,
    });
    if (pwError) return { error: pwError.message };
  }

  return { ok: true };
}

export async function deleteUser(id: string): Promise<AdminActionResult> {
  const actor = await requireRole("admin");

  if (id === actor.id) {
    return { error: "You cannot delete your own account." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("role, status").eq("id", id).single();
  if (target?.role === "admin" && target.status === "active") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("status", "active");
    if ((count ?? 0) <= 1) {
      return { error: "Cannot delete the last active admin." };
    }
  }

  const admin = createAdminClient();
  // Deletes auth.users; profiles cascades via `on delete cascade`.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  return { ok: true };
}
