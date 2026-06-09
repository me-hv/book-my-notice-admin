import type { BookingDocument, BookingStatus, SelectedNewspaper } from "@/types/booking";

export function normalizeStatus(status?: string | null): BookingStatus {
  if (!status) {
    return "DRAFT";
  }

  return status.trim().replaceAll(" ", "_").replaceAll("-", "_").toUpperCase();
}

export function statusLabel(status?: string | null) {
  return normalizeStatus(status)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value?: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatDateTime(value?: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function newspaperName(newspaper: SelectedNewspaper) {
  if (typeof newspaper === "string") {
    return newspaper;
  }

  return (
    newspaper.name ??
    newspaper.newspaperName ??
    newspaper.editionName ??
    newspaper.edition ??
    newspaper.id ??
    newspaper.newspaperId ??
    "-"
  );
}

export function newspapersSummary(
  selectedNewspapers?: BookingDocument["selectedNewspapers"],
) {
  if (!selectedNewspapers?.length) {
    return "-";
  }

  return selectedNewspapers.map(newspaperName).join(", ");
}

export function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value);
}

export function bookingDisplayId(booking: BookingDocument) {
  return booking.bookingId || booking.id;
}
