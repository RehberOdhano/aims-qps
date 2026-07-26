import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Section } from "@/lib/sections";

// Sections/items are admin-managed content, not implementation detail — see
// app/actions/admin-content.ts for the write side. Nested join done in JS
// rather than PostgREST embedding, same "trivial at this scale" reasoning
// lib/admin-data.ts already uses for the round<->auditor join.
export async function getAllSections(): Promise<Section[]> {
  const supabase = await createClient();
  const [{ data: sections }, { data: items }] = await Promise.all([
    supabase.from("sections").select("*").order("sort_order", { ascending: true }),
    supabase.from("section_items").select("*").order("sort_order", { ascending: true }),
  ]);

  return (sections ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    grp: s.grp,
    std: s.std ?? "",
    items: (items ?? [])
      .filter((i) => i.section_id === s.id)
      .map((i) => ({ id: i.id, std: i.std ?? "", q: i.question, risk: i.risk })),
  }));
}

export async function getAllDepartments(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select("name").order("sort_order", { ascending: true });
  return (data ?? []).map((d) => d.name);
}

export type DepartmentRow = { id: string; name: string };

// Includes ids — used by the admin content-management screen, which needs
// something to edit/delete/reorder by; getAllDepartments() above stays a
// plain string list for the round-taking dropdown, which only needs names.
export async function getAllDepartmentRows(): Promise<DepartmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select("id, name").order("sort_order", { ascending: true });
  return data ?? [];
}
