// Supabase Auth requires an email/password pair, but this app's UX (and the
// legacy prototype) logs in by username. Rather than add a real email
// column, derive a stable synthetic address — used identically at user
// creation (scripts/seed-admin.ts, future admin "add user" action) and login.
const USERNAME_EMAIL_DOMAIN = "aims-qps.internal";

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}
