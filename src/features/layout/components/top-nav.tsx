import { Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { MobileSidebar } from "@/features/layout/components/mobile-sidebar";
import type { AdminSession } from "@/shared/lib/auth/session";

export function TopNav({ admin }: { admin: AdminSession }) {
  return (
    <header className="flex h-16 items-center gap-3 border-b bg-white px-4 lg:px-6">
      <MobileSidebar />
      <div className="relative hidden w-full max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 bg-muted/40 pl-9"
          placeholder="Search bookings, customers, newspapers"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button aria-label="Notifications" size="icon" variant="ghost">
          <Bell className="size-4" />
        </Button>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-5">{admin.email}</p>
          <p className="text-xs text-muted-foreground">{admin.role}</p>
        </div>
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {admin.email.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <LogoutButton />
      </div>
    </header>
  );
}
