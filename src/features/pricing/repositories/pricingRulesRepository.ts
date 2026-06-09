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

import { writeAuditLog } from "@/features/settings/repositories/settingsRepository";
import { getFirebaseClient } from "@/shared/lib/firebase/client";
import type {
  PricingRuleComponents,
  PricingRuleDocument,
  PricingRulePayload,
} from "@/types/pricing-rule";

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

function readComponents(data: DocumentData): PricingRuleComponents {
  const source =
    typeof data.components === "object" &&
    data.components !== null &&
    !Array.isArray(data.components)
      ? (data.components as Record<string, unknown>)
      : data;

  return {
    baseCost: readNumber(source.baseCost),
    costPerWord: readNumber(source.costPerWord),
    urgentCharge: readNumber(source.urgentCharge),
    sundayCharge: readNumber(source.sundayCharge),
    holidayCharge: readNumber(source.holidayCharge),
    gstPercent: readNumber(source.gstPercent),
    agencyCommissionPercent: readNumber(source.agencyCommissionPercent),
  };
}

function pricingRuleFromSnapshot(
  snapshot: DocumentSnapshot<DocumentData>,
): PricingRuleDocument {
  const data = snapshot.data();

  if (!data) {
    return {
      id: snapshot.id,
      components: {},
      raw: {},
    };
  }

  return {
    id: snapshot.id,
    ruleName: readString(data, "ruleName") ?? readString(data, "name"),
    newspaperId: readString(data, "newspaperId"),
    newspaperName: readString(data, "newspaperName") ?? readString(data, "newspaper"),
    editionId: readString(data, "editionId"),
    editionName: readString(data, "editionName") ?? readString(data, "edition"),
    noticeType: readString(data, "noticeType"),
    language: readString(data, "language"),
    active: readBoolean(data, "active") ?? true,
    components: readComponents(data),
    createdBy: readString(data, "createdBy"),
    updatedBy: readString(data, "updatedBy"),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    raw: data,
  };
}

function sortPricingRules(rules: PricingRuleDocument[]) {
  return [...rules].sort((first, second) => {
    const firstTime = first.updatedAt?.getTime() ?? first.createdAt?.getTime() ?? 0;
    const secondTime =
      second.updatedAt?.getTime() ?? second.createdAt?.getTime() ?? 0;

    if (secondTime !== firstTime) {
      return secondTime - firstTime;
    }

    return (first.ruleName ?? "").localeCompare(second.ruleName ?? "");
  });
}

function normalizePayload(payload: PricingRulePayload) {
  return {
    ruleName: payload.ruleName.trim(),
    newspaperId: payload.newspaperId ?? "",
    newspaperName: payload.newspaperName.trim(),
    editionId: payload.editionId ?? "",
    editionName: payload.editionName.trim(),
    noticeType: payload.noticeType,
    language: payload.language.trim(),
    active: payload.active,
    components: {
      baseCost: payload.components.baseCost,
      costPerWord: payload.components.costPerWord,
      urgentCharge: payload.components.urgentCharge,
      sundayCharge: payload.components.sundayCharge,
      holidayCharge: payload.components.holidayCharge,
      gstPercent: payload.components.gstPercent,
      agencyCommissionPercent: payload.components.agencyCommissionPercent,
    },
  };
}

export async function getPricingRules(): Promise<PricingRuleDocument[]> {
  const { db } = getFirebaseClient();
  const pricingRulesCollection = collection(db, "pricingRules");

  try {
    const snapshot = await getDocs(
      query(pricingRulesCollection, orderBy("updatedAt", "desc")),
    );

    return snapshot.docs.map(pricingRuleFromSnapshot);
  } catch {
    const snapshot = await getDocs(pricingRulesCollection);

    return sortPricingRules(snapshot.docs.map(pricingRuleFromSnapshot));
  }
}

export async function createPricingRule(
  payload: PricingRulePayload,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await addDoc(collection(db, "pricingRules"), {
    ...normalizePayload(payload),
    createdBy: actorEmail,
    updatedBy: actorEmail,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    actorEmail,
    eventType: "PRICING_CHANGE",
    targetType: "pricingRules",
    message: `Created pricing rule ${payload.ruleName}`,
    metadata: {
      newspaperName: payload.newspaperName,
      editionName: payload.editionName,
      noticeType: payload.noticeType,
    },
  });
}

export async function updatePricingRule(
  id: string,
  payload: PricingRulePayload,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await updateDoc(doc(db, "pricingRules", id), {
    ...normalizePayload(payload),
    updatedBy: actorEmail,
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    actorEmail,
    eventType: "PRICING_CHANGE",
    targetType: "pricingRules",
    targetId: id,
    message: `Updated pricing rule ${payload.ruleName}`,
    metadata: {
      newspaperName: payload.newspaperName,
      editionName: payload.editionName,
      noticeType: payload.noticeType,
    },
  });
}

export async function setPricingRuleActive(
  id: string,
  active: boolean,
  actorEmail: string,
) {
  const { db } = getFirebaseClient();

  await updateDoc(doc(db, "pricingRules", id), {
    active,
    updatedBy: actorEmail,
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    actorEmail,
    eventType: "PRICING_CHANGE",
    targetType: "pricingRules",
    targetId: id,
    message: active ? "Enabled pricing rule" : "Disabled pricing rule",
  });
}

export async function deletePricingRule(id: string, actorEmail = "system") {
  const { db } = getFirebaseClient();

  await deleteDoc(doc(db, "pricingRules", id));

  await writeAuditLog({
    actorEmail,
    eventType: "PRICING_CHANGE",
    targetType: "pricingRules",
    targetId: id,
    message: "Deleted pricing rule",
  });
}
