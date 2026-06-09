import type { Timestamp } from "firebase/firestore";

export type FirestoreDateValue =
  | Timestamp
  | Date
  | string
  | number
  | null
  | undefined;

export type NewspaperPricing = {
  baseClassifiedRate?: number;
  baseDisplayRate?: number;
  minWordCount?: number;
  extraWordCost?: number;
};

export type NewspaperEdition = {
  id?: string;
  name?: string;
  city?: string;
  state?: string;
  publicationDays?: string[];
  active?: boolean;
  pricing?: NewspaperPricing;
};

export type NewspaperPublicationRules = {
  cutoffTime?: string;
  availableDays?: string[];
  holidayBlockDates?: string[];
};

export type NewspaperPricingIndex = {
  model?: "PER_EDITION" | string;
  editions?: Record<string, NewspaperPricing>;
};

export type NewspaperDocument = {
  id: string;
  name?: string;
  language?: string;
  category?: string;
  logoUrl?: string;
  description?: string;
  active?: boolean;
  editions?: NewspaperEdition[];
  pricing?: NewspaperPricingIndex | Record<string, unknown>;
  publicationRules?: NewspaperPublicationRules;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  raw?: Record<string, unknown>;
};

export type NewspaperPayload = {
  name: string;
  language: string;
  category: string;
  logoUrl?: string;
  description?: string;
  active: boolean;
  editions: NewspaperEdition[];
  publicationRules: NewspaperPublicationRules;
};
