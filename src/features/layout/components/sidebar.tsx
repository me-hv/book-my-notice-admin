"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { sidebarRoutes } from "@/shared/constants/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <Link className="flex items-center gap-3" href="/dashboard">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            BM
          </div>
          <div>
            <p className="text-sm font-semibold">Book My Notice</p>
            <p className="text-xs text-muted-foreground">Admin Console</p>
          </div>
        </Link>
      </div>
      <nav className="space-y-1 p-3">
        {sidebarRoutes.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-primary/10 text-primary",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="size-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
