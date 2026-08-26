export const evidenceStates = [
  "OWNER_CONFIRMED",
  "PUBLIC_EVIDENCE",
  "LEGACY_SOURCE",
  "CONFLICT",
  "UNKNOWN",
] as const;

export type EvidenceState = (typeof evidenceStates)[number];

export type ProductStatus =
  | "CURRENTLY_AVAILABLE"
  | "SEASONAL"
  | "DISCONTINUED"
  | "UNKNOWN";

export type PrimaryWorkflow =
  | "REQUEST_QUOTATION"
  | "REQUEST_SAMPLES"
  | "DISTRIBUTION_INQUIRY"
  | "PRODUCT_AVAILABILITY_INQUIRY";

export interface Product {
  id: string;
  name: string;
  description: string;
  status: ProductStatus;
  packaging: string;
  moq: string;
  minimumQuantity: number;
  privateLabel: boolean;
  exportMarkets: string[];
  certifications: string;
  evidenceState: EvidenceState;
  lastConfirmed: string;
}

export interface BusinessProfile {
  slug: string;
  name: string;
  description: string;
  country: string;
  sector: string;
  status: "ACTIVE" | "NOT_ATTESTED";
  lastAttested: string;
  email: string;
  phone: string;
  capabilities: {
    b2bInquiries: boolean;
    exports: boolean;
    samples: boolean;
    privateLabel: boolean;
    marketsServed: string[];
  };
  workflow: PrimaryWorkflow;
  evidenceState: EvidenceState;
  products: Product[];
}

export interface InquiryDraft {
  productId: string;
  quantity: string;
  destinationCountry: string;
  requestSamples: boolean;
  privateLabel: boolean;
  buyerCompany: string;
  buyerName: string;
  buyerEmail: string;
  questions: string;
  idempotencyKey: string;
  updatedAt: string;
}

export type InquiryField = keyof Omit<
  InquiryDraft,
  "idempotencyKey" | "updatedAt"
>;

export interface InquiryReceipt {
  idempotencyKey: string;
  reference: string;
  status: "SUBMITTED";
  submittedAt: string;
}

export interface ActivityEntry {
  id: string;
  tool: string;
  action: "available" | "called" | "completed" | "failed" | "removed";
  summary: string;
  timestamp: string;
  readOnly: boolean;
  approvalRequired: boolean;
}

export interface AttestationSnapshot {
  identity: Pick<BusinessProfile, "name" | "description" | "country" | "sector">;
  contactStates: Record<string, "CURRENT" | "OUTDATED" | "UNKNOWN">;
  productStates: Record<string, ProductStatus>;
  capabilities: Pick<
    BusinessProfile["capabilities"],
    "b2bInquiries" | "exports" | "samples" | "privateLabel"
  >;
  marketsServed: string[];
  workflow: PrimaryWorkflow;
  attestedAt: string;
}
