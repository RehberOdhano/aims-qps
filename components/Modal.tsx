"use client";

import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
  width?: number | string;
  style?: React.CSSProperties;
  onClose?: () => void;
};

export default function Modal({ children, width, style, onClose }: Props) {
  useEffect(() => {
    if (!onClose) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-bg">
      <div
        className="modal"
        style={{
          ...(width ? { width, maxWidth: "calc(100vw - 32px)" } : undefined),
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
