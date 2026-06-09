"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";

import { getFirebaseClient } from "@/shared/lib/firebase/client";
import type {
  AdminStaffMember,
  AuditEventType,
  AuditLogEntry,
  BookingSettings,
  BusinessSettings,
  LegalSettings,
  NotificationSettings,
  PermissionKey,
  RolePermissionsSettings,
  SettingsBundle,
} from "@/types/settings";

export const permissionLabels: Record<PermissionKey, string> = {
  "bookings.read": "View bookings",
  "bookings.updateStatus": "Update booking status",
  "bookings.updatePricing": "Update booking pricing",
  "customers.read": "View customers",
  "newspapers.manage": "Manage newspapers",
  "pricing.manage": "Manage pricing",
  "settings.manage": "Manage settings",
  "staff.manage": "Manage staff",
  "audit.read": "View audit logs",
};

export const defaultRolePermissions: RolePermissionsSettings = {
  SUPER_ADMIN: Object.keys(permissionLabels) as PermissionKey[],
  MANAGER: [
    "bookings.read",
    "bookings.updateStatus",
    "bookings.updatePricing",
    "customers.read",
    "newspapers.manage",
    "pricing.manage",
    "audit.read",
  ],
  OPERATOR: [
    "bookings.read",
    "bookings.updateStatus",
    "customers.read",
    "newspapers.manage",
  ],
  SUPPORT: ["bookings.read", "customers.read"],
};

export const defaultNotificationSettings: NotificationSettings = {
  email: true,
  sms: false,
  push: true,
};

export const defaultBusinessSettings: BusinessSettings = {
  companyName: "Book My Notice",
  supportEmail: "",
  supportPhone: "",
};

export const defaultBookingSettings: BookingSettings = {
  autoApproval: false,
  defaultReviewTimeHours: 24,
  draftExpiryDays: 30,
};

export const defaultLegalSettings: LegalSettings = {
  privacyPolicy: "",
  terms: "",
};

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

function readString(data: DocumentData, key: string) {
  const value = data[key];

  return typeof value === "string" ? value : undefined;
}

function readBoolean(data: DocumentData, key: string) {
  const value = data[key];

  return typeof value === "boolean" ? value : undefined;
}

function readNumber(data: DocumentData, key: string) {
  const value = data[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function readPermissions(value: unknown): PermissionKey[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is PermissionKey => typeof item === "string");
}

function defaultAppSettings() {
  return {
    companyName: defaultBusinessSettings.companyName,
    supportEmail: defaultBusinessSettings.supportEmail,
    supportPhone: defaultBusinessSettings.supportPhone,
    autoApproval: defaultBookingSettings.autoApproval,
    draftExpiryDays: defaultBookingSettings.draftExpiryDays,
  };
}

async function ensureDefaultAppSettings() {
  const { db } = getFirebaseClient();

  try {
    await setDoc(
      doc(db, "settings", "app"),
      {
        ...defaultAppSettings(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.log("Firestore read error", error);
  }
}

async function getAppSettings(): Promise<DocumentData> {
  const { db } = getFirebaseClient();

  try {
    const snapshot = await getDoc(doc(db, "settings", "app"));

    if (snapshot.exists()) {
      console.log("Settings document found");
      return snapshot.data();
    }

    console.log("Settings document missing");
    await ensureDefaultAppSettings();

    return defaultAppSettings();
  } catch (error) {
    console.log("Firestore read error", error);

    return defaultAppSettings();
  }
}

function staffFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): AdminStaffMember | null {
  const data = snapshot.data();

  if (!data) {
    return null;
  }

  const email = readString(data, "email");

  if (!email) {
    return null;
  }

  return {
    uid: readString(data, "uid") ?? snapshot.id,
    email,
    displayName: readString(data, "displayName"),
    role: readString(data, "role") ?? "SUPPORT",
    active: readBoolean(data, "active") ?? true,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    updatedBy: readString(data, "updatedBy"),
  };
}

function auditLogFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): AuditLogEntry {
  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    eventType: readString(data, "eventType") ?? "SETTINGS_CHANGE",
    actorEmail: readString(data, "actorEmail"),
    targetType: readString(data, "targetType"),
    targetId: readString(data, "targetId"),
    message: readString(data, "message"),
    metadata:
      typeof data.metadata === "object" &&
      data.metadata !== null &&
      !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>)
        : undefined,
    createdAt: toDate(data.createdAt),
  };
}

