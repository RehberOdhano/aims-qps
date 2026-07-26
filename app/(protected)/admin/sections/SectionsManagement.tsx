"use client";

// Shared by /admin/sections (group="Core Sections") and
// /admin/specialty-modules (group="Specialty Modules") — same CRUD/reorder
// UI, scoped to whichever group the page passes in, so a section always
// belongs to the page it was created from rather than needing a group
// picker in the create/edit forms.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  createSection,
  updateSection,
  deleteSection,
  moveSection,
  createItem,
  updateItem,
  deleteItem,
  moveItem,
} from "@/app/actions/admin-content";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Pagination, { paginate } from "@/components/Pagination";
import { RISK_LABELS, type Section, type SectionGroup, type RiskLevel } from "@/lib/sections";

type Props = {
  sections: Section[];
  group: SectionGroup;
  title: string;
};

const RISKS: RiskLevel[] = ["C", "H", "M", "L"];
const DEFAULT_PAGE_SIZE = 5;

function matchesQuery(section: Section, query: string): boolean {
  const q = query.toLowerCase();
  if (section.label.toLowerCase().includes(q) || section.std.toLowerCase().includes(q)) return true;
  return section.items.some((item) => item.q.toLowerCase().includes(q) || item.std.toLowerCase().includes(q));
}

