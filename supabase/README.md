# Supabase setup

Everything needed to stand up the backend this app talks to: create the project, get your keys, run migrations, and seed a user.

## 1. Create a project

1. Sign up / log in at [supabase.com](https://supabase.com) (GitHub OAuth is easiest).
2. **New project** → pick the region closest to your users (not necessarily the one Supabase badges "Recommended" — that badge isn't location-aware). For AIMS (Quetta, Pakistan), South Asia (Mumbai, `ap-south-1`) is the closest available region.
3. Generate a strong database password and save it somewhere safe. You won't need it for day-to-day app development (the app talks to Supabase via API keys, not a direct Postgres connection) — only for `supabase db push` and direct DB access.
4. Under **Security** on the creation form: leave **Enable Data API** and **Automatically expose new tables** checked (required for the app to reach `profiles`/`rounds` via the REST API — RLS still locks them down regardless), and turn on **Enable automatic RLS** as a safety net for any table created later outside of a migration.

## 2. Get your API keys

**Project Settings → API Keys.** Supabase has renamed these (old name → current name is the same value, just relabeled):

| Dashboard label | `.env.local` variable | Notes |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | |
| Publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe to expose in the browser |
| Secret key (`sb_secret_...`, click the eye icon to reveal) | `SUPABASE_SERVICE_ROLE_KEY` | **Bypasses RLS entirely — server-only, never commit** |

Copy `.env.local.example` to `.env.local` and fill these in.

## 3. Two auth settings to check

**Authentication → Sign In / Providers → Email**, in the dashboard:

- **"Allow new users to sign up"** → turn **off**. There's no public registration; users are admin-provisioned only (see [Seeding the first admin](#seeding-the-first-admin) below, and eventually the Phase 2 admin panel).
- **"Enable Email provider"** → must be **on**. This is a separate toggle from signups — if it's off, `signInWithPassword` fails with `Email logins are disabled`, even for accounts that already exist. New projects have occasionally shipped with this off; check it explicitly.

## 4. Link the Supabase CLI and run migrations

The CLI is already installed as a dev dependency (`npx supabase ...`).

```bash
# Auth: the automatic browser flow needs a real TTY. In sandboxed/headless
# shells (including inside some AI coding tools) use a personal access token
# instead: https://supabase.com/dashboard/account/tokens → Generate new token
npx supabase login --token <your-token>

# Find your project ref in the dashboard URL or the Project URL
# (https://<ref>.supabase.co) and link:
npx supabase link --project-ref <your-project-ref>

# Apply supabase/migrations/*.sql to the live database.
# Prompts for the database password from step 1.
npx supabase db push
```

If `db push` complains about a missing access token even after a successful `login`, the CLI's saved credentials aren't being picked up (a macOS Keychain access quirk in some sandboxed shells) — pass it explicitly for that one command instead:

```bash
SUPABASE_ACCESS_TOKEN=<your-token> npx supabase db push
```

New tables/columns go in a new file under `migrations/` (e.g. `0002_*.sql`) — never edit an already-applied migration.

## 5. Regenerate types after schema changes

`types/database.ts` is currently hand-authored to match `migrations/0001_init.sql`. Once you've linked the project, regenerate the authoritative version instead of hand-editing it:

```bash
npx supabase gen types typescript --linked > types/database.ts
```

## Seeding the first admin

There's no signup flow and no admin UI yet (Phase 2), so the first admin has to be created directly:

```bash
node --env-file=.env.local scripts/seed-admin.mjs <username> <password> [fullname]
```

This creates both the Supabase Auth user and the matching `profiles` row (`role = 'admin'`) in one step, via the service-role client. Username is mapped to a synthetic `username@aims-qps.internal` email under the hood (see `lib/username-email.ts`) — Supabase Auth requires an email, but the app's UX is username-based.

## Verifying it worked

```bash
# Tables reachable via the REST API (empty array is correct — RLS blocks
# anonymous access, it's not an error):
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Then `npm run dev` and log in at `/login` with the account you just seeded.

## Schema and access control

`migrations/0001_init.sql` is the source of truth for the schema and Row Level Security policies — read it directly rather than relying on this doc to stay in sync. Summary:

- `profiles` (1:1 with `auth.users`) — role is one of `admin`/`auditor`/`viewer`; a trigger blocks non-admins from changing their own `role` or `status`.
- `rounds` — holds both in-progress drafts and finalized rounds via a `status` column; a partial unique index enforces one draft per auditor.
- RLS: admins have full access to both tables; auditors can manage their own rounds; viewers can read completed rounds only. All enforced in Postgres, not just in application code.
