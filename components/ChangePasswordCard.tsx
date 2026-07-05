"use client";

import { useState, useTransition } from "react";
import { changeOwnPassword } from "@/app/actions/account";
import Card from "@/components/Card";
import FormField from "@/components/FormField";
import Button from "@/components/Button";

export default function ChangePasswordCard() {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function handleSubmit() {
    if (next !== confirm) {
      setMessage({ text: "New passwords do not match.", ok: false });
      return;
    }
    startTransition(async () => {
      const result = await changeOwnPassword(current, next);
      if ("error" in result) {
        setMessage({ text: result.error, ok: false });
        return;
      }
      setMessage({ text: "Password updated successfully.", ok: true });
      setCurrent("");
      setNext("");
      setConfirm("");
    });
  }

  return (
    <Card title="Change Password" style={{ maxWidth: 400 }}>
      <FormField label="Current Password">
        <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </FormField>
      <FormField label="New Password">
        <input
          type="password"
          placeholder="New password (min 6 chars)"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </FormField>
      <FormField label="Confirm New Password">
        <input
          type="password"
          placeholder="Repeat new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </FormField>
      {message && (
        <div
          style={{
            fontSize: 11,
            marginBottom: 10,
            color: message.ok ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          {message.text}
        </div>
      )}
      <Button
        className="btn-primary"
        style={{ width: "auto", padding: "9px 22px" }}
        onClick={handleSubmit}
        isLoading={isPending}
        loadingLabel="Updating…"
      >
        Update Password
      </Button>
    </Card>
  );
}
