"use client";

import { Send } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import {
  bookingDisplayId,
  displayValue,
  statusLabel,
} from "@/features/bookings/lib/booking-formatters";
import { bookingNewspapers } from "@/features/dashboard/lib/dashboard-metrics";
import type { BookingDocument } from "@/types/booking";

export function PublicationQueue({
  bookings,
}: {
  bookings: BookingDocument[];
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Publication Queue
          </h2>
          <p className="text-sm text-muted-foreground">
            Paid bookings ready for newspaper processing.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {bookings.length} ready
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {bookings.length === 0 ? (
          <p className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            No bookings are ready for publication yet.
          </p>
        ) : (
          bookings.map((booking) => (
            <div
              className="grid gap-3 rounded-lg border bg-muted/10 p-3 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(0,1fr)_auto]"
              key={booking.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs font-medium">
                    {bookingDisplayId(booking)}
                  </p>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <p className="mt-2 truncate text-sm font-medium">
                  {bookingNewspapers(booking)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {displayValue(booking.publicationCity ?? booking.city)} -{" "}
                  Publication{" "}
                  {booking.publication?.status
                    ? statusLabel(booking.publication.status)
                    : "-"}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/bookings/${booking.id}`}>
                  <Send className="size-4" />
                  Process
                </Link>
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
