# AIMS QPS Rounding Software

Web application for daily Quality & Patient Safety rounds at Aria Institute of Medical Sciences (AIMS), Quetta. Designed to support JCI accreditation.

This file covers architecture, decisions, and status. For hands-on setup/operation:
- [README.md](./README.md) — install, env vars, running the dev server, project structure
- [supabase/README.md](./supabase/README.md) — creating a Supabase project, migrations, seeding users, auth-settings gotchas

## Engineering Standards

Approach all design, planning, and implementation on this project at the level of a senior software engineer/architect at a top-tier tech company (Google, Meta, Netflix, Amazon, Apple). Concretely:

- Correctness first, then simplicity — favor plain, well-tested solutions over clever ones; no premature abstraction or speculative generality.
- Design for the actual target scale (single hospital, offline-first PWA) — don't over-engineer for hypothetical multi-tenant scale until the "Upgrade triggers" below are actually hit.
- Default to least-privilege access, encryption in transit/at rest, and audit logging for anything touching Supabase/production data; treat JCI's MCI (confidentiality/record security) and PFR (patient rights) standards as the compliance bar, not just accreditation checkboxes.
- Follow the planned tech stack and architecture in this document unless there's a concrete reason to deviate — surface tradeoffs explicitly before deviating rather than silently picking a different approach.
- Proactively flag risks (security, data integrity, race conditions, migration hazards) instead of waiting to be asked — the standard is "would this pass review at a company with a real SRE/security team," not "does it work on my machine."

## Status

The app has been rebuilt as Next.js + Supabase, verified end-to-end against a live Supabase project (Mumbai/`ap-south-1`). **Phase 1** (auth/schema/RLS skeleton) and **Phase 2** (the 19-section audit round-taking tool, admin panel — user management, round history, Excel export/CAPA tracker, dashboard + sidebar navigation, shared UI components) are both done. Not yet deployed to Vercel.

**Roles**: only `admin` and `auditor` are used. A `viewer` (read-only) role was scaffolded in Phase 1 to match the legacy prototype's 3-role model, but no read-only screen was ever built for it, and it was removed (`supabase/migrations/0002_remove_viewer_role.sql`) rather than carry an unused role through the schema/RLS/UI indefinitely — see [Legacy Prototype § Roles](#roles) for the historical 3-role model this diverges from.

**Not yet done**: PWA/offline sync (IndexedDB write-queue) and a personal round-history view for auditors (flagged as a possible gap, not yet requested).

