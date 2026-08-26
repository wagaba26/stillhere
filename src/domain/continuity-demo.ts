import { business } from "./demo-data";
import { createPassportVersion } from "./passport";
import type {
  BusinessClaim,
  ClaimResolution,
  ContinuityField,
  ContinuityState,
  EvidenceSource,
} from "./types";

export const continuitySources: EvidenceSource[] = [
  {
    id: "legacy-website-2021",
    type: "LEGACY_WEBSITE",
    title: "Legacy website",
    observedAt: "2021-06-14",
    url: "https://legacy.rwenzoriharvest.example",
    evidenceState: "LEGACY_SOURCE",
    description: "Recovered page copy. Evidence only; not treated as current truth.",
  },
  {
    id: "catalogue-2023",
    type: "CATALOGUE",
    title: "Product catalogue",
    observedAt: "2023-09-08",
    evidenceState: "LEGACY_SOURCE",
    description: "A later fictional catalogue with different contact and MOQ values.",
  },
  {
    id: "public-evidence-2026",
    type: "PUBLIC_SOURCE",
    title: "Recent public evidence",
    observedAt: "2026-07-18",
    evidenceState: "PUBLIC_EVIDENCE",
    description: "Recent fictional trade activity; useful evidence, not representative authority.",
  },
  {
    id: "representative-2026",
    type: "REPRESENTATIVE",
    title: "Business representative",
    observedAt: "2026-08-26",
    evidenceState: "OWNER_CONFIRMED",
    description: "Fictional representative-attested information for this challenge demo.",
  },
];

const claim = (
  id: string,
  subjectId: string,
  field: ContinuityField,
  value: unknown,
  sourceId: string,
  observedAt: string,
  evidenceState: BusinessClaim["evidenceState"],
): BusinessClaim => ({
  id,
  subjectId,
  field,
  value,
  sourceId,
  observedAt,
  evidenceState,
});

export const continuityClaims: BusinessClaim[] = [
  claim("legacy-phone", business.slug, "tradePhone", "+256 700 111 201", "legacy-website-2021", "2021-06-14", "CONFLICT"),
  claim("catalogue-phone", business.slug, "tradePhone", "+256 700 222 202", "catalogue-2023", "2023-09-08", "CONFLICT"),
  claim("public-phone", business.slug, "tradePhone", business.phone, "public-evidence-2026", "2026-07-18", "PUBLIC_EVIDENCE"),
  claim("representative-phone", business.slug, "tradePhone", business.phone, "representative-2026", "2026-08-26", "OWNER_CONFIRMED"),
  claim("legacy-instant-moq", "instant-coffee-100g", "instantCoffeeMoq", 5000, "legacy-website-2021", "2021-06-14", "CONFLICT"),
  claim("catalogue-instant-moq", "instant-coffee-100g", "instantCoffeeMoq", 3000, "catalogue-2023", "2023-09-08", "CONFLICT"),
  claim("representative-instant-moq", "instant-coffee-100g", "instantCoffeeMoq", 2500, "representative-2026", "2026-08-26", "OWNER_CONFIRMED"),
  claim("public-instant-status", "instant-coffee-100g", "instantCoffeeStatus", "CURRENTLY_AVAILABLE", "public-evidence-2026", "2026-07-18", "PUBLIC_EVIDENCE"),
  claim("representative-instant-status", "instant-coffee-100g", "instantCoffeeStatus", "CURRENTLY_AVAILABLE", "representative-2026", "2026-08-26", "OWNER_CONFIRMED"),
  claim("legacy-japan", "instant-coffee-100g", "japanAvailability", "UNKNOWN", "legacy-website-2021", "2021-06-14", "UNKNOWN"),
  claim("catalogue-japan", "instant-coffee-100g", "japanAvailability", "UNKNOWN", "catalogue-2023", "2023-09-08", "UNKNOWN"),
  claim("public-japan", "instant-coffee-100g", "japanAvailability", "SUPPORTED", "public-evidence-2026", "2026-07-18", "PUBLIC_EVIDENCE"),
  claim("representative-japan", "instant-coffee-100g", "japanAvailability", "AVAILABLE_BY_INQUIRY", "representative-2026", "2026-08-26", "OWNER_CONFIRMED"),
  claim("legacy-certification", "instant-coffee-100g", "certification", "Organic certified", "legacy-website-2021", "2021-06-14", "LEGACY_SOURCE"),
  claim("representative-certification", "instant-coffee-100g", "certification", "No current certification claim is being made", "representative-2026", "2026-08-26", "OWNER_CONFIRMED"),
  claim("legacy-private-label", "instant-coffee-100g", "instantCoffeePrivateLabel", true, "legacy-website-2021", "2021-06-14", "LEGACY_SOURCE"),
  claim("catalogue-private-label", "instant-coffee-100g", "instantCoffeePrivateLabel", true, "catalogue-2023", "2023-09-08", "LEGACY_SOURCE"),
  claim("representative-private-label", "instant-coffee-100g", "instantCoffeePrivateLabel", true, "representative-2026", "2026-08-26", "OWNER_CONFIRMED"),
];

