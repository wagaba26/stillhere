import {
  latestHumanResolution,
  reviewableContinuityFields,
} from "./continuity";
import type {
  BusinessPassport,
  BusinessProfile,
  ClaimResolution,
  ContinuityField,
  ContinuityState,
  DestinationStatus,
  PassportVersion,
  PrimaryWorkflow,
  Product,
} from "./types";

export interface PassportOfferingSearchInput {
  query?: string;
  destinationCountry?: string;
  privateLabelRequired?: boolean;
  maxResults?: number;
}

const workflowValues = new Set<PrimaryWorkflow>([
  "REQUEST_QUOTATION",
  "REQUEST_SAMPLES",
  "DISTRIBUTION_INQUIRY",
  "PRODUCT_AVAILABILITY_INQUIRY",
]);

const productStatuses = new Set([
  "CURRENTLY_AVAILABLE",
  "SEASONAL",
  "DISCONTINUED",
  "UNKNOWN",
]);

const instantCoffeeTemplate = {
  id: "instant-coffee-100g",
  name: "Instant Coffee",
  description:
    "Soluble coffee format for institutional and retail distribution programs.",
  packaging: "100 g jars or bulk food-service pouches",
} as const;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<Product>;
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.description === "string" &&
    typeof product.packaging === "string" &&
    typeof product.moq === "string" &&
    typeof product.minimumQuantity === "number" &&
    typeof product.privateLabel === "boolean" &&
    Array.isArray(product.exportMarkets) &&
    typeof product.certifications === "string" &&
    typeof product.status === "string" &&
    productStatuses.has(product.status) &&
    typeof product.evidenceState === "string" &&
    typeof product.lastConfirmed === "string"
  );
}

function humanResolutions(state: ContinuityState) {
  const selected = new Map<ContinuityField, ClaimResolution>();
  for (const field of Object.keys(
    Object.fromEntries(state.resolutions.map((resolution) => [resolution.field, true])),
  ) as ContinuityField[]) {
    const resolution = latestHumanResolution(state, field);
    if (resolution) selected.set(field, resolution);
  }
  return selected;
}

