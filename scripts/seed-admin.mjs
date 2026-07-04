// One-off script to create the first admin account. There's no public
// signup and no UI for this yet (admin user-management panel is Phase 2),
// so the very first admin has to be created directly against Supabase.
//
// Usage:
//   node --env-file=.env.local scripts/seed-admin.mjs <username> <password> [fullname]

import { createClient } from "@supabase/supabase-js";

// Must match the convention in lib/username-email.ts.
const USERNAME_EMAIL_DOMAIN = "aims-qps.internal";

const [username, password, fullname = "Administrator"] = process.argv.slice(2);

if (!username || !password) {
  console.error(
    "Usage: node --env-file=.env.local scripts/seed-admin.mjs <username> <password> [fullname]",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Pass --env-file=.env.local to node.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("Failed to create auth user:", error.message);
  process.exit(1);
}

const { error: profileError } = await admin.from("profiles").insert({
  id: data.user.id,
  username: username.trim(),
  fullname,
  role: "admin",
  status: "active",
});

if (profileError) {
  console.error("Auth user created, but profile insert failed:", profileError.message);
  console.error(`Clean up manually: delete the auth user with id ${data.user.id} and retry.`);
  process.exit(1);
}

console.log(`Created admin '${username}' (${email}).`);
