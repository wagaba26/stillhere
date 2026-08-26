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

export type DestinationStatus =
  | "SUPPORTED"
  | "AVAILABLE_BY_INQUIRY"
  | "UNSUPPORTED"
  | "UNKNOWN";

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
  action:
    | "available"
    | "called"
    | "completed"
    | "failed"
    | "removed"
    | "proposed"
    | "accepted"
    | "edited"
    | "rejected"
    | "published";
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

export type SourceType =
  | "LEGACY_WEBSITE"
  | "CATALOGUE"
  | "PUBLIC_SOURCE"
  | "REPRESENTATIVE";

export interface EvidenceSource {
  id: string;
  type: SourceType;
  title: string;
  observedAt: string;
  url?: string;
  evidenceState: EvidenceState;
  description?: string;
}

export const continuityFields = [
  "businessName",
  "businessDescription",
  "country",
  "sector",
  "operatingStatus",
  "tradeEmail",
  "tradePhone",
  "capabilities",
  "marketsServed",
  "primaryWorkflow",
  "stableOfferings",
  "instantCoffeeStatus",
  "instantCoffeeMoq",
  "instantCoffeePrivateLabel",
  "japanAvailability",
  "certification",
] as const;

export type ContinuityField = (typeof continuityFields)[number];

export interface BusinessClaim {
  id: string;
  subjectId: string;
  field: ContinuityField;
  value: unknown;
  sourceId: string;
  observedAt: string;
  evidenceState: EvidenceState;
}

export type ResolutionState =
  | "UNRESOLVED"
  | "AGENT_PROPOSED"
  | "HUMAN_ACCEPTED"
  | "HUMAN_EDITED"
  | "HUMAN_REJECTED";

export type ResolutionAction = "USE_VALUE" | "EXCLUDE";

export interface ClaimResolution {
  id: string;
  subjectId: string;
  field: ContinuityField;
  action: ResolutionAction;
  proposal?: unknown;
  acceptedValue?: unknown;
  supportingSourceIds: string[];
  explanation?: string;
  state: ResolutionState;
  proposedBy?: "AGENT";
  resolvedBy?: "HUMAN";
  proposedAt?: string;
  resolvedAt?: string;
}

export interface ContinuityState {
  businessId: string;
  sources: EvidenceSource[];
  claims: BusinessClaim[];
  resolutions: ClaimResolution[];
  publishedVersionId?: string;
  updatedAt: string;
}

export interface BusinessPassport {
  businessId: string;
  profile: BusinessProfile;
  destinationStatuses: Record<string, Record<string, DestinationStatus>>;
  acceptedFields: ContinuityField[];
  omittedFields: ContinuityField[];
  generatedFromResolutionIds: string[];
  representativeAttestedAt?: string;
}

export interface PassportVersion {
  id: string;
  version: number;
  generatedFromResolutionIds: string[];
  publishedAt: string;
  passport: BusinessPassport;
}
