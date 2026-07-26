"use server";

import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { RiskLevel, SectionGroup } from "@/lib/sections";

export type AdminActionResult = { error: string } | { ok: true };

type ContentTable = "sections" | "section_items" | "departments";

async function nextSortOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: ContentTable,
  scope?: { column: string; value: string },
): Promise<number> {
  let query = supabase.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  if (scope) query = query.eq(scope.column, scope.value);
  const { data } = await query;
  return (data?.[0]?.sort_order ?? -1) + 1;
}

// Swaps sort_order with the adjacent row (within `scope`, if given) — simple
// up/down reordering rather than free-form drag-and-drop, consistent with
// this app's preference for plain, well-tested solutions over clever ones.
async function moveRow(
  table: ContentTable,
  id: string,
  direction: "up" | "down",
  scope?: { column: string; value: string },
): Promise<AdminActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  let query = supabase.from(table).select("id, sort_order").order("sort_order", { ascending: true });
  if (scope) query = query.eq(scope.column, scope.value);
  const { data: rows, error } = await query;
  if (error) return { error: error.message };

  const rowsList = rows ?? [];
  const idx = rowsList.findIndex((r) => r.id === id);
  if (idx === -1) return { error: "Row not found." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rowsList.length) return { ok: true }; // already at the edge

  const current = rowsList[idx];
  const swap = rowsList[swapIdx];
  const { error: e1 } = await supabase.from(table).update({ sort_order: swap.sort_order }).eq("id", current.id);
  if (e1) return { error: e1.message };
  const { error: e2 } = await supabase.from(table).update({ sort_order: current.sort_order }).eq("id", swap.id);
  if (e2) return { error: e2.message };
  return { ok: true };
}

// --- Sections ---

export type SectionInput = { label: string; grp: SectionGroup; std: string };

export async function createSection(input: SectionInput): Promise<AdminActionResult> {
  await requireRole("admin");
  const label = input.label.trim();
  if (!label) return { error: "Section label is required." };

  const supabase = await createClient();
  const sortOrder = await nextSortOrder(supabase, "sections");
  const { error } = await supabase
    .from("sections")
    .insert({ label, grp: input.grp, std: input.std.trim() || null, sort_order: sortOrder });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateSection(id: string, input: SectionInput): Promise<AdminActionResult> {
  await requireRole("admin");
  const label = input.label.trim();
  if (!label) return { error: "Section label is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sections")
    .update({ label, grp: input.grp, std: input.std.trim() || null })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteSection(id: string): Promise<AdminActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  // Cascades to section_items via the FK's `on delete cascade`.
  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function moveSection(id: string, direction: "up" | "down"): Promise<AdminActionResult> {
  return moveRow("sections", id, direction);
}

// --- Section items ---

export type SectionItemInput = { sectionId: string; std: string; question: string; risk: RiskLevel };

export async function createItem(input: SectionItemInput): Promise<AdminActionResult> {
  await requireRole("admin");
  const question = input.question.trim();
  if (!question) return { error: "Question text is required." };

  const supabase = await createClient();
  const sortOrder = await nextSortOrder(supabase, "section_items", { column: "section_id", value: input.sectionId });
  const { error } = await supabase.from("section_items").insert({
    section_id: input.sectionId,
    std: input.std.trim() || null,
    question,
    risk: input.risk,
    sort_order: sortOrder,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateItem(
  id: string,
  input: Omit<SectionItemInput, "sectionId">,
): Promise<AdminActionResult> {
  await requireRole("admin");
  const question = input.question.trim();
  if (!question) return { error: "Question text is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("section_items")
    .update({ std: input.std.trim() || null, question, risk: input.risk })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteItem(id: string): Promise<AdminActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("section_items").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function moveItem(id: string, sectionId: string, direction: "up" | "down"): Promise<AdminActionResult> {
  return moveRow("section_items", id, direction, { column: "section_id", value: sectionId });
}

// --- Departments ---

export async function createDepartment(name: string): Promise<AdminActionResult> {
  await requireRole("admin");
  const trimmed = name.trim();
  if (!trimmed) return { error: "Department name is required." };

  const supabase = await createClient();
  const sortOrder = await nextSortOrder(supabase, "departments");
  const { error } = await supabase.from("departments").insert({ name: trimmed, sort_order: sortOrder });
  if (error) {
    return { error: error.code === "23505" ? "A department with that name already exists." : error.message };
  }
  return { ok: true };
}

export async function updateDepartment(id: string, name: string): Promise<AdminActionResult> {
  await requireRole("admin");
  const trimmed = name.trim();
  if (!trimmed) return { error: "Department name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("departments").update({ name: trimmed }).eq("id", id);
  if (error) {
    return { error: error.code === "23505" ? "A department with that name already exists." : error.message };
  }
  return { ok: true };
}

export async function deleteDepartment(id: string): Promise<AdminActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function moveDepartment(id: string, direction: "up" | "down"): Promise<AdminActionResult> {
  return moveRow("departments", id, direction);
}