const accepted = (
  field: ContinuityField,
  acceptedValue: unknown,
): ClaimResolution => ({
  id: `seed-accepted-${field}`,
  subjectId: field.startsWith("instantCoffee") ? "instant-coffee-100g" : business.slug,
  field,
  action: "USE_VALUE",
  acceptedValue,
  supportingSourceIds: ["representative-2026"],
  explanation: "Previously accepted fictional demonstration information.",
  state: "HUMAN_ACCEPTED",
  resolvedBy: "HUMAN",
  resolvedAt: "2026-08-26T00:00:00.000Z",
});

export const stableProducts = business.products.filter(
  (product) => product.id !== "instant-coffee-100g",
);

export const initialContinuityState: ContinuityState = {
  businessId: business.slug,
  sources: continuitySources,
  claims: continuityClaims,
  resolutions: [
    accepted("businessName", business.name),
    accepted("businessDescription", business.description),
    accepted("country", business.country),
    accepted("sector", business.sector),
    accepted("operatingStatus", "OPERATING"),
    accepted("tradeEmail", business.email),
    accepted("capabilities", business.capabilities),
    accepted("marketsServed", business.capabilities.marketsServed),
    accepted("primaryWorkflow", business.workflow),
    accepted("stableOfferings", stableProducts),
    accepted("instantCoffeeStatus", "CURRENTLY_AVAILABLE"),
    accepted("instantCoffeePrivateLabel", true),
  ],
  updatedAt: "2026-08-26T00:00:00.000Z",
};

export const recommendedResolutionProposals = [
  {
    field: "tradePhone",
    action: "USE_VALUE",
    proposedValue: business.phone,
    supportingSourceIds: ["representative-2026", "public-evidence-2026"],
    explanation: "Use the value present in the most recent representative-attested and public evidence.",
  },
  {
    field: "instantCoffeeMoq",
    action: "USE_VALUE",
    proposedValue: 2500,
    supportingSourceIds: ["representative-2026"],
    explanation: "Use the most recent representative-attested minimum order quantity.",
  },
  {
    field: "japanAvailability",
    action: "USE_VALUE",
    proposedValue: "AVAILABLE_BY_INQUIRY",
    supportingSourceIds: ["representative-2026"],
    explanation: "Publish only the qualified representative statement: available by inquiry.",
  },
  {
    field: "certification",
    action: "EXCLUDE",
    supportingSourceIds: ["legacy-website-2021", "representative-2026"],
    explanation: "The old certification wording lacks current support and should not be published.",
  },
] as const;

export const prePivotPassportVersion = createPassportVersion(
  initialContinuityState,
  [],
  new Date("2026-08-26T00:00:00.000Z"),
  1,
);
