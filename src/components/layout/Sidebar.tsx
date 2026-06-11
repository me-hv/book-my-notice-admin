"use client";

import {
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { sidebarRoutes } from "@/shared/constants/navigation";

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        collapsed && "justify-center",
      )}
      href="/dashboard"
    >
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background">
        <Image
          alt="Book My Notice"
          className="size-full object-cover"
          height={40}
          src="/brand/bmn-logo.png"
          width={40}
        />
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-sidebar-foreground">
            Book My Notice
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            Admin Console
          </span>
        </span>
      ) : null}
    </Link>
  );
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  collapsed,
  href,
  icon: Icon,
  onClick,
  title,
}: {
  collapsed?: boolean;
  href: string;
  icon: LucideIcon;
  onClick?: () => void;
  title: string;
}) {
  const pathname = usePathname();
  const active = isActiveRoute(pathname, href);
  const link = (
    <Link
      className={cn(
        "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        active &&
          "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary dark:bg-primary/15",
        collapsed && "justify-center px-0",
      )}
      href={href}
      onClick={onClick}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-inherit",
        )}
      />
      {!collapsed ? <span className="truncate">{title}</span> : null}
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

function Navigation({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 p-3">
      {sidebarRoutes.map((item) => (
        <NavItem
          collapsed={collapsed}
          href={item.href}
          icon={item.icon}
          key={item.href}
          onClick={onNavigate}
          title={item.title}
        />
      ))}
    </nav>
  );
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onMobileOpenChange,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex"
        style={{ width: collapsed ? 72 : 260 }}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center px-3" : "justify-between",
          )}
        >
          <BrandMark collapsed={collapsed} />
          {!collapsed ? (
            <Button
              aria-label="Collapse sidebar"
              onClick={onToggleCollapsed}
              size="icon-sm"
              variant="ghost"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>
        {collapsed ? (
          <div className="flex justify-center border-b border-sidebar-border p-3">
            <Button
              aria-label="Expand sidebar"
              onClick={onToggleCollapsed}
              size="icon-sm"
              variant="ghost"
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          </div>
        ) : null}
        <Navigation collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent className="w-80 p-0" side="left">
          <SheetHeader className="border-b p-4 text-left">
            <SheetTitle asChild>
              <BrandMark />
            </SheetTitle>
          </SheetHeader>
          <Navigation onNavigate={() => onMobileOpenChange(false)} />
          <div className="mt-auto border-t p-4 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Book My Notice</span>
              <SheetClose asChild>
                <Button aria-label="Close navigation" size="icon-sm" variant="ghost">
                  <ChevronLeft className="size-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
