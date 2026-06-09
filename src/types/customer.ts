import type { BookingDocument, BookingDocumentLink } from "@/types/booking";
import type { Timestamp } from "firebase/firestore";

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "DISABLED" | string;

export type CustomerDocument = {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  photoUrl?: string;
  status?: CustomerStatus;
  active?: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  lastLoginAt?: Date | null;
  raw?: Record<string, unknown>;
};

export type CustomerWithBookings = CustomerDocument & {
  bookings: BookingDocument[];
  totalBookings: number;
  lastBooking?: BookingDocument | null;
  documentsUploaded: BookingDocumentLink[];
  publishedNotices: BookingDocument[];
};

export type CustomerStats = {
  totalCustomers: number;
  activeCustomers: number;
  repeatCustomers: number;
};

export type FirestoreDateValue =
  | Timestamp
  | Date
  | string
  | number
  | null
  | undefined;