export default function SectionsManagement({ sections, group, title }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Add-section modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newStd, setNewStd] = useState("");
  const [addSectionError, setAddSectionError] = useState<string | null>(null);
  const [isAddingSection, startAddSection] = useTransition();

  // Edit/delete section
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editStd, setEditStd] = useState("");
  const [editSectionError, setEditSectionError] = useState<string | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [deleteSectionError, setDeleteSectionError] = useState<string | null>(null);

  // Add-item form (for whichever section is expanded)
  const [newItemStd, setNewItemStd] = useState("");
  const [newItemQuestion, setNewItemQuestion] = useState("");
  const [newItemRisk, setNewItemRisk] = useState<RiskLevel>("H");
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const [isAddingItem, startAddItem] = useTransition();

  // Edit/delete item
  const [editingItem, setEditingItem] = useState<{ id: string; std: string; q: string; risk: RiskLevel } | null>(
    null,
  );
  const [editItemStd, setEditItemStd] = useState("");
  const [editItemQuestion, setEditItemQuestion] = useState("");
  const [editItemRisk, setEditItemRisk] = useState<RiskLevel>("H");
  const [editItemError, setEditItemError] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; sectionId: string; q: string } | null>(null);
  const [deleteItemError, setDeleteItemError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function openAddSection() {
    setNewLabel("");
    setNewStd("");
    setAddSectionError(null);
    setIsAddOpen(true);
  }

  function openEditSection(s: Section) {
    setEditingSection(s);
    setEditLabel(s.label);
    setEditStd(s.std);
    setEditSectionError(null);
  }

  function handleAddSection() {
    setAddSectionError(null);
    startAddSection(async () => {
      const result = await createSection({ label: newLabel, grp: group, std: newStd });
      if ("error" in result) {
        setAddSectionError(result.error);
        return;
      }
      setIsAddOpen(false);
      setPage(1);
      refresh();
    });
  }

  function handleSaveSection() {
    if (!editingSection) return;
    startTransition(async () => {
      const result = await updateSection(editingSection.id, { label: editLabel, grp: group, std: editStd });
      if ("error" in result) {
        setEditSectionError(result.error);
        return;
      }
      setEditingSection(null);
      refresh();
    });
  }

  function handleDeleteSection() {
    if (!deletingSection) return;
    startTransition(async () => {
      const result = await deleteSection(deletingSection.id);
      if ("error" in result) {
        setDeleteSectionError(result.error);
        return;
      }
      setDeletingSection(null);
      if (expandedId === deletingSection.id) setExpandedId(null);
      refresh();
    });
  }

  function handleMoveSection(id: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveSection(id, direction);
      refresh();
    });
  }

  function handleAddItem(sectionId: string) {
    setAddItemError(null);
    startAddItem(async () => {
      const result = await createItem({
        sectionId,
        std: newItemStd,
        question: newItemQuestion,
        risk: newItemRisk,
      });
      if ("error" in result) {
        setAddItemError(result.error);
        return;
      }
      setNewItemStd("");
      setNewItemQuestion("");
      setNewItemRisk("H");
      refresh();
    });
  }

  function openEditItem(item: { id: string; std: string; q: string; risk: RiskLevel }) {
    setEditingItem(item);
    setEditItemStd(item.std);
    setEditItemQuestion(item.q);
    setEditItemRisk(item.risk);
    setEditItemError(null);
  }

  function handleSaveItem() {
    if (!editingItem) return;
    startTransition(async () => {
      const result = await updateItem(editingItem.id, {
        std: editItemStd,
        question: editItemQuestion,
        risk: editItemRisk,
      });
      if ("error" in result) {
        setEditItemError(result.error);
        return;
      }
      setEditingItem(null);
      refresh();
    });
  }

  function handleDeleteItem() {
    if (!deletingItem) return;
    startTransition(async () => {
      const result = await deleteItem(deletingItem.id);
      if ("error" in result) {
        setDeleteItemError(result.error);
        return;
      }
      setDeletingItem(null);
      refresh();
    });
  }

  function handleMoveItem(id: string, sectionId: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveItem(id, sectionId, direction);
      refresh();
    });
  }

  const trimmedQuery = query.trim();
  const filtered = trimmedQuery ? sections.filter((s) => matchesQuery(s, trimmedQuery)) : sections;

  const { safePage, totalPages, pageItems: pageSections } = paginate(filtered, page, pageSize);

  return (
    <>
      <Card
        title={title}
        headerExtra={
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div className="search-bar">
              <Search size={14} strokeWidth={2} />
              <input
                type="text"
                className="search-input"
                placeholder="Search sections or questions…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{sections.length} sections</span>
            <button type="button" className="tbl-btn edit" onClick={openAddSection}>
              + Add Section
            </button>
          </div>
        }
      >

        {filtered.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "var(--color-text-faint)" }}>
            {trimmedQuery ? "No sections match your search." : "No sections yet. Add one to get started."}
          </div>
        ) : (
          pageSections.map((s) => {
            const idx = sections.findIndex((x) => x.id === s.id);
            // While actively searching, force-expand every matching section
            // so the admin can see why it matched without an extra click.
            const isExpanded = trimmedQuery ? true : expandedId === s.id;
            return (
              <div
                key={s.id}
                style={{ border: "1px solid var(--color-bg)", borderRadius: 6, marginBottom: 8, overflow: "hidden" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: isExpanded ? "var(--color-bg)" : "transparent",
                  }}
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <strong style={{ flex: 1, fontSize: 12 }}>{s.label}</strong>
                  <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>{s.items.length} items</span>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="tbl-btn"
                      disabled={idx === 0 || isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(s.id, "up");
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="tbl-btn"
                      disabled={idx === sections.length - 1 || isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(s.id, "down");
                      }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="tbl-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditSection(s);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="tbl-btn del"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingSection(s);
                        setDeleteSectionError(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: "10px 12px", borderTop: "1px solid var(--color-bg)" }}>
                    {s.items.map((item, i) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "6px 0",
                          borderBottom: i === s.items.length - 1 ? "none" : "1px solid var(--color-bg)",
                          fontSize: 11,
                        }}
                      >
                        <span style={{ color: "var(--color-text-faint)", width: 18 }}>{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "var(--color-text-muted)", fontSize: 10 }}>{item.std}</div>
                          <div>{item.q}</div>
                        </div>
                        <span className={`risk-tag risk-${item.risk}`}>{RISK_LABELS[item.risk]}</span>
                        <div style={{ display: "flex", gap: 5, alignItems: "center", marginLeft: "auto" }}>
                          <button
                            type="button"
                            className="tbl-btn"
                            disabled={i === 0 || isPending}
                            onClick={() => handleMoveItem(item.id, s.id, "up")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="tbl-btn"
                            disabled={i === s.items.length - 1 || isPending}
                            onClick={() => handleMoveItem(item.id, s.id, "down")}
                          >
                            ↓
                          </button>
                          <button type="button" className="tbl-btn edit" onClick={() => openEditItem(item)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="tbl-btn del"
                            onClick={() => {
                              setDeletingItem({ id: item.id, sectionId: s.id, q: item.q });
                              setDeleteItemError(null);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-bg)" }}>
                      <div className="inline-form">
                        <input
                          type="text"
                          placeholder="Standard ref (e.g. JCI QPS.1)"
                          value={newItemStd}
                          onChange={(e) => setNewItemStd(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Question text"
                          value={newItemQuestion}
                          onChange={(e) => setNewItemQuestion(e.target.value)}
                          style={{ flex: 2 }}
                        />
                        <select value={newItemRisk} onChange={(e) => setNewItemRisk(e.target.value as RiskLevel)}>
                          {RISKS.map((r) => (
                            <option key={r} value={r}>
                              {RISK_LABELS[r]}
                            </option>
                          ))}
                        </select>
                        <Button isLoading={isAddingItem} loadingLabel="Adding…" onClick={() => handleAddItem(s.id)}>
                          + Add Item
                        </Button>
                      </div>
                      {addItemError && (
                        <div style={{ fontSize: 11, color: "var(--color-danger)", marginTop: 6 }}>{addItemError}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>

      {isAddOpen && (
        <Modal onClose={() => setIsAddOpen(false)}>
          <h2>Add Section</h2>
          <FormField label="Label">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. 18. New Section"
              autoFocus
            />
          </FormField>
          <FormField label="Standard reference">
            <input
              type="text"
              value={newStd}
              onChange={(e) => setNewStd(e.target.value)}
              placeholder="e.g. JCI QPS.1"
            />
          </FormField>
          {addSectionError && <div style={{ fontSize: 11, color: "var(--color-danger)", marginBottom: 10 }}>{addSectionError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <Button className="btn-confirm safe" onClick={handleAddSection} isLoading={isAddingSection} loadingLabel="Adding…">
              Add Section
            </Button>
          </div>
        </Modal>
      )}

      {editingSection && (
        <Modal onClose={() => setEditingSection(null)}>
          <h2>Edit Section</h2>
          <FormField label="Label">
            <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
          </FormField>
          <FormField label="Standard reference">
            <input type="text" value={editStd} onChange={(e) => setEditStd(e.target.value)} />
          </FormField>
          {editSectionError && <div style={{ fontSize: 11, color: "var(--color-danger)", marginBottom: 10 }}>{editSectionError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setEditingSection(null)}>
              Cancel
            </button>
            <Button className="btn-confirm safe" onClick={handleSaveSection} isLoading={isPending}>
              Save Changes
            </Button>
          </div>
        </Modal>
      )}

      {editingItem && (
        <Modal onClose={() => setEditingItem(null)}>
          <h2>Edit Item</h2>
          <FormField label="Standard reference">
            <input type="text" value={editItemStd} onChange={(e) => setEditItemStd(e.target.value)} />
          </FormField>
          <FormField label="Question">
            <textarea
              value={editItemQuestion}
              onChange={(e) => setEditItemQuestion(e.target.value)}
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
            />
          </FormField>
          <FormField label="Risk level">
            <select value={editItemRisk} onChange={(e) => setEditItemRisk(e.target.value as RiskLevel)}>
              {RISKS.map((r) => (
                <option key={r} value={r}>
                  {RISK_LABELS[r]}
                </option>
              ))}
            </select>
          </FormField>
          {editItemError && <div style={{ fontSize: 11, color: "var(--color-danger)", marginBottom: 10 }}>{editItemError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setEditingItem(null)}>
              Cancel
            </button>
            <Button className="btn-confirm safe" onClick={handleSaveItem} isLoading={isPending}>
              Save Changes
            </Button>
          </div>
        </Modal>
      )}

      {deletingSection && (
        <ConfirmDialog
          title="Delete Section"
          message={
            <>
              Delete section <strong>{deletingSection.label}</strong> and all {deletingSection.items.length} of its
              items? This cannot be undone.
            </>
          }
          confirmLabel="Delete Section"
          isPending={isPending}
          error={deleteSectionError}
          onConfirm={handleDeleteSection}
          onCancel={() => setDeletingSection(null)}
        />
      )}

      {deletingItem && (
        <ConfirmDialog
          title="Delete Item"
          message={
            <>
              Delete this item? <em>&ldquo;{deletingItem.q}&rdquo;</em> This cannot be undone.
            </>
          }
          confirmLabel="Delete Item"
          isPending={isPending}
          error={deleteItemError}
          onConfirm={handleDeleteItem}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </>
  );
}
