"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  BookOpenCheck,
  CircleDollarSign,
  FileCheck2,
  Newspaper,
} from "lucide-react";

import { formatCurrency, normalizeStatus } from "@/features/bookings/lib/booking-formatters";
import { getBookings } from "@/features/bookings/repositories/bookingsRepository";
import { StatCard } from "@/shared/components/stat-card";
import type { BookingDocument } from "@/types/booking";

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function isSameMonth(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth()
  );
}

function bookingRevenue(booking: BookingDocument) {
  return booking.pricing?.total ?? booking.pricing?.finalPrice ?? booking.finalPrice ?? 0;
}

export function OverviewCards() {
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
  });

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

  const bookings = bookingsQuery.data ?? [];
  const today = new Date();
  const totalBookings = bookings.length;
  const pendingVerification = bookings.filter((booking) => {
    const status = normalizeStatus(booking.status);
    return status === "UNDER_REVIEW" || status === "SUBMITTED";
  }).length;
  const paymentPending = bookings.filter((booking) => {
    return (
      normalizeStatus(booking.paymentStatus) === "PENDING" ||
      normalizeStatus(booking.status) === "PAYMENT_PENDING"
    );
  }).length;
  const publishedToday = bookings.filter((booking) => {
    const status = normalizeStatus(booking.status);
    const date = booking.updatedAt ?? booking.createdAt;
    return status === "PUBLISHED" && Boolean(date && isSameDay(date, today));
  }).length;
  const monthlyRevenue = bookings
    .filter((booking) => {
      const date = booking.updatedAt ?? booking.createdAt;
      return Boolean(date && isSameMonth(date, today));
    })
    .reduce((total, booking) => total + bookingRevenue(booking), 0);

  const overviewCards = [
    {
      title: "Total Bookings",
      value: String(totalBookings),
      description: "All bookings in Firestore",
      icon: BookOpenCheck,
    },
    {
      title: "Pending Verification",
      value: String(pendingVerification),
      description: "Submitted or under review",
      icon: FileCheck2,
    },
    {
      title: "Payment Pending",
      value: String(paymentPending),
      description: "Pending payment action",
      icon: CircleDollarSign,
    },
    {
      title: "Published Today",
      value: String(publishedToday),
      description: "Published bookings updated today",
      icon: Newspaper,
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      description: "Current month total",
      icon: Banknote,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {overviewCards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
