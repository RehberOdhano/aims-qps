"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ClipboardEdit,
  Stethoscope,
  Building2,
  Settings,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { useSidebar, SidebarBackdrop } from "@/components/MobileSidebar";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/rounds", label: "Rounds", icon: ClipboardList },
  { href: "/admin/sections", label: "Core Sections", icon: ClipboardEdit },
  { href: "/admin/specialty-modules", label: "Specialty Modules", icon: Stethoscope },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  // Lives outside the admin route group (shared with the auditor role), so
  // "active" highlighting for it never applies within this sidebar — it's a
  // one-way door out to the rounding tool, not a page rendered inside here.
  { href: "/round", label: "Conduct Round", icon: ClipboardCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      <SidebarBackdrop />
      <div className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
        <div className="nav-list" style={{ flex: "none", paddingTop: 0 }}>
          {ITEMS.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
