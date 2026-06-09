"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import {
  bookingDisplayId,
  displayValue,
  formatDate,
  newspapersSummary,
  normalizeStatus,
  statusLabel,
} from "@/features/bookings/lib/booking-formatters";
import { getBookings } from "@/features/bookings/repositories/bookingsRepository";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookingFilterTabs } from "@/types/booking";

function paymentBadgeClass(paymentStatus?: string) {
  const normalized = normalizeStatus(paymentStatus);

  if (normalized === "PAID") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (normalized === "PENDING" || normalized === "PAYMENT_PENDING") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (normalized === "FAILED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function BookingsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
  });

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (bookingsQuery.data ?? []).filter((booking) => {
      const bookingStatus = normalizeStatus(booking.status);
      const matchesStatus =
        statusFilter === "ALL" || bookingStatus === statusFilter;

      const searchableText = [
        bookingDisplayId(booking),
        booking.customerName,
        booking.noticeType,
        booking.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [bookingsQuery.data, search, statusFilter]);

  if (bookingsQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-sm text-muted-foreground">
        Loading bookings...
      </div>
    );
  }

  if (bookingsQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
        Unable to load bookings. Please check Firestore permissions or
        collection structure.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search booking ID, customer, notice type, city"
              value={search}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredBookings.length} of {bookingsQuery.data?.length ?? 0}{" "}
            bookings
          </p>
        </div>
        <Tabs
          className="mt-4"
          onValueChange={setStatusFilter}
          value={statusFilter}
        >
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
            {bookingFilterTabs.map((tab) => (
              <TabsTrigger
                className="h-8 flex-none px-3 text-xs"
                key={tab.value}
                value={tab.value}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">
            No bookings found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Notice Type</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Newspapers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs">
                    {bookingDisplayId(booking)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {displayValue(booking.customerName)}
                  </TableCell>
                  <TableCell>{displayValue(booking.noticeType)}</TableCell>
                  <TableCell>{displayValue(booking.city)}</TableCell>
                  <TableCell className="max-w-64 truncate">
                    {newspapersSummary(booking.selectedNewspapers)}
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={paymentBadgeClass(booking.paymentStatus)}
                      variant="outline"
                    >
                      {statusLabel(booking.paymentStatus ?? "-")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(booking.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/bookings/${booking.id}`}>
                        <Eye className="size-4" />
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
