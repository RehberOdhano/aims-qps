"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usernameToEmail } from "@/lib/username-email";

export type LoginState = { error: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    return { error: "Invalid username or password." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);
  }

  redirect("/round");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
