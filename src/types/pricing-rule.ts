import type { Timestamp } from "firebase/firestore";

export const noticeTypes = [
  "Change Of Name",
  "Lost Document",
  "Affidavit",
  "Public Notice",
  "Matrimonial",
  "Obituary",
  "Tender",
  "Recruitment",
] as const;

export type NoticeType = (typeof noticeTypes)[number] | string;

export type PricingRuleComponents = {
  baseCost?: number;
  costPerWord?: number;
  urgentCharge?: number;
  sundayCharge?: number;
  holidayCharge?: number;
  gstPercent?: number;
  agencyCommissionPercent?: number;
};

export type PricingRuleDocument = {
  id: string;
  ruleName?: string;
  newspaperId?: string;
  newspaperName?: string;
  editionId?: string;
  editionName?: string;
  noticeType?: NoticeType;
  language?: string;
  active?: boolean;
  components?: PricingRuleComponents;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  raw?: Record<string, unknown>;
};

export type PricingRulePayload = {
  ruleName: string;
  newspaperId?: string;
  newspaperName: string;
  editionId?: string;
  editionName: string;
  noticeType: NoticeType;
  language: string;
  active: boolean;
  components: Required<PricingRuleComponents>;
};

export type PriceSimulationInput = {
  noticeType: string;
  wordCount: number;
  newspaperId?: string;
  newspaperName?: string;
  editionId?: string;
  editionName?: string;
};

export type PriceSimulationResult = {
  rule?: PricingRuleDocument;
  base: number;
  extraWords: number;
  extraWordsCost: number;
  urgentCharge: number;
  sundayCharge: number;
  holidayCharge: number;
  agencyCommission: number;
  taxableAmount: number;
  taxes: number;
  total: number;
};

export type FirestoreDateValue =
  | Timestamp
  | Date
  | string
  | number
  | null
  | undefined;
