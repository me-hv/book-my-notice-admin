"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  className,
  health,
  icon: Icon,
  subtitle,
  title,
  value,
}: {
  className?: string;
  health: string;
  icon: LucideIcon;
  subtitle: string;
  title: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:border-border/80",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {health}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
