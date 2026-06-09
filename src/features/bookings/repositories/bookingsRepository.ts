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
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";

import { writeAuditLog } from "@/features/settings/repositories/settingsRepository";
import { getFirebaseClient } from "@/shared/lib/firebase/client";
import type {
  AdminNote,
  BookingDocument,
  BookingDocumentLink,
  BookingPayment,
  BookingPricing,
  BookingPublication,
  BookingStatus,
  SelectedNewspaper,
  TimelineEntry,
} from "@/types/booking";

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

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function readStringArray(data: DocumentData, key: string) {
  const value = data[key];

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function documentLinkFromValue(
  value: unknown,
  index: number,
): BookingDocumentLink | null {
  if (typeof value === "string") {
    return {
      name: `Document ${index + 1}`,
      url: value,
      uploadedAt: null,
      verified: false,
      rejectionReason: null,
    };
  }

  const record = readRecord(value);

  if (!record) {
    return null;
  }

  const url =
    typeof record.url === "string"
      ? record.url
      : typeof record.documentUrl === "string"
        ? record.documentUrl
        : typeof record.downloadUrl === "string"
          ? record.downloadUrl
          : undefined;
  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.fileName === "string"
        ? record.fileName
        : typeof record.type === "string"
          ? record.type
          : `Document ${index + 1}`;

  return {
    type: typeof record.type === "string" ? record.type : undefined,
    name,
    url,
    uploadedAt: toDate(record.uploadedAt),
    verified: readBoolean(record.verified) ?? false,
    rejectionReason:
      typeof record.rejectionReason === "string"
        ? record.rejectionReason
        : null,
  };
}

function readDocumentLinks(data: DocumentData): BookingDocumentLink[] {
  const value = data.documents ?? data.documentUrls ?? data.uploadedDocuments;

  if (Array.isArray(value)) {
    return value
      .map(documentLinkFromValue)
      .filter((document): document is BookingDocumentLink => Boolean(document));
  }

  const record = readRecord(value);

  if (record) {
    const documents: BookingDocumentLink[] = [];

    Object.entries(record).forEach(([key, item], index) => {
      const document = documentLinkFromValue(item, index);

      if (!document) {
        return;
      }

      documents.push({
        ...document,
        name: document.name || key,
        type: document.type ?? key,
      });
    });

    return documents;
  }

  return [];
}

function readSelectedNewspapers(data: DocumentData): SelectedNewspaper[] {
  const value = data.selectedNewspapers;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is SelectedNewspaper =>
      typeof item === "string" ||
      (typeof item === "object" && item !== null && !Array.isArray(item)),
  );
}

function readPricing(data: DocumentData): BookingPricing {
  const pricing = readRecord(data.pricing) ?? {};

  return {
    status:
      typeof pricing.status === "string"
        ? pricing.status
        : readString(data, "pricingStatus") ?? "PENDING_VERIFICATION",
    basePrice: readNumber(pricing.basePrice) ?? 0,
    extraWordCharges: readNumber(pricing.extraWordCharges) ?? 0,
    urgencyCharge: readNumber(pricing.urgencyCharge) ?? 0,
    agencyCommission: readNumber(pricing.agencyCommission) ?? 0,
    gst: readNumber(pricing.gst) ?? 0,
    discount: readNumber(pricing.discount) ?? 0,
    total:
      readNumber(pricing.total) ??
      readNumber(pricing.finalPrice) ??
      readNumber(data.finalPrice) ??
      0,
    confirmedAt: toDate(pricing.confirmedAt),
    confirmedBy:
      typeof pricing.confirmedBy === "string" ? pricing.confirmedBy : null,
  };
}

