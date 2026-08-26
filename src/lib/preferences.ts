const LOW_DATA_KEY = "stillhere-low-data";
const ATTESTATION_KEY = "stillhere-demo-attestation-v1";

import type { AttestationSnapshot } from "@/domain/types";

export function readLowDataPreference(storage: Pick<Storage, "getItem">) {
  return storage.getItem(LOW_DATA_KEY) === "true";
}

export function writeLowDataPreference(
  enabled: boolean,
  storage: Pick<Storage, "setItem">,
) {
  storage.setItem(LOW_DATA_KEY, String(enabled));
}

export function canOfferSubmitTool(approved: boolean, valid: boolean) {
  return approved && valid;
}

export function writeAttestationSnapshot(
  snapshot: AttestationSnapshot,
  storage: Pick<Storage, "setItem">,
) {
  storage.setItem(ATTESTATION_KEY, JSON.stringify(snapshot));
}

export function readAttestationSnapshot(storage: Pick<Storage, "getItem">) {
  const value = storage.getItem(ATTESTATION_KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<AttestationSnapshot>;
    const contactStates = new Set(["CURRENT", "OUTDATED", "UNKNOWN"]);
    const productStates = new Set([
      "CURRENTLY_AVAILABLE",
      "SEASONAL",
      "DISCONTINUED",
      "UNKNOWN",
    ]);
    const workflows = new Set([
      "REQUEST_QUOTATION",
      "REQUEST_SAMPLES",
      "DISTRIBUTION_INQUIRY",
      "PRODUCT_AVAILABILITY_INQUIRY",
    ]);
    if (
      !parsed.identity ||
      typeof parsed.identity.name !== "string" ||
      typeof parsed.identity.description !== "string" ||
      typeof parsed.identity.country !== "string" ||
      typeof parsed.identity.sector !== "string" ||
      !parsed.contactStates ||
      !Object.values(parsed.contactStates).every((state) =>
        contactStates.has(state),
      ) ||
      !parsed.productStates ||
      !Object.values(parsed.productStates).every((state) =>
        productStates.has(state),
      ) ||
      !parsed.capabilities ||
      typeof parsed.capabilities.b2bInquiries !== "boolean" ||
      typeof parsed.capabilities.exports !== "boolean" ||
      typeof parsed.capabilities.samples !== "boolean" ||
      typeof parsed.capabilities.privateLabel !== "boolean" ||
      !Array.isArray(parsed.marketsServed) ||
      !parsed.marketsServed.every((market) => typeof market === "string") ||
      typeof parsed.workflow !== "string" ||
      !workflows.has(parsed.workflow) ||
      typeof parsed.attestedAt !== "string"
    ) {
      return null;
    }
    return parsed as AttestationSnapshot;
  } catch {
    return null;
  }
}

export function clearAttestationSnapshot(
  storage: Pick<Storage, "removeItem">,
) {
  storage.removeItem(ATTESTATION_KEY);
}

export interface ResourceMeasurement {
  resources: number;
  transferredBytes: number;
  encodedBytes: number;
  measuredAt: string;
}

export function measureBrowserResources(
  performanceSource: Pick<Performance, "getEntriesByType">,
): ResourceMeasurement {
  const entries = performanceSource.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];
  return {
    resources: entries.length,
    transferredBytes: entries.reduce((total, entry) => total + entry.transferSize, 0),
    encodedBytes: entries.reduce((total, entry) => total + entry.encodedBodySize, 0),
    measuredAt: new Date().toISOString(),
  };
}
