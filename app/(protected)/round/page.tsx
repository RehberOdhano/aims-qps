import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getAllSections, getAllDepartments } from "@/lib/sections-data";
import RoundClient from "./RoundClient";

// Admins can conduct rounds too (e.g. a QPS officer who also holds admin
// credentials) — the admin's default landing page after login is still the
// dashboard (see app/page.tsx / app/actions/auth.ts), but they aren't
// blocked from reaching this page, via the sidebar's "Conduct Round" link.
//
// An auditor can have multiple concurrent drafts (see
// 0005_allow_multiple_drafts.sql), so which one this page shows is driven by
// the `draft` search param: no param = start a brand-new round; `?draft=<id>`
// = resume that specific one. An id that's missing, someone else's, or
// already completed just resolves to a blank round rather than erroring —
// same tolerant fallback as the old "no draft found" case.
export default async function RoundPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft: draftId } = await searchParams;
  const profile = await requireUser();

  const supabase = await createClient();
  const [{ data: draft }, sections, departments] = await Promise.all([
    draftId
      ? supabase
          .from("rounds")
          .select("*")
          .eq("id", draftId)
          .eq("auditor_id", profile.id)
          .eq("status", "draft")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getAllSections(),
    getAllDepartments(),
  ]);

  return <RoundClient profile={profile} draft={draft} sections={sections} departments={departments} />;
}