function readPayment(data: DocumentData): BookingPayment {
  const payment = readRecord(data.payment) ?? {};

  return {
    status:
      typeof payment.status === "string"
        ? payment.status
        : readString(data, "paymentStatus") ?? "NOT_REQUIRED_YET",
    amount:
      readNumber(payment.amount) ??
      readNumber(data.finalPrice) ??
      readNumber(readRecord(data.pricing)?.total) ??
      0,
    gateway: typeof payment.gateway === "string" ? payment.gateway : null,
    transactionId:
      typeof payment.transactionId === "string" ? payment.transactionId : null,
    paidAt: toDate(payment.paidAt),
    receiptUrl:
      typeof payment.receiptUrl === "string" ? payment.receiptUrl : null,
  };
}

function readPublication(data: DocumentData): BookingPublication {
  const publication = readRecord(data.publication) ?? {};

  return {
    status:
      typeof publication.status === "string"
        ? publication.status
        : data.status === "PUBLISHED"
          ? "PUBLISHED"
          : data.status === "SENT_TO_NEWSPAPER"
            ? "SENT_TO_NEWSPAPER"
            : "NOT_SENT",
    sentAt: toDate(publication.sentAt),
    publishedAt: toDate(publication.publishedAt),
    proofUrl:
      typeof publication.proofUrl === "string" ? publication.proofUrl : null,
    publicationDate: toDate(publication.publicationDate),
    newspaperReferenceId:
      typeof publication.newspaperReferenceId === "string"
        ? publication.newspaperReferenceId
        : null,
  };
}

function readAdminNotes(data: DocumentData): BookingDocument["adminNotes"] {
  const value = data.adminNotes;

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is AdminNote => {
      return (
        typeof item === "object" &&
        item !== null &&
        "note" in item &&
        typeof item.note === "string"
      );
    });
  }

  return null;
}

function bookingFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): BookingDocument {
  const data = snapshot.data();

  if (!data) {
    return {
      id: snapshot.id,
      raw: {},
    };
  }

  const documents = readDocumentLinks(data);
  const pricing = readPricing(data);
  const payment = readPayment(data);

  return {
    id: snapshot.id,
    bookingId: readString(data, "bookingId") ?? snapshot.id,
    userId: readString(data, "userId"),
    customerName: readString(data, "customerName"),
    customerEmail: readString(data, "customerEmail"),
    customerPhone: readString(data, "customerPhone"),
    noticeType: readString(data, "noticeType"),
    noticeMatter: readString(data, "noticeMatter"),
    language: readString(data, "language"),
    city: readString(data, "city"),
    state: readString(data, "state"),
    publicationCity: readString(data, "publicationCity") ?? readString(data, "city"),
    selectedNewspapers: readSelectedNewspapers(data),
    documents,
    pricing,
    payment,
    publication: readPublication(data),
    status: readString(data, "status") ?? "DRAFT",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    adminNotes: readAdminNotes(data),
    documentUrls:
      readStringArray(data, "documentUrls") ??
      documents.flatMap((document) => (document.url ? [document.url] : [])),
    paymentStatus: payment.status,
    pricingStatus: pricing.status,
    finalPrice: pricing.total,
    raw: data,
  };
}

function noteFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): AdminNote | null {
  const data = snapshot.data();

  if (!data) {
    return null;
  }

  const note = readString(data, "note");

  if (!note) {
    return null;
  }

  return {
    id: snapshot.id,
    note,
    createdBy: readString(data, "createdBy"),
    createdAt: toDate(data.createdAt) ?? readString(data, "createdAt"),
  };
}

function timelineFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): TimelineEntry {
  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    status: readString(data, "status"),
    message: readString(data, "message"),
    visibleToUser: readBoolean(data.visibleToUser) ?? false,
    createdBy: readString(data, "createdBy") ?? readString(data, "updatedBy"),
    updatedBy: readString(data, "updatedBy") ?? readString(data, "createdBy"),
    createdAt: toDate(data.createdAt),
  };
}

function sortBookingsByCreatedAt(bookings: BookingDocument[]) {
  return [...bookings].sort((first, second) => {
    const firstTime = first.createdAt?.getTime() ?? 0;
    const secondTime = second.createdAt?.getTime() ?? 0;

    return secondTime - firstTime;
  });
}