async function getSettingsDoc<T>(
  id: string,
  defaults: T,
  parser: (data: DocumentData) => T,
) {
  const { db } = getFirebaseClient();

  try {
    const snapshot = await getDoc(doc(db, "settings", id));

    if (!snapshot.exists()) {
      return defaults;
    }

    return parser(snapshot.data());
  } catch (error) {
    console.log("Firestore read error", error);

    return defaults;
  }
}

export async function getStaffMembers(): Promise<AdminStaffMember[]> {
  const { db } = getFirebaseClient();

  try {
    const snapshot = await getDocs(collection(db, "adminUsers"));

    return snapshot.docs
      .map(staffFromSnapshot)
      .filter((staff): staff is AdminStaffMember => Boolean(staff))
      .sort((first, second) => first.email.localeCompare(second.email));
  } catch (error) {
    console.log("Firestore read error", error);

    return [];
  }
}

export async function getNotificationSettings() {
  return getSettingsDoc(
    "notifications",
    defaultNotificationSettings,
    (data): NotificationSettings => ({
      email: readBoolean(data, "email") ?? defaultNotificationSettings.email,
      sms: readBoolean(data, "sms") ?? defaultNotificationSettings.sms,
      push: readBoolean(data, "push") ?? defaultNotificationSettings.push,
    }),
  );
}

export async function getBusinessSettings() {
  const appSettings = await getAppSettings();

  return {
    companyName:
      readString(appSettings, "companyName") ??
      defaultBusinessSettings.companyName,
    supportEmail:
      readString(appSettings, "supportEmail") ??
      defaultBusinessSettings.supportEmail,
    supportPhone:
      readString(appSettings, "supportPhone") ??
      readString(appSettings, "supportNumber") ??
      defaultBusinessSettings.supportPhone,
  };
}

export async function getBookingSettings() {
  const appSettings = await getAppSettings();

  return {
    autoApproval:
      readBoolean(appSettings, "autoApproval") ??
      defaultBookingSettings.autoApproval,
    defaultReviewTimeHours:
      readNumber(appSettings, "defaultReviewTimeHours") ??
      defaultBookingSettings.defaultReviewTimeHours,
    draftExpiryDays:
      readNumber(appSettings, "draftExpiryDays") ??
      readNumber(appSettings, "draftExpiryHours") ??
      defaultBookingSettings.draftExpiryDays,
  };
}

export async function getLegalSettings() {
  return getSettingsDoc(
    "legal",
    defaultLegalSettings,
    (data): LegalSettings => ({
      privacyPolicy:
        readString(data, "privacyPolicy") ?? defaultLegalSettings.privacyPolicy,
      terms: readString(data, "terms") ?? defaultLegalSettings.terms,
    }),
  );
}

export async function getRolePermissions() {
  return getSettingsDoc(
    "roles",
    defaultRolePermissions,
    (data): RolePermissionsSettings => ({
      SUPER_ADMIN:
        readPermissions(data.SUPER_ADMIN) ?? defaultRolePermissions.SUPER_ADMIN,
      MANAGER: readPermissions(data.MANAGER) ?? defaultRolePermissions.MANAGER,
      OPERATOR:
        readPermissions(data.OPERATOR) ?? defaultRolePermissions.OPERATOR,
      SUPPORT: readPermissions(data.SUPPORT) ?? defaultRolePermissions.SUPPORT,
    }),
  );
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const { db } = getFirebaseClient();

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "settings", "audit", "logs"),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );

    return snapshot.docs.map(auditLogFromSnapshot);
  } catch (error) {
    console.log("Firestore read error", error);

    try {
      const snapshot = await getDocs(
        collection(db, "settings", "audit", "logs"),
      );

      return snapshot.docs
        .map(auditLogFromSnapshot)
        .sort(
          (first, second) =>
            (second.createdAt?.getTime() ?? 0) -
            (first.createdAt?.getTime() ?? 0),
        )
        .slice(0, 100);
    } catch (fallbackError) {
      console.log("Firestore read error", fallbackError);

      return [];
    }
  }
}

export async function getSettingsBundle(): Promise<SettingsBundle> {
  const [staff, notifications, business, booking, legal, roles, auditLogs] =
    await Promise.allSettled([
      getStaffMembers(),
      getNotificationSettings(),
      getBusinessSettings(),
      getBookingSettings(),
      getLegalSettings(),
      getRolePermissions(),
      getAuditLogs(),
    ]);

  return {
    staff: staff.status === "fulfilled" ? staff.value : [],
    notifications:
      notifications.status === "fulfilled"
        ? notifications.value
        : defaultNotificationSettings,
    business:
      business.status === "fulfilled" ? business.value : defaultBusinessSettings,
    booking:
      booking.status === "fulfilled" ? booking.value : defaultBookingSettings,
    legal: legal.status === "fulfilled" ? legal.value : defaultLegalSettings,
    roles: roles.status === "fulfilled" ? roles.value : defaultRolePermissions,
    auditLogs: auditLogs.status === "fulfilled" ? auditLogs.value : [],
  };
}

