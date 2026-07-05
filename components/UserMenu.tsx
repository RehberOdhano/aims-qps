"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ChevronDown, UserCircle, Settings, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import Button from "@/components/Button";
import type { UserRole } from "@/types/database";

type Props = {
  fullname: string;
  role: UserRole;
};

// useFormStatus only reports the pending state of the nearest ancestor
// <form>, and only when called from one of its descendants — hence a small
// child component rather than reading it directly in UserMenu.
function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="user-menu-item" isLoading={pending} loadingLabel="Logging out…">
      <LogOut size={14} strokeWidth={2} />
      Log out
    </Button>
  );
}

export default function UserMenu({ fullname, role }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Admins manage settings from inside the admin layout (so they keep their
  // sidebar); auditors land on the shared account page instead.
  const settingsHref = role === "admin" ? "/admin/settings" : "/account";

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button type="button" className="user-menu-trigger" onClick={() => setOpen((o) => !o)}>
        <UserCircle size={16} strokeWidth={2} />
        {fullname}
        <ChevronDown size={13} strokeWidth={2} />
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-menu-name">{fullname}</div>
            <div className="user-menu-role">{role}</div>
          </div>
          <Link href={settingsHref} className="user-menu-item" onClick={() => setOpen(false)}>
            <Settings size={14} strokeWidth={2} />
            Profile
          </Link>
          <form action={logout}>
            <LogoutButton />
          </form>
        </div>
      )}
    </div>
  );
}
