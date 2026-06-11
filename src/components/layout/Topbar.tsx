"use client";

import { Bell, Menu, Search } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminSession } from "@/shared/lib/auth/session";

export function Topbar({
  admin,
  onOpenMobileSidebar,
}: {
  admin: AdminSession;
  onOpenMobileSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 lg:px-6">
      <Button
        aria-label="Open navigation"
        className="lg:hidden"
        onClick={onOpenMobileSidebar}
        size="icon"
        variant="outline"
      >
        <Menu className="size-4" />
      </Button>
      <div className="relative hidden w-full max-w-xl md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Global search"
          className="h-9 bg-muted/40 pl-9"
          placeholder="Search bookings, customers, newspapers"
        />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <Button aria-label="Notifications" size="icon" variant="ghost">
          <Bell className="size-4" />
        </Button>
        <ThemeToggle />
        <UserMenu admin={admin} />
      </div>
    </header>
  );
}