function acceptedValue<T>(
  selected: Map<ContinuityField, ClaimResolution>,
  field: ContinuityField,
) {
  const resolution = selected.get(field);
  if (!resolution || resolution.action === "EXCLUDE") return undefined;
  return resolution.acceptedValue as T | undefined;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function booleanValue(value: unknown) {
  return value === true;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function buildDestinationStatuses(products: Product[]) {
  return Object.fromEntries(
    products.map((product) => [
      product.id,
      Object.fromEntries(
        product.exportMarkets.map((market) => [market, "SUPPORTED" as const]),
      ),
    ]),
  ) as Record<string, Record<string, DestinationStatus>>;
}

export function derivePassport(state: ContinuityState): BusinessPassport {
  const selected = humanResolutions(state);
  const stableOfferingsValue = acceptedValue<unknown[]>(selected, "stableOfferings");
  const products = Array.isArray(stableOfferingsValue)
    ? stableOfferingsValue.filter(isProduct).map(clone)
    : [];
  const destinationStatuses = buildDestinationStatuses(products);

  const instantStatus = acceptedValue<Product["status"]>(
    selected,
    "instantCoffeeStatus",
  );
  const instantMoq = acceptedValue<number>(selected, "instantCoffeeMoq");
  const instantPrivateLabel = acceptedValue<boolean>(
    selected,
    "instantCoffeePrivateLabel",
  );
  const japanAvailability = acceptedValue<DestinationStatus>(
    selected,
    "japanAvailability",
  );
  const certification = acceptedValue<string>(selected, "certification");
  const representativeAttestedAt = state.sources
    .filter((source) => source.type === "REPRESENTATIVE")
    .map((source) => source.observedAt)
    .sort((left, right) => right.localeCompare(left))[0];

  if (
    instantStatus &&
    productStatuses.has(instantStatus) &&
    typeof instantMoq === "number" &&
    Number.isInteger(instantMoq) &&
    instantMoq > 0 &&
    typeof instantPrivateLabel === "boolean"
  ) {
    const instantProduct: Product = {
      ...instantCoffeeTemplate,
      status: instantStatus,
      moq: `${instantMoq.toLocaleString("en")} retail units`,
      minimumQuantity: instantMoq,
      privateLabel: instantPrivateLabel,
      exportMarkets: ["Uganda", "East Africa"],
      certifications:
        typeof certification === "string" && certification.trim()
          ? certification.trim()
          : "No certification claim is published in this Passport.",
      evidenceState: "OWNER_CONFIRMED",
      lastConfirmed: representativeAttestedAt ?? state.updatedAt.slice(0, 10),
    };
    products.push(instantProduct);
    destinationStatuses[instantProduct.id] = {
      Uganda: "SUPPORTED",
      "East Africa": "SUPPORTED",
      ...(japanAvailability ? { Japan: japanAvailability } : {}),
    };
  }

  const capabilitiesValue = acceptedValue<Partial<BusinessProfile["capabilities"]>>(
    selected,
    "capabilities",
  );
  const workflowValue = acceptedValue<PrimaryWorkflow>(selected, "primaryWorkflow");
  const acceptedFields = [...selected.entries()]
    .filter(([, resolution]) => resolution.action === "USE_VALUE")
    .map(([field]) => field);
  const omittedFields = reviewableContinuityFields.filter((field) => {
    const resolution = selected.get(field);
    return !resolution || resolution.action === "EXCLUDE";
  });
  const generatedFromResolutionIds = [...selected.values()].map(
    (resolution) => resolution.id,
  );

  const profile: BusinessProfile = {
    slug: state.businessId,
    name: stringValue(acceptedValue(selected, "businessName"), "Unpublished business"),
    description: stringValue(acceptedValue(selected, "businessDescription")),
    country: stringValue(acceptedValue(selected, "country")),
    sector: stringValue(acceptedValue(selected, "sector")),
    status:
      acceptedValue(selected, "operatingStatus") === "OPERATING"
        ? "ACTIVE"
        : "NOT_ATTESTED",
    lastAttested: representativeAttestedAt ?? state.updatedAt.slice(0, 10),
    email: stringValue(acceptedValue(selected, "tradeEmail")),
    phone: stringValue(acceptedValue(selected, "tradePhone")),
    capabilities: {
      b2bInquiries: booleanValue(capabilitiesValue?.b2bInquiries),
      exports: booleanValue(capabilitiesValue?.exports),
      samples: booleanValue(capabilitiesValue?.samples),
      privateLabel: booleanValue(capabilitiesValue?.privateLabel),
      marketsServed: stringArray(acceptedValue(selected, "marketsServed")),
    },
    workflow:
      workflowValue && workflowValues.has(workflowValue)
        ? workflowValue
        : "REQUEST_QUOTATION",
    evidenceState: "OWNER_CONFIRMED",
    products,
  };

  return {
    businessId: state.businessId,
    profile,
    destinationStatuses,
    acceptedFields,
    omittedFields,
    generatedFromResolutionIds,
    representativeAttestedAt,
  };
}

export function createPassportVersion(
  state: ContinuityState,
  previousVersions: readonly PassportVersion[] = [],
  now = new Date(),
): PassportVersion {
  const version =
    Math.max(0, ...previousVersions.map((item) => item.version)) + 1;
  const passport = derivePassport(state);
  const publishedAt = now.toISOString();
  return {
    id: `passport-v${version}-${now.getTime()}`,
    version,
    generatedFromResolutionIds: [...passport.generatedFromResolutionIds],
    publishedAt,
    passport: clone(passport),
  };
}

export function getBusinessPassport(passport: BusinessPassport) {
  const { profile } = passport;
  return {
    businessId: passport.businessId,
    name: profile.name,
    operatingStatus:
      profile.status === "ACTIVE"
        ? "Representative reports business is operating"
        : "Not attested",
    country: profile.country,
    sector: profile.sector,
    lastRepresentativeAttestation: passport.representativeAttestedAt ?? null,
    contact: {
      email: profile.email || null,
      phone: profile.phone || null,
    },
    capabilities: profile.capabilities,
    offerings: profile.products
      .filter((product) => product.status === "CURRENTLY_AVAILABLE")
      .map((product) => ({
        productId: product.id,
        name: product.name,
        minimumQuantity: product.minimumQuantity,
        privateLabel: product.privateLabel,
      })),
    evidenceState: "Representative attested",
    note: "Fictional challenge data; no identity, registry, KYC, or certification verification occurred.",
  };
}

export function destinationStatusFor(
  passport: BusinessPassport,
  productId: string,
  destinationCountry: string,
) {
  const destination = destinationCountry.trim().toLocaleLowerCase();
  const statuses = passport.destinationStatuses[productId] ?? {};
  const match = Object.entries(statuses).find(
    ([country]) => country.toLocaleLowerCase() === destination,
  );
  return match?.[1] ?? "UNKNOWN";
}

export function isOfferingPublishable(
  passport: BusinessPassport,
  productId: string,
  destinationCountry?: string,
) {
  const product = passport.profile.products.find((item) => item.id === productId);
  if (!product || product.status !== "CURRENTLY_AVAILABLE") return false;
  if (!destinationCountry?.trim()) return true;
  const status = destinationStatusFor(passport, productId, destinationCountry);
  return status === "SUPPORTED" || status === "AVAILABLE_BY_INQUIRY";
}

export function searchPassportOfferings(
  input: PassportOfferingSearchInput,
  passport: BusinessPassport,
) {
  const query = input.query?.trim().toLocaleLowerCase() ?? "";
  const destination = input.destinationCountry?.trim() ?? "";
  const requestedLimit = Number.isFinite(input.maxResults)
    ? Math.trunc(input.maxResults ?? 5)
    : 5;
  const maxResults = Math.min(5, Math.max(1, requestedLimit));

  return passport.profile.products
    .filter((product) => isOfferingPublishable(passport, product.id, destination))
    .filter((product) => {
      if (!query) return true;
      return `${product.name} ${product.description} ${product.packaging}`
        .toLocaleLowerCase()
        .includes(query);
    })
    .filter(
      (product) => !input.privateLabelRequired || product.privateLabel,
    )
    .slice(0, maxResults)
    .map((product) => ({
      productId: product.id,
      name: product.name,
      description: product.description,
      moq: product.moq,
      privateLabel: product.privateLabel,
      evidenceState: product.evidenceState,
      lastConfirmed: product.lastConfirmed,
      ...(destination
        ? {
            destinationStatus: destinationStatusFor(
              passport,
              product.id,
              destination,
            ),
          }
        : {}),
    }));
}
