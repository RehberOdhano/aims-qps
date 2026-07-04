# AIMS QPS Rounding

Quality & Patient Safety rounding app for Aria Institute of Medical Sciences (AIMS), Quetta. Next.js + Supabase.

For architecture, design decisions, and project status, see [CLAUDE.md](./CLAUDE.md). For the original single-file prototype (still the reference for audit content, scoring, and export layout until Phase 2 ports it), see [legacy/AIMS_QPS_v2.html](./legacy/AIMS_QPS_v2.html).

## Prerequisites

- Node.js 20.9+ (Next.js 16 requirement)
- npm
- A Supabase project — see [supabase/README.md](./supabase/README.md) if you don't have one yet

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in the three Supabase values — see supabase/README.md
npm run dev
```

Open http://localhost:3000 — it redirects to `/login`. You'll need a seeded user to sign in; see [supabase/README.md](./supabase/README.md#seeding-the-first-admin).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run a production build locally |
| `npm run lint` | ESLint |

## Project structure

```
app/
  login/                  Login page + form
  (protected)/            Auth-gated route group (layout enforces session via lib/dal.ts)
    round/                Rounding form (placeholder — Phase 2)
    admin/                Admin panel (placeholder — Phase 2)
  actions/auth.ts         Login/logout Server Actions
lib/
  supabase/               client.ts (browser), server.ts (Server Components/Actions),
                          admin.ts (service-role, server-only), session.ts (used by proxy.ts)
  dal.ts                  Centralized auth checks (requireUser/requireRole)
  username-email.ts       Username ↔ synthetic email convention for Supabase Auth
proxy.ts                  Session refresh (Next.js 16's replacement for middleware.ts)
supabase/migrations/      SQL schema + RLS policies
types/database.ts         Hand-authored Supabase types (regenerate once schema changes — see supabase/README.md)
scripts/seed-admin.mjs    One-off first-admin creation
legacy/AIMS_QPS_v2.html   Original prototype — reference only, not run in production
```

## Environment variables

See `.env.local.example`. All three come from your Supabase project's API settings (walkthrough in [supabase/README.md](./supabase/README.md)):

| Variable | Exposed to browser? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **No — server only** | Bypasses RLS entirely; only used in `lib/supabase/admin.ts` and `scripts/seed-admin.mjs` |
