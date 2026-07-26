"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, UserCircle, type LucideIcon } from "lucide-react";
import { useSidebar, SidebarBackdrop } from "@/components/MobileSidebar";

// Shared by /dashboard and /account — the two non-admin pages an auditor
// visits outside the round-taking tool itself. /round keeps its own
// specialized sidebar (department/date/shift, compliance meter, section
// nav) rather than this generic one, mirroring how admins already leave
// AdminSidebar behind when they step into /round.
const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/round", label: "Conduct Round", icon: ClipboardCheck },
  { href: "/account", label: "Profile", icon: UserCircle },
];

export default function AuditorSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      <SidebarBackdrop />
      <div className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
        <div className="nav-list" style={{ flex: "none", paddingTop: 0 }}>
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`nav-item${active ? " active" : ""}`} onClick={close}>
                <Icon size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, lineHeight: 1.3 }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
