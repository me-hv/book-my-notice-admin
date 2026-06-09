"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";

import { getFirebaseClient } from "@/shared/lib/firebase/client";
import type {
  NewspaperDocument,
  NewspaperEdition,
  NewspaperPayload,
  NewspaperPricing,
} from "@/types/newspaper";

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

function readNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readPricing(value: unknown): NewspaperPricing {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;

  return {
    baseClassifiedRate: readNumber(record.baseClassifiedRate),
    baseDisplayRate: readNumber(record.baseDisplayRate),
    minWordCount: readNumber(record.minWordCount),
    extraWordCost: readNumber(record.extraWordCost),
  };
}

function readEditions(data: DocumentData): NewspaperEdition[] {
  const value = data.editions;

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    )
    .map((edition, index) => ({
      id:
        typeof edition.id === "string"
          ? edition.id
          : typeof edition.editionId === "string"
            ? edition.editionId
            : `edition-${index + 1}`,
      name:
        typeof edition.name === "string"
          ? edition.name
          : typeof edition.editionName === "string"
            ? edition.editionName
            : undefined,
      city: typeof edition.city === "string" ? edition.city : undefined,
      state: typeof edition.state === "string" ? edition.state : undefined,
      publicationDays: readStringArray(edition.publicationDays),
      active: typeof edition.active === "boolean" ? edition.active : true,
      pricing: readPricing(edition.pricing),
    }));
}

function newspaperFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): NewspaperDocument {
  const data = snapshot.data();

  if (!data) {
    return {
      id: snapshot.id,
      editions: [],
      raw: {},
    };
  }

  const publicationRules =
    typeof data.publicationRules === "object" &&
    data.publicationRules !== null &&
    !Array.isArray(data.publicationRules)
      ? (data.publicationRules as Record<string, unknown>)
      : {};

  return {
    id: snapshot.id,
    name: readString(data, "name"),
    language: readString(data, "language"),
    category: readString(data, "category"),
    logoUrl: readString(data, "logoUrl"),
    description: readString(data, "description"),
    active: readBoolean(data, "active") ?? true,
    editions: readEditions(data),
    pricing:
      typeof data.pricing === "object" &&
      data.pricing !== null &&
      !Array.isArray(data.pricing)
        ? (data.pricing as Record<string, unknown>)
        : undefined,
    publicationRules: {
      cutoffTime:
        typeof publicationRules.cutoffTime === "string"
          ? publicationRules.cutoffTime
          : undefined,
      availableDays: readStringArray(publicationRules.availableDays),
      holidayBlockDates: readStringArray(publicationRules.holidayBlockDates),
    },
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    raw: data,
  };
}

function sortNewspapers(newspapers: NewspaperDocument[]) {
  return [...newspapers].sort((first, second) => {
    const firstTime = first.updatedAt?.getTime() ?? first.createdAt?.getTime() ?? 0;
    const secondTime =
      second.updatedAt?.getTime() ?? second.createdAt?.getTime() ?? 0;

    if (secondTime !== firstTime) {
      return secondTime - firstTime;
    }

    return (first.name ?? "").localeCompare(second.name ?? "");
  });
}

function cleanEdition(edition: NewspaperEdition, index: number): NewspaperEdition {
  return {
    id: edition.id || `edition-${index + 1}`,
    name: edition.name?.trim() || "",
    city: edition.city?.trim() || "",
    state: edition.state?.trim() || "",
    publicationDays: edition.publicationDays ?? [],
    active: edition.active ?? true,
    pricing: {
      baseClassifiedRate: edition.pricing?.baseClassifiedRate ?? 0,
      baseDisplayRate: edition.pricing?.baseDisplayRate ?? 0,
      minWordCount: edition.pricing?.minWordCount ?? 0,
      extraWordCost: edition.pricing?.extraWordCost ?? 0,
    },
  };
}

function pricingIndexFromEditions(editions: NewspaperEdition[]) {
  return {
    model: "PER_EDITION",
    editions: editions.reduce<Record<string, NewspaperPricing>>(
      (index, edition, editionIndex) => {
        const key = edition.id || edition.name || `edition-${editionIndex + 1}`;
        index[key] = {
          baseClassifiedRate: edition.pricing?.baseClassifiedRate ?? 0,
          baseDisplayRate: edition.pricing?.baseDisplayRate ?? 0,
          minWordCount: edition.pricing?.minWordCount ?? 0,
          extraWordCost: edition.pricing?.extraWordCost ?? 0,
        };

        return index;
      },
      {},
    ),
  };
}

function payloadToFirestore(payload: NewspaperPayload) {
  const editions = payload.editions.map(cleanEdition);

  return {
    name: payload.name.trim(),
    language: payload.language.trim(),
    category: payload.category.trim(),
    logoUrl: payload.logoUrl?.trim() || "",
    description: payload.description?.trim() || "",
    active: payload.active,
    editions,
    pricing: pricingIndexFromEditions(editions),
    publicationRules: {
      cutoffTime: payload.publicationRules.cutoffTime?.trim() || "",
      availableDays: payload.publicationRules.availableDays ?? [],
      holidayBlockDates: payload.publicationRules.holidayBlockDates ?? [],
    },
  };
}

export async function getNewspapers(): Promise<NewspaperDocument[]> {
  const { db } = getFirebaseClient();
  const newspapersCollection = collection(db, "newspapers");

  try {
    const snapshot = await getDocs(
      query(newspapersCollection, orderBy("updatedAt", "desc")),
    );

    return snapshot.docs.map(newspaperFromSnapshot);
  } catch {
    const snapshot = await getDocs(newspapersCollection);

    return sortNewspapers(snapshot.docs.map(newspaperFromSnapshot));
  }
}

export async function createNewspaper(payload: NewspaperPayload) {
  const { db } = getFirebaseClient();

  await addDoc(collection(db, "newspapers"), {
    ...payloadToFirestore(payload),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNewspaper(id: string, payload: NewspaperPayload) {
  const { db } = getFirebaseClient();

  await updateDoc(doc(db, "newspapers", id), {
    ...payloadToFirestore(payload),
    updatedAt: serverTimestamp(),
  });
}

export async function setNewspaperActive(id: string, active: boolean) {
  const { db } = getFirebaseClient();

  await updateDoc(doc(db, "newspapers", id), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNewspaper(id: string) {
  const { db } = getFirebaseClient();

  await deleteDoc(doc(db, "newspapers", id));
}
