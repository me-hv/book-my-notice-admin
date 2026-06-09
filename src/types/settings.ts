import type { Timestamp } from "firebase/firestore";

export const adminRoles = [
  "SUPER_ADMIN",
  "MANAGER",
  "OPERATOR",
  "SUPPORT",
] as const;

export type AdminStaffRole = (typeof adminRoles)[number];

export type PermissionKey =
  | "bookings.read"
  | "bookings.updateStatus"
  | "bookings.updatePricing"
  | "customers.read"
  | "newspapers.manage"
  | "pricing.manage"
  | "settings.manage"
  | "staff.manage"
  | "audit.read";

export type AdminStaffMember = {
  uid: string;
  email: string;
  displayName?: string;
  role: AdminStaffRole | string;
  active: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  updatedBy?: string;
};

export type RolePermissionsSettings = Record<string, PermissionKey[]>;

export type NotificationSettings = {
  email: boolean;
  sms: boolean;
  push: boolean;
};

export type BusinessSettings = {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
};

export type BookingSettings = {
  autoApproval: boolean;
  defaultReviewTimeHours: number;
  draftExpiryDays: number;
};

export type LegalSettings = {
  privacyPolicy: string;
  terms: string;
};

export type AuditEventType =
  | "LOGIN"
  | "LOGOUT"
  | "STATUS_CHANGE"
  | "PRICING_CHANGE"
  | "SETTINGS_CHANGE"
  | "STAFF_CHANGE"
  | string;

export type AuditLogEntry = {
  id: string;
  eventType: AuditEventType;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date | null;
};

export type SettingsBundle = {
  staff: AdminStaffMember[];
  notifications: NotificationSettings;
  business: BusinessSettings;
  booking: BookingSettings;
  legal: LegalSettings;
  roles: RolePermissionsSettings;
  auditLogs: AuditLogEntry[];
};

export type FirestoreDateValue =
  | Timestamp
  | Date
  | string
  | number
  | null
  | undefined;
