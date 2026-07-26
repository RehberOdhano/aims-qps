# AIMS QPS Rounding

Quality & Patient Safety rounding app for Aria Institute of Medical Sciences (AIMS), Quetta. Next.js + Supabase.

For architecture, design decisions, and project status, see [CLAUDE.md](./CLAUDE.md).

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
| `npm run knip` | Find unused files, exports, and dependencies (config: `knip.json`) |

## Project structure

```
app/
  login/                        Login page + form
  (protected)/                  Auth-gated route group (session enforced via lib/dal.ts)
    layout.tsx                  Shared topbar (UserMenu) + off-canvas sidebar drawer state
    dashboard/                  Auditor landing page after login — draft list, personal stats
    round/                      The 19-section audit round-taking tool (RoundClient.tsx)
    account/                    Self-service profile + change-password page (non-admin roles)
    admin/                      admin-only: dashboard, users, round history, content management
      sections/                Core Sections content management
      specialty-modules/        ED/ICU specialty checklists (reuses sections/SectionsManagement.tsx)
      departments/              Ward/unit picker list management
      settings/                 Admin's own change-password page
  actions/                      Server Actions: auth, account, rounds, admin-users, admin-content, admin-rounds
components/                     Shared UI: Card, Modal, ConfirmDialog, FormField, Button, Badge,
                                 Pagination, MobileSidebar, AuditorSidebar, UserMenu, PageLoader
lib/
  supabase/                     server.ts (Server Components/Actions), admin.ts (service-role,
                                 server-only), session.ts (used by proxy.ts)
  dal.ts                        Centralized auth checks (requireUser/requireRole)
  username-email.ts             Username ↔ synthetic email convention for Supabase Auth
  sections.ts / sections-data.ts  Audit content types + DB read layer
  scoring.ts                    Compliance scoring (single source of truth for the 95/90/80 bands)
  export-round.ts               Excel export (round + CAPA tracker + all-rounds)
  admin-data.ts / rounds-data.ts  Admin and per-auditor query layers
proxy.ts                        Session refresh (Next.js 16's replacement for middleware.ts)
supabase/migrations/            SQL schema + RLS policies (source of truth for the DB)
types/database.ts               Supabase-generated types, hand-narrowed for literal unions
scripts/
  seed-admin.mjs                One-off: create the first admin account
  seed-sections.mjs             One-off: seed audit content into a fresh Supabase project
```

## Environment variables

See `.env.local.example`. All three come from your Supabase project's API settings (walkthrough in [supabase/README.md](./supabase/README.md)):

| Variable | Exposed to browser? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **No — server only** | Bypasses RLS entirely; only used in `lib/supabase/admin.ts` and `scripts/seed-admin.mjs` |

## Secrets — never commit these

- Real values only ever go in `.env.local` (or your hosting provider's environment variable settings for production). `.env*` is gitignored except `.env.local.example`, which must stay a blank template.
- Never paste a real Supabase key, database password, or access token into a commit, a code comment, a doc, or this README — even temporarily. If one is ever committed by mistake, treat it as compromised: rotate it in the Supabase dashboard immediately (a `git revert` does not undo the exposure, since the key remains in history).
- A pre-commit hook (`.githooks/pre-commit`, see below) blocks commits that stage a real `.env*` file or contain a Supabase-shaped secret. It's a backstop, not a substitute for not typing secrets into tracked files in the first place.

To enable the hook (one-time, per clone — git doesn't activate custom hook paths automatically):

```bash
git config core.hooksPath .githooks
```
