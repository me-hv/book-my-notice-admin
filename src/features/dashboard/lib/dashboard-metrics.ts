import {
  bookingDisplayId,
  normalizeStatus,
  newspapersSummary,
} from "@/features/bookings/lib/booking-formatters";
import type { BookingDocument } from "@/types/booking";

export type DashboardMetrics = ReturnType<typeof buildDashboardMetrics>;

export type PipelineStage = {
  label: string;
  status: string;
  count: number;
  percentage: number;
};

function dateValue(booking: BookingDocument) {
  return booking.createdAt ?? booking.updatedAt ?? null;
}

function sortByRecent(first: BookingDocument, second: BookingDocument) {
  const firstTime = dateValue(first)?.getTime() ?? 0;
  const secondTime = dateValue(second)?.getTime() ?? 0;

  return secondTime - firstTime;
}

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

export function safeNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function bookingRevenue(booking: BookingDocument) {
  return safeNumber(
    booking.payment?.amount ??
      booking.pricing?.total ??
      booking.pricing?.finalPrice ??
      booking.finalPrice,
  );
}

export function bookingPricingStatus(booking: BookingDocument) {
  return normalizeStatus(booking.pricingStatus ?? booking.pricing?.status);
}

export function bookingPaymentStatus(booking: BookingDocument) {
  return normalizeStatus(booking.paymentStatus ?? booking.payment?.status);
}

export function isPaymentPending(booking: BookingDocument) {
  const status = normalizeStatus(booking.status);
  const paymentStatus = bookingPaymentStatus(booking);

  return status === "PAYMENT_PENDING" || paymentStatus === "PENDING";
}

export function isPaidBooking(booking: BookingDocument) {
  const status = normalizeStatus(booking.status);
  const paymentStatus = bookingPaymentStatus(booking);

  return (
    paymentStatus === "PAID" ||
    status === "PAID" ||
    status === "SENT_TO_NEWSPAPER" ||
    status === "PUBLISHED"
  );
}

export function bookingNewspapers(booking: BookingDocument) {
  return newspapersSummary(booking.selectedNewspapers);
}

export function buildDashboardMetrics(bookings: BookingDocument[]) {
  const today = new Date();
  const sortedBookings = [...bookings].sort(sortByRecent);
  const totalBookings = bookings.length;
  const pendingVerification = bookings.filter((booking) => {
    const status = normalizeStatus(booking.status);

    return status === "UNDER_REVIEW" || status === "SUBMITTED";
  }).length;
  const paymentPending = bookings.filter(isPaymentPending).length;
  const publishedToday = bookings.filter((booking) => {
    const status = normalizeStatus(booking.status);
    const date =
      booking.publication?.publishedAt ?? booking.updatedAt ?? booking.createdAt;

    return status === "PUBLISHED" && Boolean(date && isSameDay(date, today));
  }).length;
  const monthlyRevenue = bookings
    .filter((booking) => {
      const date =
        booking.payment?.paidAt ?? booking.updatedAt ?? booking.createdAt;

      return Boolean(date && isSameMonth(date, today));
    })
    .reduce((total, booking) => total + bookingRevenue(booking), 0);

  const paidBookings = bookings.filter(isPaidBooking);
  const paidBookingsThisMonth = paidBookings.filter((booking) => {
    const date =
      booking.payment?.paidAt ?? booking.updatedAt ?? booking.createdAt;

    return Boolean(date && isSameMonth(date, today));
  });
  const thisMonthRevenue = paidBookingsThisMonth.reduce(
    (total, booking) => total + bookingRevenue(booking),
    0,
  );
  const pendingAmount = bookings
    .filter(isPaymentPending)
    .reduce((total, booking) => total + bookingRevenue(booking), 0);
  const averageBookingValue =
    paidBookings.length > 0
      ? paidBookings.reduce((total, booking) => total + bookingRevenue(booking), 0) /
        paidBookings.length
      : 0;

  const allAttentionBookings = sortedBookings.filter((booking) => {
    const status = normalizeStatus(booking.status);

    return (
      status === "SUBMITTED" ||
      status === "UNDER_REVIEW" ||
      status === "DOCUMENTS_REJECTED" ||
      status === "PAYMENT_PENDING" ||
      bookingPricingStatus(booking) === "PENDING_VERIFICATION"
    );
  });
  const attentionBookings = allAttentionBookings.slice(0, 6);

  const allPublicationQueue = sortedBookings.filter((booking) => {
    const status = normalizeStatus(booking.status);

    return status === "PAID" || status === "SENT_TO_NEWSPAPER";
  });
  const publicationQueue = allPublicationQueue.slice(0, 6);

  const pipelineStatuses = [
    ["Submitted", "SUBMITTED"],
    ["Under Review", "UNDER_REVIEW"],
    ["Price Confirmed", "PRICE_CONFIRMED"],
    ["Payment Pending", "PAYMENT_PENDING"],
    ["Paid", "PAID"],
    ["Sent To Newspaper", "SENT_TO_NEWSPAPER"],
    ["Published", "PUBLISHED"],
  ] as const;

  const pipeline: PipelineStage[] = pipelineStatuses.map(([label, status]) => {
    const count = bookings.filter(
      (booking) => normalizeStatus(booking.status) === status,
    ).length;

    return {
      label,
      status,
      count,
      percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0,
    };
  });

  const mostUrgentAction =
    attentionBookings.find(
      (booking) => normalizeStatus(booking.status) === "DOCUMENTS_REJECTED",
    ) ??
    attentionBookings.find(
      (booking) => normalizeStatus(booking.status) === "SUBMITTED",
    ) ??
    attentionBookings[0] ??
    publicationQueue[0] ??
    null;

  return {
    attentionBookings,
    averageBookingValue,
    lastSyncedAt: today,
    monthlyRevenue,
    mostUrgentAction,
    paidBookingsCount: paidBookings.length,
    paymentPending,
    pendingAmount,
    pendingVerification,
    pipeline,
    publicationQueueCount: allPublicationQueue.length,
    publicationQueue,
    publishedToday,
    recentBookings: sortedBookings.slice(0, 8),
    thisMonthRevenue,
    totalBookings,
    totalPendingWork: allAttentionBookings.length,
    urgentActionLabel: mostUrgentAction
      ? `${bookingDisplayId(mostUrgentAction)} needs ${normalizeStatus(
          mostUrgentAction.status,
        )
          .toLowerCase()
          .replaceAll("_", " ")}`
      : "No urgent action",
  };
}