async function resolveBookingDoc(id: string) {
  const { db } = getFirebaseClient();
  const directRef = doc(db, "bookings", id);
  const directSnapshot = await getDoc(directRef);

  if (directSnapshot.exists()) {
    return {
      actualId: directSnapshot.id,
      ref: directRef,
      snapshot: directSnapshot,
    };
  }

  const fallbackSnapshot = await getDocs(
    query(collection(db, "bookings"), where("bookingId", "==", id), limit(1)),
  );
  const fallbackDoc = fallbackSnapshot.docs[0];

  if (!fallbackDoc) {
    throw new Error(`Booking not found for document id or bookingId: ${id}`);
  }

  return {
    actualId: fallbackDoc.id,
    ref: fallbackDoc.ref,
    snapshot: fallbackDoc,
  };
}

async function resolveOptionalBookingDoc(id: string) {
  try {
    return await resolveBookingDoc(id);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Booking document resolution failed", error);
    }

    return null;
  }
}

function sanitizedDocuments(documents: BookingDocumentLink[]) {
  return documents.map((document, index) => ({
    type: document.type ?? "",
    name: document.name || `Document ${index + 1}`,
    url: document.url ?? "",
    uploadedAt: document.uploadedAt ?? null,
    verified: document.verified ?? false,
    rejectionReason: document.rejectionReason ?? null,
  }));
}

function normalizedPayload(booking: BookingDocument) {
  return {
    bookingId: booking.bookingId ?? booking.id,
    userId: booking.userId ?? "",
    customerName: booking.customerName ?? "",
    customerEmail: booking.customerEmail ?? "",
    customerPhone: booking.customerPhone ?? "",
    noticeType: booking.noticeType ?? "",
    noticeMatter: booking.noticeMatter ?? "",
    language: booking.language ?? "",
    city: booking.city ?? "",
    state: booking.state ?? "",
    publicationCity: booking.publicationCity ?? booking.city ?? "",
    selectedNewspapers: booking.selectedNewspapers ?? [],
    documents: sanitizedDocuments(booking.documents ?? []),
    pricing: {
      status: booking.pricing?.status ?? "PENDING_VERIFICATION",
      basePrice: booking.pricing?.basePrice ?? 0,
      extraWordCharges: booking.pricing?.extraWordCharges ?? 0,
      urgencyCharge: booking.pricing?.urgencyCharge ?? 0,
      agencyCommission: booking.pricing?.agencyCommission ?? 0,
      gst: booking.pricing?.gst ?? 0,
      discount: booking.pricing?.discount ?? 0,
      total: booking.pricing?.total ?? 0,
      confirmedAt: booking.pricing?.confirmedAt ?? null,
      confirmedBy: booking.pricing?.confirmedBy ?? null,
    },
    payment: {
      status: booking.payment?.status ?? "NOT_REQUIRED_YET",
      amount: booking.payment?.amount ?? 0,
      gateway: booking.payment?.gateway ?? null,
      transactionId: booking.payment?.transactionId ?? null,
      paidAt: booking.payment?.paidAt ?? null,
      receiptUrl: booking.payment?.receiptUrl ?? null,
    },
    publication: {
      status: booking.publication?.status ?? "NOT_SENT",
      sentAt: booking.publication?.sentAt ?? null,
      publishedAt: booking.publication?.publishedAt ?? null,
      proofUrl: booking.publication?.proofUrl ?? null,
      publicationDate: booking.publication?.publicationDate ?? null,
      newspaperReferenceId: booking.publication?.newspaperReferenceId ?? null,
    },
    status: booking.status ?? "DRAFT",
  };
}

