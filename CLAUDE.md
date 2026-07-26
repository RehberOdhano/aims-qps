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

## Code Hygiene

Verify these before treating any change as done — not only when asked to audit:

- **No dead code**: no commented-out code, no unused imports/variables, no exported function/type nothing else calls. `npx tsc --noEmit` and `npm run lint` catch unused imports/vars; neither catches an unused *export*, so also run `npm run knip` (config in `knip.json`, which excludes the standalone `scripts/*.mjs` seed scripts, the `supabase` CLI devDependency, and generated `types/database.ts` — all real, just not reachable via static imports). A few "unused exported type/function" hits on internal-only helpers (e.g. a type only ever used to build another exported type in the same file) are expected background noise, not something to chase every run.
- **No unused dependencies** — every `package.json` entry traces to a real import or an actual CLI invocation (documented in `README.md`/`supabase/README.md` if it's the latter).
- **Comments explain the non-obvious "why,"** never the "what": a hidden constraint, a workaround, an invariant a reader could otherwise break. If deleting a comment wouldn't confuse the next reader, don't write it — and none should read like filler ("This function handles...").
- **One source of truth per business rule.** A number, threshold, or formula that matters in more than one place is defined once and imported everywhere else — never retyped. Before writing a new color/label/threshold helper, grep for the literal numbers first. (This bit once already: the 95/90/80 compliance bands were independently hardcoded in `lib/scoring.ts`, `lib/export-round.ts`, and twice in `RoundClient.tsx`/`RoundHistory.tsx` — now they're `COMPLIANCE_EXCELLENT`/`COMPLIANCE_GOOD`/`COMPLIANCE_NEEDS_IMPROVEMENT` in `lib/scoring.ts`, imported everywhere they're used.)
- Hold every layer to this, not just app code — frontend, Server Actions, migrations/RLS — and to the security bar in Engineering Standards above (least privilege, no service-role client reachable from the browser, input validated at the boundary).
- Periodically check `npm audit` for known CVEs in dependencies (already bit us once: Next.js 16.2.10 shipped several high-severity advisories, fixed in 16.2.12). Read the advisory before acting on its suggested fix — plain `npm audit fix` can *rebalance the lockfile onto a worse resolution* (this happened here: it briefly went from 4 findings to 12 by re-surfacing an old vulnerable `minimatch` chain); verify the finding count before/after and revert (`git checkout -- package-lock.json && npm install`) if it regresses. Never run `npm audit fix --force` on a pinned framework version without confirming first — it will happily "fix" a transitive advisory by downgrading `next` to a years-old major version, which is worse than the CVE.
- **Never commit a secret** — real Supabase keys, DB passwords, or access tokens only ever go in `.env.local` (gitignored) or the hosting provider's environment settings, never in a commit, comment, doc, or example file. `.githooks/pre-commit` (enabled via `git config core.hooksPath .githooks` — see the "Secrets" section in README.md) blocks staging a real `.env*` file or a secret-shaped string (Supabase JWT/`sb_secret_` keys, AWS keys, PEM private keys); it's a backstop, not a substitute for not typing secrets into tracked files. If a real secret ever lands in a commit, rotate it in the Supabase dashboard immediately — history rewriting or `git revert` doesn't undo the exposure.

## Status

The app has been rebuilt as Next.js + Supabase, verified end-to-end against a live Supabase project (Mumbai/`ap-south-1`). **Phase 1** (auth/schema/RLS skeleton) and **Phase 2** (the 19-section audit round-taking tool, admin panel — user management, round history, Excel export/CAPA tracker, dashboard + sidebar navigation, shared UI components) are both done. Not yet deployed to Vercel.

**Roles**: only `admin` and `auditor` are used. A `viewer` (read-only) role was scaffolded in Phase 1 to match a 3-role model from an earlier prototype, but no read-only screen was ever built for it, and it was removed (`supabase/migrations/0002_remove_viewer_role.sql`) rather than carry an unused role through the schema/RLS/UI indefinitely.

**Responsive layout**: `/round` and `/admin` (both sidebar-driven layouts) collapse the sidebar into an off-canvas drawer below 900px width, toggled via a hamburger in the shared topbar (`components/MobileSidebar.tsx` — `SidebarProvider`/`SidebarToggleButton`/`SidebarBackdrop`); data tables scroll horizontally in their own wrapper (`.table-scroll`) rather than overflowing the page; dashboard/inline-form grids reflow to fewer columns on narrow widths. This is CSS/layout responsiveness only — distinct from the PWA/offline-sync item below, which is about working with no network connection, not about screen size.

**Audit content is database-backed, not hardcoded**: sections/questions/risk levels/standard refs and the department list live in `sections`/`section_items`/`departments` tables (migration `0003_section_content.sql`), admin-managed via three separate pages/sidebar entries (not tabs in one page): `/admin/sections` (the 17 Core Sections), `/admin/specialty-modules` (the ED/ICU specialty checklists — these are just `sections` rows grouped `grp = "Specialty Modules"`; this group was originally named "Department Modules" but that collided with the unrelated `departments` table below, so it was renamed via migration `0004_rename_department_modules_group.sql`; nothing currently filters which sections show by the round's selected department, so all of Core + ED + ICU always appear together in the round-taking tool), and `/admin/departments` (the ward/unit picker list). The first two share one component (`SectionsManagement.tsx`, parameterized by `group`/`title`), `/admin/departments` has its own (`DepartmentsManagement.tsx`); both call the shared `app/actions/admin-content.ts` (create/edit/delete/reorder, up/down buttons rather than drag-and-drop) and paginate their lists (`components/Pagination.tsx`). `lib/sections.ts` now holds only the `Section`/`SectionItem`/`RiskLevel`/`SectionGroup` types and `RISK_LABELS`; `lib/sections-data.ts` is the read layer (`getAllSections()`/`getAllDepartments()`/`getAllDepartmentRows()`). Since content can be reordered/edited/deleted at any time, `rounds.state` answers are keyed by the section/item's stable database **uuid**, not array position (a prior-version risk this design specifically avoids). A **completed** round snapshots each answered item's question/std/risk/section-label directly onto `rounds.state` at save time (`saveRound()` in `app/actions/rounds.ts`), so a finalized audit record stays accurate and JCI/MCI-audit-trail-safe even if an admin edits the live content afterward — `RoundHistory.tsx` and `lib/export-round.ts` both prefer the snapshot over a live `sections` lookup; only in-progress drafts and the "export current round" button resolve against live content. `scripts/seed-sections.mjs` (mirrors `scripts/seed-admin.mjs`) re-seeds this content from scratch on a fresh Supabase project.

**Auditor dashboard**: auditors now land on `/dashboard` after login (previously `/round` directly) — a welcome card listing every draft in progress (dept/date-shift, "Continue" → `/round?draft=<id>`) plus basic personal stats (rounds completed, this month's count, most recent round's compliance %) via `lib/rounds-data.ts`'s `getMyRoundStats()`/`getMyDrafts()`. `/dashboard` and `/account` share a new `components/AuditorSidebar.tsx` (Dashboard / Conduct Round / Profile); `/round` keeps its own specialized tool sidebar rather than this generic one — same reasoning as admins already leaving `AdminSidebar` behind when they step into `/round` — but now shows a "Back" link to `/dashboard` for auditors (previously admin-only, back to `/admin`). This is still short of the full personal round-history *browsing* view flagged below — just a dashboard summary, not a list/filter UI for **completed** rounds.

**Multiple concurrent drafts per auditor**: the original one-draft-per-auditor unique index was dropped (`0005_allow_multiple_drafts.sql`) — an auditor can now start several rounds (e.g. one per department) and resume/finish each independently, rather than being forced to finish or discard the current one first. `/round`'s "Start Another Round" button (was "New Round") is now a plain client-side reset with no confirmation and no server call — nothing is discarded, so there's nothing to warn about — and `startNewRound()` was removed from `app/actions/rounds.ts` entirely since it no longer has anything to do. Every round action now keys off a specific `roundId` rather than "the draft for this auditor": `/round?draft=<id>` resumes that row; no `draft` param starts a brand-new one, and the client learns its id from `autosaveDraft()`'s first insert response and reflects it into the URL via `router.replace()` so a mid-edit refresh doesn't lose track of which draft it's on. Auditors still cannot delete any round themselves (draft or completed) — that RLS restriction is unchanged; an admin can clean up a stray/unwanted draft via the existing Rounds page.

**Autosave correctness**: `RoundClient.tsx`'s debounced autosave used to gate on an `isFirstRender` ref flipped inside the effect itself — fragile, because React Strict Mode (on by default in Next.js dev) double-invokes effects on mount, and the second invocation saw the guard already flipped and fired anyway, silently creating an empty draft row before the user touched anything. Fixed by tracking `hasUserInteracted` via a ref set only inside the actual mutation handlers (`setItemField`, and the dept/date/shift change handlers), never inside the effect — reset back to `false` after a round is saved or restarted too, so resetting to a blank slate doesn't immediately re-persist an empty draft.

**Not yet done**: PWA/offline sync (IndexedDB write-queue) and a full personal round-history *browsing* view for auditors (the new dashboard above covers a basic summary, not a filterable list).

## Current Architecture (Next.js + Supabase)

- **Framework**: Next.js 16 (App Router, TypeScript), package manager `npm`. Note: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (exported function `proxy`, not `middleware`) — this repo uses `proxy.ts`.
- **Auth + DB**: Supabase. `profiles` table (role/fullname/dept/status) 1:1 with `auth.users`; `rounds` table holds both drafts and finalized rounds via a `status` column — an auditor can hold multiple concurrent drafts (see [Status](#status) above, `0005_allow_multiple_drafts.sql`), so there's no longer a one-draft-per-auditor constraint; `sections`/`section_items`/`departments` tables hold admin-managed audit content (read by any authenticated user, written by admins only — see [Status](#status) above). See `supabase/migrations/` for the full schema and RLS policies (admin/auditor access is enforced in Postgres, not just in the app), and [supabase/README.md](./supabase/README.md) for how to set that up and run it.
- **Username-based login**: Supabase Auth requires an email; usernames are mapped to a synthetic `username@aims-qps.internal` address via `lib/username-email.ts` (used consistently by login and user-provisioning code — never store or display this address, it's an implementation detail).
- **No public signup**: users are admin-provisioned only, via the admin panel's Users page (`app/actions/admin-users.ts`). `scripts/seed-admin.mjs` remains for creating the very first admin one-off before any admin account exists.
- **Structure**:
  - `app/login/` — login page. `app/(protected)/layout.tsx` enforces auth via `lib/dal.ts`'s `requireUser()`/`requireRole()` and renders the shared topbar (`components/UserMenu.tsx` for profile/logout).
  - `app/(protected)/round/` — the audit round-taking tool (any authenticated role can reach it; a sidebar "Back" link returns admins to `/admin` and auditors to `/dashboard`).
  - `app/(protected)/dashboard/` — auditor landing page after login (`DashboardLayout` + `components/AuditorSidebar.tsx`): welcome/continue-round card, personal stats via `lib/rounds-data.ts`.
  - `app/(protected)/admin/` — `admin`-only (`admin/layout.tsx` + `AdminSidebar.tsx`): `page.tsx` (dashboard), `users/`, `rounds/` (history), `sections/` (Core Sections content), `specialty-modules/` (ED/ICU specialty checklists, reuses `sections/SectionsManagement.tsx`), `departments/` (ward/unit picker list), `settings/` (change password).
  - `app/(protected)/account/` — shared self-service profile/password page for non-admin roles (admins use `admin/settings/` instead, so they keep their sidebar); shares `components/AuditorSidebar.tsx` with `/dashboard`.
  - `components/` — shared UI primitives used across both admin and round pages: `Modal`, `ConfirmDialog`, `Card`, `Badge`, `FormField`, `Button` (owns loading-spinner behavior for every async action button), `PageLoader` (route `loading.tsx` fallback), `ChangePasswordCard`, `UserMenu`, `MobileSidebar` (off-canvas drawer context + hamburger + backdrop, shared by `/round` and `/admin`'s sidebars), `AuditorSidebar` (nav for `/dashboard` + `/account`), `Pagination` (search/list pagination on the admin content pages).
  - `lib/supabase/client.ts` (browser), `server.ts` (Server Components/Actions), `admin.ts` (service-role, server-only, never import from client code), `session.ts` (used by `proxy.ts` to refresh the session cookie).
  - `lib/sections.ts` (audit content types + `RISK_LABELS`), `lib/sections-data.ts` (audit content read layer — DB-backed, see [Status](#status) above), `lib/scoring.ts` (compliance scoring), `lib/export-round.ts` (Excel export), `lib/admin-data.ts` (admin queries), `lib/rounds-data.ts` (an auditor's own round stats, for `/dashboard`).
  - `types/database.ts` — still hand-authored to match the migrations. The project is linked, so this can be regenerated any time with `npx supabase gen types typescript --linked > types/database.ts`; do that after the next schema change rather than hand-editing.
- **Design tokens**: `app/globals.css` carries over the prototype's navy (`#1B3A6B`) / teal (`#0E7C7B`) palette as CSS custom properties, plus all component styles for the ported screens. A single `@media (max-width: 900px)` breakpoint drives the off-canvas sidebar drawer and other mobile/tablet reflow (grids, table scroll, touch-target sizing); there's no other breakpoint tier below that.
- **Not yet implemented**: PWA/offline sync (IndexedDB write-queue).

See [README.md](./README.md) for how to run this locally.

## Audit Content & Scoring Rules

19 sections total, database-backed (see [Status](#status) above) rather than hardcoded, split into two groups in the sidebar:

**Core Sections:** Leadership & Safety Culture, Patient Identification, Communication, Clinical Documentation, Medication Safety, IPC, Falls Prevention, Pressure Injury Prevention, Device Safety, Equipment Safety, Environmental Safety, Patient Rights, Patient Experience, Staff Safety, Emergency Preparedness, Incident Reporting, Quality Indicators.

**Specialty Modules:** ED and ICU checklists.

Standards referenced: JCI (IPSG, QPS, MMU, PCI, FMS, SQE, ACC, PFR, MCI), WHO 5 Moments, IHI, ISMP, NPUAP/EPUAP, SCCM, CDC bundles, RCEM, ATLS, CAHPS.

**Scoring** (`lib/scoring.ts`):
- Yes = 2 pts, Partial = 1 pt, No = 0 pt, N/A = excluded from denominator
- ≥ 95% → Excellent (GREEN)
- ≥ 90% → Good (AMBER-GREEN)
- ≥ 80% → Needs Improvement (AMBER)
- < 80% → Critical (RED) — escalate

**Excel export** (`lib/export-round.ts`) generates a multi-sheet `.xlsx` file:
1. **Summary** — per-section scores and overall compliance
2. **CAPA Tracker** — all non-compliant/partial items with risk-based timelines (Critical 24h, High 48h, Moderate 7d, Low 30d)
3. **One sheet per section** — full item-level detail

Admin panel has an additional "Export All Rounds" function that dumps the round history.

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

Progressive Web App (PWA) — runs in any browser, installable on Android/iOS tablets used during ward rounds. Offline-first design is critical given unreliable hospital ward WiFi. The app is now responsive for phone/tablet screen sizes (see [Status](#status) above), but installability and offline-first sync are not yet implemented.
