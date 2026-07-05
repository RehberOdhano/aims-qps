"use client";

import { Loader2 } from "lucide-react";

type Props = {
  type?: "button" | "submit";
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: React.ReactNode;
  children: React.ReactNode;
};

// Shared action-button behavior: shows a spinning Loader2 + optional
// loading-specific label and disables itself while `isLoading`. Visual
// styling stays entirely in the passed `className` (btn-add, btn-confirm,
// sb-btn, etc.) — this only owns the loading state, not the look.
export default function Button({
  type = "button",
  className,
  style,
  onClick,
  disabled,
  isLoading,
  loadingLabel,
  children,
}: Props) {
  return (
    <button type={type} className={className} style={style} onClick={onClick} disabled={disabled || isLoading}>
      {isLoading && <Loader2 size={14} strokeWidth={2} className="icon-spin" />}
      {isLoading ? (loadingLabel ?? children) : children}
    </button>
  );
}