async function addTimelineWithBatch({
  batch,
  bookingRef,
  createdBy,
  message,
  status,
  visibleToUser,
}: {
  batch: ReturnType<typeof writeBatch>;
  bookingRef: ReturnType<typeof doc>;
  createdBy: string;
  message: string;
  status: string;
  visibleToUser: boolean;
}) {
  batch.set(doc(collection(bookingRef, "timeline")), {
    status,
    message,
    visibleToUser,
    createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function getBookings(): Promise<BookingDocument[]> {
  const { db } = getFirebaseClient();
  const bookingsCollection = collection(db, "bookings");

  try {
    const orderedSnapshot = await getDocs(
      query(bookingsCollection, orderBy("createdAt", "desc")),
    );
    const orderedBookings = orderedSnapshot.docs.map(bookingFromSnapshot);
    const unorderedSnapshot = await getDocs(bookingsCollection);

    if (orderedSnapshot.size === unorderedSnapshot.size) {
      return orderedBookings;
    }

    const bookingsById = new Map(
      orderedBookings.map((booking) => [booking.id, booking]),
    );

    for (const snapshot of unorderedSnapshot.docs) {
      if (!bookingsById.has(snapshot.id)) {
        bookingsById.set(snapshot.id, bookingFromSnapshot(snapshot));
      }
    }

    return sortBookingsByCreatedAt([...bookingsById.values()]);
  } catch {
    const snapshot = await getDocs(bookingsCollection);

    return sortBookingsByCreatedAt(snapshot.docs.map(bookingFromSnapshot));
  }
}

export async function getBookingById(
  id: string,
): Promise<BookingDocument | null> {
  const resolvedBooking = await resolveOptionalBookingDoc(id);

  if (!resolvedBooking) {
    return null;
  }

  return bookingFromSnapshot(resolvedBooking.snapshot);
}

export async function normalizeBookingSchema(id: string) {
  const resolvedBooking = await resolveOptionalBookingDoc(id);

  if (!resolvedBooking) {
    return;
  }

  const booking = bookingFromSnapshot(resolvedBooking.snapshot);

  await updateDoc(resolvedBooking.ref, {
    ...normalizedPayload(booking),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNoticeMatter(id: string, noticeMatter: string) {
  const { ref } = await resolveBookingDoc(id);

  await updateDoc(ref, {
    noticeMatter,
    updatedAt: serverTimestamp(),
  });
}

export async function updateBookingDocumentVerification({
  id,
  documentIndex,
  rejectionReason,
  verified,
  updatedBy,
}: {
  id: string;
  documentIndex: number;
  rejectionReason?: string;
  verified: boolean;
  updatedBy: string;
}) {
  const { db } = getFirebaseClient();
  const booking = await getBookingById(id);

  if (!booking) {
    throw new Error("Booking not found.");
  }

  const documents = sanitizedDocuments(booking.documents ?? []);
  const documentToUpdate = documents[documentIndex];

  if (!documentToUpdate) {
    throw new Error("Document not found.");
  }

  documents[documentIndex] = {
    ...documentToUpdate,
    verified,
    rejectionReason: verified ? null : rejectionReason || "Document rejected",
  };

  const hasRejectedDocuments = documents.some(
    (documentItem) => documentItem.verified === false && documentItem.rejectionReason,
  );

  const nextStatus: BookingStatus = hasRejectedDocuments
    ? "DOCUMENTS_REJECTED"
    : booking.status ?? "UNDER_REVIEW";
  const message = verified
    ? `${documentToUpdate.name} has been approved.`
    : `${documentToUpdate.name} was rejected. ${rejectionReason || ""}`.trim();

  const { actualId, ref: bookingRef } = await resolveBookingDoc(id);
  const batch = writeBatch(db);

  batch.update(bookingRef, {
    documents,
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
  await addTimelineWithBatch({
    batch,
    bookingRef,
    createdBy: updatedBy,
    message,
    status: nextStatus,
    visibleToUser: true,
  });
  await batch.commit();

  await writeAuditLog({
    actorEmail: updatedBy,
    eventType: "STATUS_CHANGE",
    targetType: "bookings",
    targetId: actualId,
    message,
    metadata: { documentIndex, verified },
  });
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  options: {
    message?: string;
    updatedBy?: string;
    visibleToUser?: boolean;
  } = {},
) {
  const { actualId, ref: bookingRef } = await resolveBookingDoc(id);
  const actor = options.updatedBy ?? "Admin";
  const message = `Booking status updated to ${status}`;

  await updateDoc(bookingRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  try {
    await addDoc(collection(bookingRef, "timeline"), {
      status,
      message,
      visibleToUser: options.visibleToUser ?? true,
      createdBy: actor,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Timeline creation failed", error);
  }

  await writeAuditLog({
    actorEmail: actor,
    eventType: "STATUS_CHANGE",
    targetType: "bookings",
    targetId: actualId,
    message,
    metadata: { status },
  });
}

export async function updateBookingPricing(
  id: string,
  pricing: BookingPricing,
  updatedBy = "-",
) {
  return confirmBookingPricing(id, pricing, updatedBy);
}

export async function confirmBookingPricing(
  id: string,
  pricing: BookingPricing,
  confirmedBy: string,
) {
  const { db } = getFirebaseClient();
  const { actualId, ref: bookingRef } = await resolveBookingDoc(id);
  const batch = writeBatch(db);
  const total = pricing.total ?? 0;

  batch.update(bookingRef, {
    pricing: {
      status: "CONFIRMED",
      basePrice: pricing.basePrice ?? 0,
      extraWordCharges: pricing.extraWordCharges ?? 0,
      urgencyCharge: pricing.urgencyCharge ?? 0,
      agencyCommission: pricing.agencyCommission ?? 0,
      gst: pricing.gst ?? 0,
      discount: pricing.discount ?? 0,
      total,
      confirmedAt: serverTimestamp(),
      confirmedBy,
    },
    pricingStatus: "CONFIRMED",
    status: "PRICE_CONFIRMED",
    finalPrice: total,
    updatedAt: serverTimestamp(),
  });
  await addTimelineWithBatch({
    batch,
    bookingRef,
    createdBy: confirmedBy,
    message: "Final price has been confirmed.",
    status: "PRICE_CONFIRMED",
    visibleToUser: true,
  });
  await batch.commit();

  await writeAuditLog({
    actorEmail: confirmedBy,
    eventType: "PRICING_CHANGE",
    targetType: "bookings",
    targetId: actualId,
    message: "Booking pricing confirmed",
    metadata: { total },
  });
}

export async function moveBookingToPaymentPending(
  id: string,
  amount: number,
  updatedBy: string,
) {
  const { db } = getFirebaseClient();
  const { ref: bookingRef } = await resolveBookingDoc(id);
  const batch = writeBatch(db);

  batch.update(bookingRef, {
    "payment.status": "PENDING",
    "payment.amount": amount,
    "payment.receiptUrl": null,
    paymentStatus: "PENDING",
    status: "PAYMENT_PENDING",
    updatedAt: serverTimestamp(),
  });
  await addTimelineWithBatch({
    batch,
    bookingRef,
    createdBy: updatedBy,
    message: "Payment is now pending. Please complete payment to continue publication.",
    status: "PAYMENT_PENDING",
    visibleToUser: true,
  });
  await batch.commit();
}

export async function markBookingPaidManually(id: string, updatedBy: string) {
  const { db } = getFirebaseClient();
  const { ref: bookingRef } = await resolveBookingDoc(id);
  const batch = writeBatch(db);

  batch.update(bookingRef, {
    "payment.status": "PAID",
    "payment.paidAt": serverTimestamp(),
    paymentStatus: "PAID",
    status: "PAID",
    updatedAt: serverTimestamp(),
  });
  await addTimelineWithBatch({
    batch,
    bookingRef,
    createdBy: updatedBy,
    message: "Payment received successfully.",
    status: "PAID",
    visibleToUser: true,
  });
  await batch.commit();
}

export async function markSentToNewspaper(id: string, updatedBy: string) {
  const { db } = getFirebaseClient();
  const { ref: bookingRef } = await resolveBookingDoc(id);
  const batch = writeBatch(db);

  batch.update(bookingRef, {
    "publication.status": "SENT_TO_NEWSPAPER",
    "publication.sentAt": serverTimestamp(),
    status: "SENT_TO_NEWSPAPER",
    updatedAt: serverTimestamp(),
  });
  await addTimelineWithBatch({
    batch,
    bookingRef,
    createdBy: updatedBy,
    message: "Your notice has been sent to the selected newspaper.",
    status: "SENT_TO_NEWSPAPER",
    visibleToUser: true,
  });
  await batch.commit();
}

export async function markBookingPublished({
  id,
  proofUrl,
  publicationDate,
  updatedBy,
}: {
  id: string;
  proofUrl?: string;
  publicationDate?: Date | null;
  updatedBy: string;
}) {
  const { db } = getFirebaseClient();
  const { ref: bookingRef } = await resolveBookingDoc(id);
  const batch = writeBatch(db);

  batch.update(bookingRef, {
    "publication.status": "PUBLISHED",
    "publication.proofUrl": proofUrl || null,
    "publication.publishedAt": serverTimestamp(),
    "publication.publicationDate": publicationDate ?? null,
    status: "PUBLISHED",
    updatedAt: serverTimestamp(),
  });
  await addTimelineWithBatch({
    batch,
    bookingRef,
    createdBy: updatedBy,
    message: "Your notice has been published. Publication proof is available.",
    status: "PUBLISHED",
    visibleToUser: true,
  });
  await batch.commit();
}

export async function addUserVisibleTimelineEntry(
  id: string,
  message: string,
  createdBy: string,
) {
  const { ref: bookingRef } = await resolveBookingDoc(id);

  await addDoc(collection(bookingRef, "timeline"), {
    status: "UPDATE",
    message,
    visibleToUser: true,
    createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function addAdminNote(
  id: string,
  note: string,
  createdBy: string,
) {
  const { ref: bookingRef } = await resolveBookingDoc(id);

  await addDoc(collection(bookingRef, "adminNotes"), {
    note,
    createdBy,
    createdAt: serverTimestamp(),
  });

  await updateDoc(bookingRef, {
    updatedAt: serverTimestamp(),
  });
}

export async function getAdminNotes(id: string): Promise<AdminNote[]> {
  const resolvedBooking = await resolveOptionalBookingDoc(id);

  if (!resolvedBooking) {
    return [];
  }

  try {
    const snapshot = await getDocs(
      query(
        collection(resolvedBooking.ref, "adminNotes"),
        orderBy("createdAt", "desc"),
      ),
    );

    return snapshot.docs
      .map(noteFromSnapshot)
      .filter((note): note is AdminNote => Boolean(note));
  } catch {
    const snapshot = await getDocs(collection(resolvedBooking.ref, "adminNotes"));

    return snapshot.docs
      .map(noteFromSnapshot)
      .filter((note): note is AdminNote => Boolean(note))
      .sort((first, second) => {
        const firstTime =
          first.createdAt instanceof Date ? first.createdAt.getTime() : 0;
        const secondTime =
          second.createdAt instanceof Date ? second.createdAt.getTime() : 0;

        return secondTime - firstTime;
      });
  }
}

export async function getTimeline(id: string): Promise<TimelineEntry[]> {
  const resolvedBooking = await resolveOptionalBookingDoc(id);

  if (!resolvedBooking) {
    return [];
  }

  try {
    const snapshot = await getDocs(
      query(
        collection(resolvedBooking.ref, "timeline"),
        orderBy("createdAt", "desc"),
      ),
    );

    return snapshot.docs.map(timelineFromSnapshot);
  } catch {
    const snapshot = await getDocs(collection(resolvedBooking.ref, "timeline"));

    return snapshot.docs.map(timelineFromSnapshot).sort((first, second) => {
      const firstTime = first.createdAt?.getTime() ?? 0;
      const secondTime = second.createdAt?.getTime() ?? 0;

      return secondTime - firstTime;
    });
  }
}