export async function writeAuditLog({
  actorEmail,
  eventType,
  message,
  metadata,
  targetId,
  targetType,
}: {
  actorEmail?: string;
  eventType: AuditEventType;
  message: string;
  metadata?: Record<string, unknown>;
  targetId?: string;
  targetType?: string;
}) {
  const { db } = getFirebaseClient();

  try {
    await addDoc(collection(db, "settings", "audit", "logs"), {
      eventType,
      actorEmail: actorEmail ?? "system",
      targetType: targetType ?? "",
      targetId: targetId ?? "",
      message,
      metadata: metadata ?? {},
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.log("Firestore read error", error);
  }
}

export async function addStaffMember(
  staff: Omit<AdminStaffMember, "createdAt" | "updatedAt">,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await setDoc(doc(db, "adminUsers", staff.uid), {
    uid: staff.uid,
    email: staff.email.trim(),
    displayName: staff.displayName?.trim() ?? "",
    role: staff.role,
    active: staff.active,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: actorEmail,
  });

  await writeAuditLog({
    actorEmail,
    eventType: "STAFF_CHANGE",
    targetType: "adminUsers",
    targetId: staff.uid,
    message: `Added admin ${staff.email}`,
    metadata: { role: staff.role },
  });
}

export async function updateStaffMember(
  uid: string,
  updates: Pick<AdminStaffMember, "role" | "active" | "displayName">,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await updateDoc(doc(db, "adminUsers", uid), {
    role: updates.role,
    active: updates.active,
    displayName: updates.displayName ?? "",
    updatedAt: serverTimestamp(),
    updatedBy: actorEmail,
  });

  await writeAuditLog({
    actorEmail,
    eventType: "STAFF_CHANGE",
    targetType: "adminUsers",
    targetId: uid,
    message: `Updated admin ${uid}`,
    metadata: updates,
  });
}

export async function saveNotificationSettings(
  settings: NotificationSettings,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await setDoc(
    doc(db, "settings", "notifications"),
    {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: actorEmail,
    },
    { merge: true },
  );

  await writeAuditLog({
    actorEmail,
    eventType: "SETTINGS_CHANGE",
    targetType: "settings",
    targetId: "notifications",
    message: "Updated notification settings",
    metadata: settings,
  });
}

export async function saveBusinessSettings(
  settings: BusinessSettings,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await setDoc(
    doc(db, "settings", "app"),
    {
      companyName: settings.companyName,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      updatedAt: serverTimestamp(),
      updatedBy: actorEmail,
    },
    { merge: true },
  );

  await writeAuditLog({
    actorEmail,
    eventType: "SETTINGS_CHANGE",
    targetType: "settings",
    targetId: "app",
    message: "Updated business settings",
  });
}

export async function saveBookingSettings(
  settings: BookingSettings,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await setDoc(
    doc(db, "settings", "app"),
    {
      autoApproval: settings.autoApproval,
      defaultReviewTimeHours: settings.defaultReviewTimeHours,
      draftExpiryDays: settings.draftExpiryDays,
      updatedAt: serverTimestamp(),
      updatedBy: actorEmail,
    },
    { merge: true },
  );

  await writeAuditLog({
    actorEmail,
    eventType: "SETTINGS_CHANGE",
    targetType: "settings",
    targetId: "app",
    message: "Updated booking settings",
    metadata: settings,
  });
}

export async function saveLegalSettings(
  settings: LegalSettings,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await setDoc(
    doc(db, "settings", "legal"),
    {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: actorEmail,
    },
    { merge: true },
  );

  await writeAuditLog({
    actorEmail,
    eventType: "SETTINGS_CHANGE",
    targetType: "settings",
    targetId: "legal",
    message: "Updated legal documents",
  });
}

export async function saveRolePermissions(
  settings: RolePermissionsSettings,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await setDoc(
    doc(db, "settings", "roles"),
    {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: actorEmail,
    },
    { merge: true },
  );

  await writeAuditLog({
    actorEmail,
    eventType: "SETTINGS_CHANGE",
    targetType: "settings",
    targetId: "roles",
    message: "Updated role permissions",
  });
}
