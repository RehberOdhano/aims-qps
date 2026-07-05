"use client";

import Modal from "./Modal";
import Button from "./Button";

type Props = {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  tone?: "danger" | "safe";
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = "danger",
  isPending,
  error,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal onClose={onCancel}>
      <h2>{title}</h2>
      <div style={{ fontSize: 13, color: "#4A5568", lineHeight: 1.6 }}>{message}</div>
      {error && <div style={{ fontSize: 11, color: "var(--color-danger)", marginTop: 10 }}>{error}</div>}
      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <Button
          className={`btn-confirm${tone === "safe" ? " safe" : ""}`}
          onClick={onConfirm}
          isLoading={isPending}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
