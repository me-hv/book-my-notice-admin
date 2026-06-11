"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { AdminSession } from "@/shared/lib/auth/session";

const SIDEBAR_STORAGE_KEY = "book-my-notice-sidebar-collapsed";
const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminSession;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (storedValue) {
      setCollapsed(storedValue === "true");
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const nextValue = !current;

      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));

      return nextValue;
    });
  }

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        onToggleCollapsed={toggleCollapsed}
      />
      <div
        className="flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ease-out lg:pl-[var(--sidebar-width)]"
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <Topbar admin={admin} onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 bg-muted/30 dark:bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
