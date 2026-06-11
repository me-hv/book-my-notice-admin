"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import {
  bookingDisplayId,
  displayValue,
  formatDate,
  normalizeStatus,
  statusLabel,
} from "@/features/bookings/lib/booking-formatters";
import type { BookingDocument } from "@/types/booking";

function paymentClass(status?: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "PAID") {
    return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300";
  }

  if (normalized === "PENDING" || normalized === "PAYMENT_PENDING") {
    return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300";
  }

  if (normalized === "FAILED") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300";
}

export function RecentBookingsTable({
  bookings,
}: {
  bookings: BookingDocument[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b p-5">
        <h2 className="text-base font-semibold tracking-tight">
          Recent Bookings
        </h2>
        <p className="text-sm text-muted-foreground">
          Latest customer submissions from Firestore.
        </p>
      </div>
      {bookings.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          No recent bookings found.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Notice Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const paymentStatus =
                booking.paymentStatus ?? booking.payment?.status;

              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs">
                    {bookingDisplayId(booking)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {displayValue(booking.customerName)}
                  </TableCell>
                  <TableCell>{displayValue(booking.noticeType)}</TableCell>
                  <TableCell>{displayValue(booking.city)}</TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={paymentClass(paymentStatus)}
                      variant="outline"
                    >
                      {paymentStatus ? statusLabel(paymentStatus) : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(booking.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/bookings/${booking.id}`}>
                        <Eye className="size-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
