"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser, deleteUser } from "@/app/actions/admin-users";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import type { Database, UserRole, UserStatus } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type Props = {
  currentProfile: Profile;
  profiles: Profile[];
};

const ROLE_LABEL: Record<UserRole, string> = { admin: "Admin", auditor: "Auditor" };

export default function UserManagement({ currentProfile, profiles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Separate from isPending (which covers edit/delete) so the Add User
  // button's loading state is precise, not lit up while a different row's
  // edit/delete is in flight.
  const [isAdding, startAddTransition] = useTransition();

  const [newUsername, setNewUsername] = useState("");
  const [newFullname, setNewFullname] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("auditor");
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFullname, setEditFullname] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("auditor");
  const [editStatus, setEditStatus] = useState<UserStatus>("active");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleAddUser() {
    setAddError(null);
    startAddTransition(async () => {
      const result = await createUser({
        username: newUsername,
        fullname: newFullname,
        password: newPassword,
        role: newRole,
      });
      if ("error" in result) {
        setAddError(result.error);
        return;
      }
      setNewUsername("");
      setNewFullname("");
      setNewPassword("");
      setNewRole("auditor");
      router.refresh();
    });
  }

  function openEdit(p: Profile) {
    setEditingId(p.id);
    setEditFullname(p.fullname);
    setEditRole(p.role);
    setEditStatus(p.status);
    setEditPassword("");
    setEditError(null);
  }

  function handleSaveEdit() {
    if (!editingId) return;
    startTransition(async () => {
      const result = await updateUser({
        id: editingId,
        fullname: editFullname,
        role: editRole,
        status: editStatus,
        newPassword: editPassword || undefined,
      });
      if ("error" in result) {
        setEditError(result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function handleConfirmDelete() {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteUser(deletingId);
      if ("error" in result) {
        setDeleteError(result.error);
        return;
      }
      setDeletingId(null);
      router.refresh();
    });
  }

  const editingProfile = profiles.find((p) => p.id === editingId);
  const deletingProfile = profiles.find((p) => p.id === deletingId);

  return (
    <Card
      title="User Management"
      headerExtra={<span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{profiles.length} users total</span>}
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Full Name</th>
            <th>Role</th>
            <th>Last Login</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.username}</strong>
              </td>
              <td>{p.fullname}</td>
              <td>
                <span className={`role-tag role-${p.role}`}>{ROLE_LABEL[p.role]}</span>
              </td>
              <td style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                {p.last_login
                  ? new Date(p.last_login).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Never"}
              </td>
              <td>
                {p.status === "active" ? (
                  <span style={{ color: "var(--color-success)", fontWeight: 700, fontSize: 11 }}>● Active</span>
                ) : (
                  <span style={{ color: "var(--color-danger)", fontWeight: 700, fontSize: 11 }}>● Inactive</span>
                )}
              </td>
              <td style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <button type="button" className="tbl-btn edit" onClick={() => openEdit(p)}>
                  Edit
                </button>
                {p.id !== currentProfile.id ? (
                  <button
                    type="button"
                    className="tbl-btn del"
                    onClick={() => {
                      setDeletingId(p.id);
                      setDeleteError(null);
                    }}
                  >
                    Delete
                  </button>
                ) : (
                  <span style={{ fontSize: 10, color: "var(--color-text-faint)" }}>You</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 16, borderTop: "1px solid var(--color-bg)", paddingTop: 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#4A5568",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Add New User
        </div>
        <div className="inline-form">
          <input type="text" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          <input
            type="text"
            placeholder="Full Name"
            value={newFullname}
            onChange={(e) => setNewFullname(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
            <option value="auditor">Auditor</option>
            <option value="admin">Admin</option>
          </select>
          <Button className="btn-add" onClick={handleAddUser} isLoading={isAdding} loadingLabel="Adding…">
            + Add User
          </Button>
        </div>
        {addError && <div style={{ fontSize: 11, color: "var(--color-danger)", marginTop: 6 }}>{addError}</div>}
      </div>

      {editingProfile && (
        <Modal onClose={() => setEditingId(null)}>
          <h2>Edit User</h2>
          <FormField label="Full Name">
            <input type="text" value={editFullname} onChange={(e) => setEditFullname(e.target.value)} />
          </FormField>
          <FormField label="Role">
            <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
              <option value="admin">Admin</option>
              <option value="auditor">Auditor</option>
            </select>
          </FormField>
          <FormField label="Reset Password (leave blank to keep)">
            <input
              type="password"
              placeholder="New password…"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
            />
          </FormField>
          <FormField label="Status">
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as UserStatus)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          {editError && <div style={{ fontSize: 11, color: "var(--color-danger)", marginBottom: 10 }}>{editError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setEditingId(null)}>
              Cancel
            </button>
            <Button className="btn-confirm safe" onClick={handleSaveEdit} isLoading={isPending}>
              Save Changes
            </Button>
          </div>
        </Modal>
      )}

      {deletingProfile && (
        <ConfirmDialog
          title="Delete User"
          message={
            <>
              Are you sure you want to delete user <strong>{deletingProfile.username}</strong>? This cannot be
              undone.
            </>
          }
          confirmLabel="Delete"
          isPending={isPending}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </Card>
  );
}
