import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import RoundClient from "./RoundClient";

// Admins can conduct rounds too (e.g. a QPS officer who also holds admin
// credentials) — the admin's default landing page after login is still the
// dashboard (see app/page.tsx / app/actions/auth.ts), but they aren't
// blocked from reaching this page, via the sidebar's "Conduct Round" link.
export default async function RoundPage() {
  const profile = await requireUser();

  const supabase = await createClient();
  const { data: draft } = await supabase
    .from("rounds")
    .select("*")
    .eq("auditor_id", profile.id)
    .eq("status", "draft")
    .maybeSingle();

  return <RoundClient profile={profile} draft={draft} />;
}
