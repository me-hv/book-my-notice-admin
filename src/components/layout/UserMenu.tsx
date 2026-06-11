"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/features/auth/components/logout-button";
import type { AdminSession } from "@/shared/lib/auth/session";

function initialsFromEmail(email: string) {
  const [name] = email.split("@");
  const parts = name.split(/[._-]/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export function UserMenu({ admin }: { admin: AdminSession }) {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden min-w-0 text-right md:block">
        <p className="max-w-48 truncate text-sm font-medium leading-5">
          {admin.email}
        </p>
        <div className="mt-0.5 flex justify-end">
          <Badge className="rounded-md" variant="outline">
            {admin.role.replaceAll("_", " ")}
          </Badge>
        </div>
      </div>
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initialsFromEmail(admin.email)}
        </AvatarFallback>
      </Avatar>
      <LogoutButton />
    </div>
  );
}
