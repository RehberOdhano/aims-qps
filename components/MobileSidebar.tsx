"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

// Shared drawer state for the off-canvas sidebar on narrow viewports (see
// .sidebar / .hamburger-btn / .sidebar-backdrop rules in globals.css, keyed
// to the same 900px breakpoint). The topbar (which owns the hamburger) and
// the page content (which owns the actual sidebar markup for /round vs
// /admin) live in different components, so this context is what connects
// them without threading props through the shared protected layout.
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close automatically on route change so the drawer doesn't stay open
  // across navigations. Adjusting state during render (React's documented
  // pattern for "state that depends on a prop change") rather than in an
  // effect, since a real setState-in-effect here would cause an extra
  // cascading render on every navigation.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen((o) => !o), []);
  const close = useCallback(() => setIsOpen(false), []);

  return <SidebarContext.Provider value={{ isOpen, toggle, close }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarToggleButton() {
  const { toggle } = useSidebar();
  return (
    <button type="button" className="hamburger-btn" onClick={toggle} aria-label="Toggle menu">
      <Menu size={18} strokeWidth={2} />
    </button>
  );
}

export function SidebarBackdrop() {
  const { isOpen, close } = useSidebar();
  if (!isOpen) return null;
  return <div className="sidebar-backdrop" onClick={close} />;
}
