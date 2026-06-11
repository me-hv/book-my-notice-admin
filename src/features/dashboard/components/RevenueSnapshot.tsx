"use client";

import { Banknote, CircleDollarSign, Hourglass, ReceiptText } from "lucide-react";

import { formatCurrency } from "@/features/bookings/lib/booking-formatters";

function RevenueLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/10 p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export function RevenueSnapshot({
  averageBookingValue,
  paidBookingsCount,
  pendingAmount,
  thisMonthRevenue,
}: {
  averageBookingValue: number;
  paidBookingsCount: number;
  pendingAmount: number;
  thisMonthRevenue: number;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Revenue Snapshot
        </h2>
        <p className="text-sm text-muted-foreground">
          Payment health based on available booking values.
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <RevenueLine
          icon={Banknote}
          label="This Month Revenue"
          value={formatCurrency(thisMonthRevenue)}
        />
        <RevenueLine
          icon={ReceiptText}
          label="Paid Bookings Count"
          value={String(paidBookingsCount)}
        />
        <RevenueLine
          icon={CircleDollarSign}
          label="Average Booking Value"
          value={formatCurrency(averageBookingValue)}
        />
        <RevenueLine
          icon={Hourglass}
          label="Pending Amount"
          value={formatCurrency(pendingAmount)}
        />
      </div>
    </section>
  );
}
