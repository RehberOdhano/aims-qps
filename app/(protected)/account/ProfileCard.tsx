"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import { updateOwnProfile } from "@/app/actions/account";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const ROLE_LABEL: Record<string, string> = { admin: "Admin", auditor: "Auditor" };

export default function ProfileCard({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState(profile.fullname);
  const [dept, setDept] = useState(profile.dept ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openEdit() {
    setFullname(profile.fullname);
    setDept(profile.dept ?? "");
    setError(null);
    setIsEditing(true);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateOwnProfile({ fullname, dept });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  return (
    <>
      <Card
        title="Profile"
        headerExtra={
          <button type="button" className="tbl-btn edit" onClick={openEdit}>
            Edit
          </button>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--color-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserCircle size={30} strokeWidth={1.5} color="var(--color-navy)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{profile.fullname}</div>
            <div style={{ marginTop: 5 }}>
              <span className={`role-tag role-${profile.role}`}>{ROLE_LABEL[profile.role] ?? profile.role}</span>
            </div>
          </div>
        </div>

        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "7px 0",
                  color: "var(--color-text-muted)",
                  width: 140,
                  borderTop: "1px solid var(--color-bg)",
                }}
              >
                Username
              </td>
              <td style={{ borderTop: "1px solid var(--color-bg)" }}>
                <strong>@{profile.username}</strong>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "7px 0", color: "var(--color-text-muted)" }}>Department</td>
              <td>{profile.dept || "Not set"}</td>
            </tr>
            <tr>
              <td style={{ padding: "7px 0", color: "var(--color-text-muted)" }}>Status</td>
              <td>
                {profile.status === "active" ? (
                  <span style={{ color: "var(--color-success)", fontWeight: 700 }}>● Active</span>
                ) : (
                  <span style={{ color: "var(--color-danger)", fontWeight: 700 }}>● Inactive</span>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "7px 0", color: "var(--color-text-muted)" }}>Last login</td>
              <td>
                {profile.last_login
                  ? new Date(profile.last_login).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Never"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "7px 0", color: "var(--color-text-muted)" }}>Member since</td>
              <td>
                {new Date(profile.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      {isEditing && (
        <Modal onClose={() => setIsEditing(false)}>
          <h2>Edit Profile</h2>
          <FormField label="Full Name">
            <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} autoFocus />
          </FormField>
          <FormField label="Department">
            <input
              type="text"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              placeholder="e.g. Medical Ward"
            />
          </FormField>
          {error && <div style={{ fontSize: 11, color: "var(--color-danger)", marginBottom: 10 }}>{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <Button className="btn-confirm safe" onClick={handleSave} isLoading={isPending} loadingLabel="Saving…">
              Save Changes
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
