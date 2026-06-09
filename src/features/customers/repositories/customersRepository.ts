"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";

import { getBookings } from "@/features/bookings/repositories/bookingsRepository";
import { getFirebaseClient } from "@/shared/lib/firebase/client";
import type { BookingDocument, BookingDocumentLink } from "@/types/booking";
import type {
  CustomerDocument,
  CustomerStats,
  CustomerWithBookings,
} from "@/types/customer";

function isTimestamp(value: unknown): value is Timestamp {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  );
}

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (isTimestamp(value)) {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function readString(data: DocumentData, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function readBoolean(data: DocumentData, key: string) {
  const value = data[key];

  return typeof value === "boolean" ? value : undefined;
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizePhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function customerFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): CustomerDocument {
  const data = snapshot.data();

  if (!data) {
    return {
      id: snapshot.id,
      uid: snapshot.id,
      raw: {},
    };
  }

  return {
    id: snapshot.id,
    uid: readString(data, "uid", "userId") ?? snapshot.id,
    name: readString(data, "name", "displayName", "fullName", "customerName"),
    email: readString(data, "email", "customerEmail"),
    mobile: readString(data, "mobile", "phone", "phoneNumber", "customerPhone"),
    phone: readString(data, "phone", "phoneNumber", "mobile", "customerPhone"),
    photoUrl: readString(data, "photoUrl", "photoURL", "avatarUrl"),
    status: readString(data, "status"),
    active: readBoolean(data, "active"),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    lastLoginAt: toDate(data.lastLoginAt),
    raw: data,
  };
}

function sortCustomers(customers: CustomerDocument[]) {
  return [...customers].sort((first, second) => {
    const firstTime = first.updatedAt?.getTime() ?? first.createdAt?.getTime() ?? 0;
    const secondTime =
      second.updatedAt?.getTime() ?? second.createdAt?.getTime() ?? 0;

    if (secondTime !== firstTime) {
      return secondTime - firstTime;
    }

    return (first.name ?? first.email ?? "").localeCompare(
      second.name ?? second.email ?? "",
    );
  });
}

function bookingBelongsToCustomer(
  booking: BookingDocument,
  customer: CustomerDocument,
) {
  const userIdMatches =
    Boolean(customer.uid) && normalize(booking.userId) === normalize(customer.uid);
  const documentIdMatches =
    normalize(booking.userId) === normalize(customer.id) ||
    normalize(booking.raw?.uid as string | undefined) === normalize(customer.id);
  const emailMatches =
    Boolean(customer.email) &&
    normalize(booking.customerEmail) === normalize(customer.email);
  const phoneMatches =
    Boolean(customer.mobile || customer.phone) &&
    normalizePhone(booking.customerPhone) ===
      normalizePhone(customer.mobile ?? customer.phone);

  return userIdMatches || documentIdMatches || emailMatches || phoneMatches;
}

function bookingTime(booking: BookingDocument) {
  return booking.createdAt?.getTime() ?? booking.updatedAt?.getTime() ?? 0;
}

function sortBookings(bookings: BookingDocument[]) {
  return [...bookings].sort((first, second) => bookingTime(second) - bookingTime(first));
}

function extractDocuments(bookings: BookingDocument[]): BookingDocumentLink[] {
  return bookings.flatMap((booking) =>
    (booking.documents ?? []).map((document, index) => ({
      name:
        document.name ||
        `${booking.bookingId || booking.id} Document ${index + 1}`,
      type: document.type,
      url: document.url,
    })),
  );
}

function withBookings(
  customer: CustomerDocument,
  bookings: BookingDocument[],
): CustomerWithBookings {
  const customerBookings = sortBookings(
    bookings.filter((booking) => bookingBelongsToCustomer(booking, customer)),
  );
  const publishedNotices = customerBookings.filter(
    (booking) => booking.status?.toUpperCase() === "PUBLISHED",
  );

  return {
    ...customer,
    bookings: customerBookings,
    totalBookings: customerBookings.length,
    lastBooking: customerBookings[0] ?? null,
    documentsUploaded: extractDocuments(customerBookings),
    publishedNotices,
  };
}

export async function getCustomers(): Promise<CustomerWithBookings[]> {
  const { db } = getFirebaseClient();
  const usersCollection = collection(db, "users");
  const bookings = await getBookings();

  try {
    const snapshot = await getDocs(
      query(usersCollection, orderBy("updatedAt", "desc")),
    );

    return snapshot.docs
      .map(customerFromSnapshot)
      .map((customer) => withBookings(customer, bookings));
  } catch {
    const snapshot = await getDocs(usersCollection);

    return sortCustomers(snapshot.docs.map(customerFromSnapshot)).map(
      (customer) => withBookings(customer, bookings),
    );
  }
}

export async function getCustomerById(
  id: string,
): Promise<CustomerWithBookings | null> {
  const { db } = getFirebaseClient();
  const snapshot = await getDoc(doc(db, "users", id));

  if (!snapshot.exists()) {
    return null;
  }

  const bookings = await getBookings();

  return withBookings(customerFromSnapshot(snapshot), bookings);
}

export function getCustomerStats(
  customers: CustomerWithBookings[],
): CustomerStats {
  return {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(
      (customer) =>
        customer.active !== false &&
        normalize(customer.status) !== "disabled" &&
        normalize(customer.status) !== "inactive",
    ).length,
    repeatCustomers: customers.filter((customer) => customer.totalBookings > 1)
      .length,
  };
}
