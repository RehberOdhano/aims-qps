"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createDepartment, updateDepartment, deleteDepartment, moveDepartment } from "@/app/actions/admin-content";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import Pagination, { paginate } from "@/components/Pagination";
import type { DepartmentRow } from "@/lib/sections-data";

type Props = {
  departments: DepartmentRow[];
};

const DEFAULT_PAGE_SIZE = 10;

export default function DepartmentsManagement({ departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [addDeptError, setAddDeptError] = useState<string | null>(null);
  const [isAddingDept, startAddDept] = useTransition();

  const [editingDept, setEditingDept] = useState<DepartmentRow | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptError, setEditDeptError] = useState<string | null>(null);

  const [deletingDept, setDeletingDept] = useState<DepartmentRow | null>(null);
  const [deleteDeptError, setDeleteDeptError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function openAdd() {
    setNewDept("");
    setAddDeptError(null);
    setIsAddOpen(true);
  }

  function handleAddDept() {
    setAddDeptError(null);
    startAddDept(async () => {
      const result = await createDepartment(newDept);
      if ("error" in result) {
        setAddDeptError(result.error);
        return;
      }
      setIsAddOpen(false);
      setPage(1);
      refresh();
    });
  }

  function handleSaveDept() {
    if (!editingDept) return;
    startTransition(async () => {
      const result = await updateDepartment(editingDept.id, editDeptName);
      if ("error" in result) {
        setEditDeptError(result.error);
        return;
      }
      setEditingDept(null);
      refresh();
    });
  }

  function handleDeleteDept() {
    if (!deletingDept) return;
    startTransition(async () => {
      const result = await deleteDepartment(deletingDept.id);
      if ("error" in result) {
        setDeleteDeptError(result.error);
        return;
      }
      setDeletingDept(null);
      refresh();
    });
  }

  function handleMoveDept(id: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveDepartment(id, direction);
      refresh();
    });
  }

  const filtered = query.trim()
    ? departments.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()))
    : departments;

  const { safePage, totalPages, pageItems: pageDepartments } = paginate(filtered, page, pageSize);

  return (
    <>
      <Card
        title="Departments / Units"
        headerExtra={
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div className="search-bar">
              <Search size={14} strokeWidth={2} />
              <input
                type="text"
                className="search-input"
                placeholder="Search departments…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{departments.length} total</span>
            <button type="button" className="tbl-btn edit" onClick={openAdd}>
              + Add Department
            </button>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "var(--color-text-faint)" }}>
            {query.trim() ? "No departments match your search." : "No departments yet. Add one to get started."}
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageDepartments.map((d) => {
                    const idx = departments.findIndex((x) => x.id === d.id);
                    return (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.name}</strong>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="tbl-btn"
                              disabled={idx === 0 || isPending}
                              onClick={() => handleMoveDept(d.id, "up")}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="tbl-btn"
                              disabled={idx === departments.length - 1 || isPending}
                              onClick={() => handleMoveDept(d.id, "down")}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="tbl-btn edit"
                              onClick={() => {
                                setEditingDept(d);
                                setEditDeptName(d.name);
                                setEditDeptError(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="tbl-btn del"
                              onClick={() => {
                                setDeletingDept(d);
                                setDeleteDeptError(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
          </>
        )}
      </Card>

      {isAddOpen && (
        <Modal onClose={() => setIsAddOpen(false)}>
          <h2>Add Department</h2>
          <FormField label="Name">
            <input
              type="text"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="e.g. Dialysis Unit"
              autoFocus
            />
          </FormField>
          {addDeptError && <div style={{ fontSize: 11, color: "var(--color-danger)", marginBottom: 10 }}>{addDeptError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <Button className="btn-confirm safe" onClick={handleAddDept} isLoading={isAddingDept} loadingLabel="Adding…">
              Add Department
            </Button>
          </div>
        </Modal>
      )}

      {editingDept && (
        <Modal onClose={() => setEditingDept(null)}>
          <h2>Edit Department</h2>
          <FormField label="Name">
            <input type="text" value={editDeptName} onChange={(e) => setEditDeptName(e.target.value)} />
          </FormField>
          {editDeptError && <div style={{ fontSize: 11, color: "var(--color-danger)", marginBottom: 10 }}>{editDeptError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setEditingDept(null)}>
              Cancel
            </button>
            <Button className="btn-confirm safe" onClick={handleSaveDept} isLoading={isPending}>
              Save Changes
            </Button>
          </div>
        </Modal>
      )}

      {deletingDept && (
        <ConfirmDialog
          title="Delete Department"
          message={
            <>
              Delete department <strong>{deletingDept.name}</strong>? This cannot be undone.
            </>
          }
          confirmLabel="Delete Department"
          isPending={isPending}
          error={deleteDeptError}
          onConfirm={handleDeleteDept}
          onCancel={() => setDeletingDept(null)}
        />
      )}
    </>
  );
}
