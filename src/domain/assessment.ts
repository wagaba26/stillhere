import { assessment as seededAssessment, DEMO_LEGACY_URL } from "./demo-data";

export type AssessmentSource = "SEEDED_DEMO" | "PUBLIC_PAGE_OBSERVATION";

export interface WebsiteAssessment {
  requestedUrl: string;
  finalUrl: string;
  observedAt: string;
  source: AssessmentSource;
  business: string;
  websiteStatus: string;
  digitalFreshness: string;
  latestVisibleUpdate: string;
  currentBusinessStatus: string;
  contactFlow: string;
  productsDetected: number;
  productsConfirmedCurrent: number;
  conflicts: number | string;
  recentPublicEvidence: string;
  recommendedWorkflow: string;
  summary: string;
  httpStatus: number;
  transferredBytes: number;
  redirectCount: number;
  limitations: string[];
}

export interface PublicPageObservation {
  requestedUrl: string;
  finalUrl: string;
  observedAt: string;
  httpStatus: number;
  html: string;
  transferredBytes: number;
  redirectCount: number;
}

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(value: string) {
  const decodeCodePoint = (code: number) =>
    Number.isInteger(code) && code >= 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
      ? String.fromCodePoint(code)
      : "�";
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      decodeCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      decodeCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) =>
      ENTITY_MAP[name.toLowerCase()] ?? entity,
    );
}

function cleanText(value: string, maxLength = 180) {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function attributeValue(tag: string, name: string) {
  const match = tag.match(
    new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
}

function metaContent(html: string, key: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name =
      attributeValue(tag, "name") || attributeValue(tag, "property");
    if (name.toLowerCase() === key.toLowerCase()) {
      return cleanText(attributeValue(tag, "content"));
    }
  }
  return "";
}

function hostnameLabel(url: string) {
  const hostname = new URL(url).hostname.replace(/^www\./i, "");
  const firstLabel = hostname.split(".")[0] || hostname;
  return firstLabel
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function observedBusinessName(html: string, finalUrl: string) {
  const siteName =
    metaContent(html, "og:site_name") || metaContent(html, "application-name");
  if (siteName.length >= 2) return siteName.slice(0, 120);

  const title = cleanText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const titleLead = title.split(/\s(?:[-|·—])\s/)[0]?.trim();
  if (titleLead && titleLead.length >= 2) return titleLead.slice(0, 120);
  return hostnameLabel(finalUrl) || "Observed website";
}

function visibleText(html: string) {
  return cleanText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " "),
    500_000,
  );
}

function latestObservedYear(text: string, observedAt: string) {
  const currentYear = new Date(observedAt).getUTCFullYear();
  const years = [...text.matchAll(/\b(19\d{2}|20\d{2})\b/g)]
    .map((match) => Number(match[1]))
    .filter((year) => year <= currentYear + 1);
  return years.length ? Math.max(...years) : null;
}

function countProductSignals(html: string) {
  const jsonLd = html.match(/"@type"\s*:\s*"Product"/gi)?.length ?? 0;
  const microdata = html.match(/itemtype\s*=\s*["'][^"']*schema\.org\/Product["']/gi)?.length ?? 0;
  return Math.min(jsonLd + microdata, 99);
}

export function createDemoAssessment(observedAt = new Date().toISOString()): WebsiteAssessment {
  return {
    ...seededAssessment,
    requestedUrl: DEMO_LEGACY_URL,
    finalUrl: DEMO_LEGACY_URL,
    observedAt,
    source: "SEEDED_DEMO",
    httpStatus: 200,
    transferredBytes: 0,
    redirectCount: 0,
    summary:
      "The seeded legacy site appears stale. A representative must attest whether its business information is still current.",
    limitations: [
      "This result is deterministic fictional challenge data; no network request was made.",
      "Information Attestation is not identity, legal-status, or certification verification.",
    ],
  };
}

export function analyzePublicPage(observation: PublicPageObservation): WebsiteAssessment {
  const text = visibleText(observation.html);
  const year = latestObservedYear(text, observation.observedAt);
  const currentYear = new Date(observation.observedAt).getUTCFullYear();
  const productSignals = countProductSignals(observation.html);
  const hasContactRoute =
    /<form\b/i.test(observation.html) ||
    /href\s*=\s*["'](?:mailto:|tel:)/i.test(observation.html) ||
    /\b(contact|enquir(?:y|ies)|inquir(?:y|ies)|request a quote)\b/i.test(text);

  const digitalFreshness = !year
    ? "Unclear"
    : year >= currentYear - 1
      ? "Recent signal observed"
      : year >= currentYear - 4
        ? "Mixed / ageing"
        : "Low";

  const websiteStatus =
    observation.httpStatus < 400
      ? "Reachable"
      : `Reached (HTTP ${observation.httpStatus})`;

  return {
    requestedUrl: observation.requestedUrl,
    finalUrl: observation.finalUrl,
    observedAt: observation.observedAt,
    source: "PUBLIC_PAGE_OBSERVATION",
    business: observedBusinessName(observation.html, observation.finalUrl),
    websiteStatus,
    digitalFreshness,
    latestVisibleUpdate: year ? `${year} observed in page text` : "No reliable year observed",
    currentBusinessStatus: "Not attested",
    contactFlow: hasContactRoute
      ? "Contact route observed — currentness unknown"
      : "No explicit contact route observed",
    productsDetected: productSignals,
    productsConfirmedCurrent: 0,
    conflicts: "Not assessed from one page",
    recentPublicEvidence:
      year && year >= currentYear - 1
        ? "Same-page recency signal found"
        : "Not established",
    recommendedWorkflow:
      productSignals > 0
        ? "Product information attestation"
        : hasContactRoute
          ? "Business contact attestation"
          : "Information attestation",
    summary:
      "This is a bounded observation of one public page. It describes website signals only and does not establish whether the organization is active.",
    httpStatus: observation.httpStatus,
    transferredBytes: observation.transferredBytes,
    redirectCount: observation.redirectCount,
    limitations: [
      "Only the final public HTML response was inspected; scripts, images, documents, and linked pages were not loaded.",
      "Years, contact routes, and Product schema are observable signals, not proof that information is current.",
      "No business identity, ownership, legal status, product availability, or certification was verified.",
    ],
  };
}
