import { business } from "./demo-data";
import type { BusinessProfile, Product } from "./types";

export interface OfferingSearchInput {
  query?: string;
  destinationCountry?: string;
  privateLabelRequired?: boolean;
  maxResults?: number;
}

export function getBusinessStatus(profile: BusinessProfile = business) {
  return {
    businessId: profile.slug,
    name: profile.name,
    status: profile.status,
    country: profile.country,
    sector: profile.sector,
    lastConfirmed: profile.lastAttested,
    evidenceState: profile.evidenceState,
    capabilities: {
      b2bInquiries: profile.capabilities.b2bInquiries,
      exports: profile.capabilities.exports,
      samples: profile.capabilities.samples,
      privateLabel: profile.capabilities.privateLabel,
    },
    note: "Fictional demonstration data attested by the demo business representative.",
  };
}

function isCurrentlyEligible(product: Product) {
  return (
    product.status === "CURRENTLY_AVAILABLE" &&
    (product.evidenceState === "OWNER_CONFIRMED" ||
      product.evidenceState === "PUBLIC_EVIDENCE")
  );
}

export function searchCurrentOfferings(
  input: OfferingSearchInput = {},
  profile: BusinessProfile = business,
) {
  const query = input.query?.trim().toLocaleLowerCase() ?? "";
  const destination = input.destinationCountry?.trim().toLocaleLowerCase() ?? "";
  const requestedLimit = Number.isFinite(input.maxResults)
    ? Math.trunc(input.maxResults ?? 5)
    : 5;
  const maxResults = Math.min(5, Math.max(1, requestedLimit));

  return profile.products
    .filter(isCurrentlyEligible)
    .filter((product) => {
      if (!query) return true;
      return `${product.name} ${product.description} ${product.packaging}`
        .toLocaleLowerCase()
        .includes(query);
    })
    .filter(
      (product) => !input.privateLabelRequired || product.privateLabel,
    )
    .filter((product) => {
      if (!destination) return true;
      return product.exportMarkets.some(
        (market) => market.toLocaleLowerCase() === destination,
      );
    })
    .slice(0, maxResults)
    .map((product) => ({
      productId: product.id,
      name: product.name,
      description: product.description,
      moq: product.moq,
      privateLabel: product.privateLabel,
      evidenceState: product.evidenceState,
      lastConfirmed: product.lastConfirmed,
    }));
}
