"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Newspaper,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/features/bookings/lib/booking-formatters";
import { getBookings } from "@/features/bookings/repositories/bookingsRepository";
import { MetricCard } from "@/features/dashboard/components/MetricCard";
import { NeedsAttentionPanel } from "@/features/dashboard/components/NeedsAttentionPanel";
import { OperationsPipeline } from "@/features/dashboard/components/OperationsPipeline";
import { PublicationQueue } from "@/features/dashboard/components/PublicationQueue";
import { RecentBookingsTable } from "@/features/dashboard/components/RecentBookingsTable";
import { RevenueSnapshot } from "@/features/dashboard/components/RevenueSnapshot";
import { buildDashboardMetrics } from "@/features/dashboard/lib/dashboard-metrics";

function formatSyncTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function EmptyDashboard() {
  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <BookOpenCheck className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">
          No bookings yet.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Once users submit notices from the Android app, they will appear here.
        </p>
      </div>
    </div>
  );
}

export function OverviewCards() {
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
  });

  if (bookingsQuery.isLoading) {
    return (
      <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground shadow-sm">
        Loading bookings...
      </div>
    );
  }

  if (bookingsQuery.isError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
        Unable to load bookings. Please check Firestore permissions or
        collection structure.
      </div>
    );
  }

  const bookings = bookingsQuery.data ?? [];
  const metrics = buildDashboardMetrics(bookings);

  if (bookings.length === 0) {
    return <EmptyDashboard />;
  }

  const metricCards = [
    {
      title: "Total Bookings",
      value: String(metrics.totalBookings),
      subtitle: "All bookings tracked in Firestore",
      health: `${metrics.recentBookings.length} recent`,
      icon: BookOpenCheck,
    },
    {
      title: "Pending Verification",
      value: String(metrics.pendingVerification),
      subtitle: "Submitted or under review",
      health:
        metrics.pendingVerification > 0
          ? "Action needed"
          : "Queue clear",
      icon: FileCheck2,
    },
    {
      title: "Payment Pending",
      value: String(metrics.paymentPending),
      subtitle: "Customers waiting to complete payment",
      health:
        metrics.paymentPending > 0
          ? `${formatCurrency(metrics.pendingAmount)} open`
          : "No dues",
      icon: CircleDollarSign,
    },
    {
      title: "Published Today",
      value: String(metrics.publishedToday),
      subtitle: "Published bookings updated today",
      health:
        metrics.publishedToday > 0 ? "Proofs moving" : "None today",
      icon: Newspaper,
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(metrics.monthlyRevenue),
      subtitle: "Current month booking value",
      health: `${metrics.paidBookingsCount} paid`,
      icon: Banknote,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-md bg-primary/10 text-primary" variant="secondary">
                Today&apos;s operational status
              </Badge>
              <span className="text-xs text-muted-foreground">
                Last synced {formatSyncTime(metrics.lastSyncedAt)}
              </span>
            </div>
            <p className="mt-3 text-xl font-semibold tracking-tight">
              {metrics.totalBookings} bookings tracked -{" "}
              {metrics.pendingVerification} need verification -{" "}
              {metrics.paymentPending} payment pending
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Most urgent action: {metrics.urgentActionLabel}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="size-4 text-primary" />
                Pending work
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {metrics.totalPendingWork}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="size-4 text-amber-600" />
                Urgent queue
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {metrics.attentionBookings.length}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Ready to publish
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {metrics.publicationQueueCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <OperationsPipeline stages={metrics.pipeline} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <NeedsAttentionPanel bookings={metrics.attentionBookings} />
        <RevenueSnapshot
          averageBookingValue={metrics.averageBookingValue}
          paidBookingsCount={metrics.paidBookingsCount}
          pendingAmount={metrics.pendingAmount}
          thisMonthRevenue={metrics.thisMonthRevenue}
        />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
        <RecentBookingsTable bookings={metrics.recentBookings} />
        <PublicationQueue bookings={metrics.publicationQueue} />
      </section>

      <div className="flex justify-end">
        <Button
          disabled={bookingsQuery.isFetching}
          onClick={() => bookingsQuery.refetch()}
          size="sm"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Refresh dashboard
        </Button>
      </div>
    </div>
  );
}
