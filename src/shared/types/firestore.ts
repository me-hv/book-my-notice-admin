export type AdminRole =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "OPERATOR"
  | "SUPPORT"
  | "ADMIN"
  | "OPERATIONS"
  | "VIEWER";

export type BookingStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_VERIFICATION"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "PUBLISHED"
  | "CANCELLED";

export type DocumentVerificationStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type NewspaperStatus = "ACTIVE" | "INACTIVE";

export type PricingRuleStatus = "ACTIVE" | "INACTIVE";

export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

export type FirestoreAuditFields = {
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  createdBy?: string;
  updatedBy?: string;
};

export type UserDocument = FirestoreAuditFields & {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  city?: string;
  active: boolean;
};

export type AdminUserDocument = FirestoreAuditFields & {
  uid: string;
  email: string;
  role: AdminRole;
  active: boolean;
  displayName?: string;
  lastLoginAt?: FirestoreTimestamp;
};

export type BookingDocument = FirestoreAuditFields & {
  id: string;
  bookingNumber: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  newspaperId: string;
  newspaperName: string;
  editionId?: string;
  editionName?: string;
  category: string;
  advertisementText: string;
  status: BookingStatus;
  documentVerificationStatus: DocumentVerificationStatus;
  scheduledPublishDate?: FirestoreTimestamp;
  assignedAdminId?: string;
  documentPaths: string[];
};

export type NewspaperEdition = {
  id: string;
  name: string;
  city: string;
  language: string;
  cutoffTime: string;
  active: boolean;
};

export type NewspaperDocument = FirestoreAuditFields & {
  id: string;
  name: string;
  slug: string;
  language: string;
  state: string;
  status: NewspaperStatus;
  editions: NewspaperEdition[];
};

export type PricingRuleDocument = FirestoreAuditFields & {
  id: string;
  newspaperId: string;
  editionId?: string;
  category: string;
  unit: "LINE" | "WORD" | "SQ_CM" | "PACKAGE";
  baseRate: number;
  minimumUnits: number;
  currency: "INR";
  taxPercent: number;
  status: PricingRuleStatus;
  effectiveFrom: FirestoreTimestamp;
  effectiveTo?: FirestoreTimestamp;
};

export type CollectionMap = {
  users: UserDocument;
  bookings: BookingDocument;
  adminUsers: AdminUserDocument;
  newspapers: NewspaperDocument;
  pricingRules: PricingRuleDocument;
};

export type CollectionName = keyof CollectionMap;
