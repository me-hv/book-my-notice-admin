"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sidebarRoutes } from "@/shared/constants/navigation";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label="Open navigation"
          className="lg:hidden"
          size="icon"
          variant="outline"
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 p-0" side="left">
        <SheetHeader className="border-b p-6 text-left">
          <SheetTitle>Book My Notice</SheetTitle>
          <p className="text-sm text-muted-foreground">Admin Console</p>
        </SheetHeader>
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
      </SheetContent>
    </Sheet>
  );
}
