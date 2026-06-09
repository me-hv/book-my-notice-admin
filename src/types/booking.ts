import type { Timestamp } from "firebase/firestore";

export type BookingStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "DOCUMENTS_REJECTED"
  | "PRICE_CONFIRMED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "SENT_TO_NEWSPAPER"
  | "PUBLISHED"
  | "REJECTED"
  | "CANCELLED"
  | string;

export type PricingStatus = "PENDING_VERIFICATION" | "CONFIRMED" | string;

export type PaymentStatus =
  | "NOT_REQUIRED_YET"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | string;

export type PublicationStatus =
  | "NOT_SENT"
  | "SENT_TO_NEWSPAPER"
  | "PUBLISHED"
  | string;

export type FirestoreDateValue =
  | Timestamp
  | Date
  | string
  | number
  | null
  | undefined;

export type SelectedNewspaper =
  | string
  | {
      id?: string;
      newspaperId?: string;
      name?: string;
      newspaperName?: string;
      language?: string;
      edition?: string;
      editionName?: string;
      city?: string;
      state?: string;
      [key: string]: unknown;
    };

export type BookingDocumentLink = {
  type?: string;
  name: string;
  url?: string;
  uploadedAt?: Date | null;
  verified?: boolean;
  rejectionReason?: string | null;
};

export type BookingPricing = {
  status?: PricingStatus;
  basePrice?: number;
  extraWordCharges?: number;
  urgencyCharge?: number;
  agencyCommission?: number;
  gst?: number;
  discount?: number;
  total?: number;
  finalPrice?: number;
  confirmedAt?: Date | null;
  confirmedBy?: string | null;
  currency?: string;
  [key: string]: unknown;
};

export type BookingPayment = {
  status?: PaymentStatus;
  amount?: number;
  gateway?: string | null;
  transactionId?: string | null;
  paidAt?: Date | null;
  receiptUrl?: string | null;
};

export type BookingPublication = {
  status?: PublicationStatus;
  sentAt?: Date | null;
  publishedAt?: Date | null;
  proofUrl?: string | null;
  publicationDate?: Date | null;
  newspaperReferenceId?: string | null;
};

export type AdminNote = {
  id?: string;
  note: string;
  createdAt?: Date | string | null;
  createdBy?: string;
};

export type TimelineEntry = {
  id: string;
  status?: string;
  message?: string;
  visibleToUser?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date | null;
};

export type BookingDocument = {
  id: string;
  bookingId?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  noticeType?: string;
  noticeMatter?: string;
  language?: string;
  city?: string;
  state?: string;
  publicationCity?: string;
  selectedNewspapers?: SelectedNewspaper[];
  documents?: BookingDocumentLink[];
  pricing?: BookingPricing | null;
  payment?: BookingPayment | null;
  publication?: BookingPublication | null;
  status?: BookingStatus;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  adminNotes?: string | AdminNote[] | null;
  documentUrls?: string[];
  paymentStatus?: PaymentStatus;
  pricingStatus?: PricingStatus;
  finalPrice?: number;
  raw?: Record<string, unknown>;
};

export type BookingStatusOption = {
  label: string;
  value: BookingStatus;
};

export const bookingStatusOptions: BookingStatusOption[] = [
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Documents Rejected", value: "DOCUMENTS_REJECTED" },
  { label: "Price Confirmed", value: "PRICE_CONFIRMED" },
  { label: "Payment Pending", value: "PAYMENT_PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Sent To Newspaper", value: "SENT_TO_NEWSPAPER" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const bookingFilterTabs: BookingStatusOption[] = [
  { label: "All", value: "ALL" },
  ...bookingStatusOptions,
];