`legacy/AIMS_QPS_v2.html` remains a useful historical reference for the original audit content, scoring rules, and export layout this was ported from — see [Legacy Prototype](#legacy-prototype) below.

## Current Architecture (Next.js + Supabase)

- **Framework**: Next.js 16 (App Router, TypeScript), package manager `npm`. Note: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (exported function `proxy`, not `middleware`) — this repo uses `proxy.ts`.
- **Auth + DB**: Supabase. `profiles` table (role/fullname/dept/status) 1:1 with `auth.users`; `rounds` table holds both drafts and finalized rounds via a `status` column, with a partial unique index enforcing one draft per auditor. See `supabase/migrations/` for the full schema and RLS policies (admin/auditor access is enforced in Postgres, not just in the app), and [supabase/README.md](./supabase/README.md) for how to set that up and run it.
- **Username-based login**: Supabase Auth requires an email; usernames are mapped to a synthetic `username@aims-qps.internal` address via `lib/username-email.ts` (used consistently by login and user-provisioning code — never store or display this address, it's an implementation detail).
- **No public signup**: users are admin-provisioned only, via the admin panel's Users page (`app/actions/admin-users.ts`). `scripts/seed-admin.mjs` remains for creating the very first admin one-off before any admin account exists.
- **Structure**:
  - `app/login/` — login page. `app/(protected)/layout.tsx` enforces auth via `lib/dal.ts`'s `requireUser()`/`requireRole()` and renders the shared topbar (`components/UserMenu.tsx` for profile/logout).
  - `app/(protected)/round/` — the audit round-taking tool (any authenticated role can reach it; admins get a "Conduct Round" link in their sidebar plus a back-link once there).
  - `app/(protected)/admin/` — `admin`-only (`admin/layout.tsx` + `AdminSidebar.tsx`): `page.tsx` (dashboard), `users/`, `rounds/` (history), `settings/` (change password).
  - `app/(protected)/account/` — shared self-service profile/password page for non-admin roles (admins use `admin/settings/` instead, so they keep their sidebar).
  - `components/` — shared UI primitives used across both admin and round pages: `Modal`, `ConfirmDialog`, `Card`, `Badge`, `FormField`, `Button` (owns loading-spinner behavior for every async action button), `PageLoader` (route `loading.tsx` fallback), `ChangePasswordCard`, `UserMenu`.
  - `lib/supabase/client.ts` (browser), `server.ts` (Server Components/Actions), `admin.ts` (service-role, server-only, never import from client code), `session.ts` (used by `proxy.ts` to refresh the session cookie).
  - `lib/sections.ts` (audit content), `lib/scoring.ts` (compliance scoring), `lib/export-round.ts` (Excel export), `lib/admin-data.ts` (admin queries).
  - `types/database.ts` — still hand-authored to match the migrations. The project is linked, so this can be regenerated any time with `npx supabase gen types typescript --linked > types/database.ts`; do that after the next schema change rather than hand-editing.
- **Design tokens**: `app/globals.css` carries over the prototype's navy (`#1B3A6B`) / teal (`#0E7C7B`) palette as CSS custom properties, plus all component styles for the ported screens.
- **Not yet implemented**: PWA/offline sync (IndexedDB write-queue).

See [README.md](./README.md) for how to run this locally.

## Legacy Prototype

`legacy/AIMS_QPS_v2.html` — the original single-file prototype (all HTML/CSS/JS in one file, `localStorage`-backed, no build step, one CDN dependency: SheetJS). It's no longer run in production but is the reference implementation for everything Phase 2 needs to port.

### Data Model (`localStorage`)

```
aims_qps_db {
  users:        []   // id, username, password (plaintext), fullname, role, status, lastLogin
  rounds:       []   // completed audit rounds with full state snapshots
  currentRound: {}   // autosaved in-progress round (per user)
}
```

Note: the prototype stores passwords in plaintext — the Phase 1 Supabase rebuild already fixes this with real Supabase Auth. Don't carry the plaintext pattern forward.

### Roles

| Role    | Capabilities                                      |
|---------|---------------------------------------------------|
| admin   | User management, round history, admin panel + audit tool |
| auditor | Conduct rounds, save & export                     |
| viewer  | Read-only view + export                           |

Default credentials seeded in the prototype (not applicable to the Supabase rebuild):
- `admin` / `Admin@AIMS2026`
- `qpsofficer` / `QPS@2026`
- `viewer` / `View@2026`

### Audit Content

19 sections total, split into two groups in the sidebar:

**Core Sections (s1–s17):** Leadership & Safety Culture, Patient Identification, Communication, Clinical Documentation, Medication Safety, IPC, Falls Prevention, Pressure Injury Prevention, Device Safety, Equipment Safety, Environmental Safety, Patient Rights, Patient Experience, Staff Safety, Emergency Preparedness, Incident Reporting, Quality Indicators.

**Department Modules:** ED (`sed`, 18 items) and ICU (`sicu`, 10 items).

Standards referenced: JCI (IPSG, QPS, MMU, PCI, FMS, SQE, ACC, PFR, MCI), WHO 5 Moments, IHI, ISMP, NPUAP/EPUAP, SCCM, CDC bundles, RCEM, ATLS, CAHPS.

### Scoring

- Yes = 2 pts, Partial = 1 pt, No = 0 pt, N/A = excluded from denominator
- ≥ 95% → Excellent (GREEN)
- ≥ 90% → Good (AMBER-GREEN)
- ≥ 80% → Needs Improvement (AMBER)
- < 80% → Critical (RED) — escalate

### Excel Export

Generates a multi-sheet `.xlsx` file via SheetJS:
1. **Summary** — per-section scores and overall compliance
2. **CAPA Tracker** — all non-compliant/partial items with risk-based timelines (Critical 24h, High 48h, Moderate 7d, Low 30d)
3. **One sheet per section** — full item-level detail

Admin panel has an additional "Export All Rounds" function that dumps the round history.

### Key Functions (legacy file only)

| Function           | Location | Purpose                                      |
|--------------------|----------|----------------------------------------------|
| `doLogin()`        | JS       | Auth against localStorage users              |
| `initDB()`         | JS       | Seeds default DB if none exists              |
| `autosave()`       | JS       | Persists in-progress round to `currentRound` |
| `saveRound()`      | JS       | Finalises and pushes round to `rounds[]`     |
| `getRoundSummary()`| JS       | Computes pct, nonCompliant, partial, criticalNC |
| `buildAndExportRound()` | JS  | Generates all Excel sheets and triggers download |
| `renderSection()`  | JS       | Renders audit question rows for active section |
| `renderNav()`      | JS       | Updates sidebar with per-section scores       |

### Conventions

- All state lives in the `auditState` object (`{ [sectionId]: { [itemIndex]: { comp, note, person } } }`) — this shape is preserved as-is in the new `rounds.state` JSONB column.
- Compliance buttons use data attributes (`data-v`, `data-i`) to identify themselves
- `SECTIONS` array at the top of the script is the single source of truth for all audit content — add/edit questions there (to be ported to a typed `lib/sections.ts` module in Phase 2)
- Risk levels: `C` = Critical, `H` = High, `M` = Moderate, `L` = Low

---

## Planned Full Application

### Tech Stack

| Layer | Technology | Purpose | Status |
|-------|-----------|---------|--------|
| Frontend | Next.js (React) | UI, routing, API routes | Built — audit tool + admin panel |
| Database + Auth | Supabase (PostgreSQL) | Multi-user data, role-based auth, row-level security | Live — project linked (Mumbai/`ap-south-1`), migrations applied, RLS verified end-to-end |
| Offline support | PWA + IndexedDB | Works on ward with patchy WiFi; syncs when back online | Not started |
| Excel export | SheetJS (`xlsx` npm package, SheetJS's own patched CDN build — not the vulnerable npm-registry release) | Round export + CAPA tracker + export-all-rounds | Built |
| Hosting | Vercel | Deploys from GitHub, zero DevOps | Not yet deployed |

### Deployment Model

- **Vercel** hosts the Next.js app (frontend + API routes)
- **Supabase** is a separate managed cloud service — connected via `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-only) environment variables set in the Vercel dashboard
- No VPS, no servers, no DevOps required
- Domain name (~$10–15/year) is the only paid item to start; both Vercel and Supabase free tiers are sufficient for a single hospital deployment

### Infrastructure Cost

| Item | Cost |
|------|------|
| Vercel | Free |
| Supabase | Free (500MB DB, 50k monthly active users) |
| Domain name | ~$10–15/year |

Upgrade triggers: multiple hospitals → Supabase Pro (~$25/month); heavy traffic → Vercel Pro (~$20/month).

### Target Platform

Progressive Web App (PWA) — runs in any browser, installable on Android/iOS tablets used during ward rounds. Offline-first design is critical given unreliable hospital ward WiFi. Not yet implemented — see [Status](#status) above.
