"use client";

import { Badge } from "@/components/ui/badge";
import type { PipelineStage } from "@/features/dashboard/lib/dashboard-metrics";

export function OperationsPipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Operations Pipeline
          </h2>
          <p className="text-sm text-muted-foreground">
            Current booking movement from submission to publication.
          </p>
        </div>
        <Badge className="w-fit rounded-md" variant="secondary">
          Live Firestore
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {stages.map((stage) => (
          <div className="rounded-lg border bg-muted/20 p-3" key={stage.status}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground">
                {stage.label}
              </p>
              <span className="font-mono text-xs text-muted-foreground">
                {stage.percentage}%
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{stage.count}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${stage.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
