import type { EvidenceState, ProductStatus } from "@/domain/types";

const evidenceLabels: Record<EvidenceState, string> = {
  OWNER_CONFIRMED: "Representative attested",
  PUBLIC_EVIDENCE: "Public evidence",
  LEGACY_SOURCE: "Legacy source",
  CONFLICT: "Conflict",
  UNKNOWN: "Unknown",
};

const productStatusLabels: Record<ProductStatus, string> = {
  CURRENTLY_AVAILABLE: "Currently available",
  SEASONAL: "Seasonal",
  DISCONTINUED: "Discontinued",
  UNKNOWN: "Unknown",
};

export const evidenceLabel = (state: EvidenceState) => evidenceLabels[state];
export const productStatusLabel = (status: ProductStatus) =>
  productStatusLabels[status];

export function formatAttestedDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
}
