import type { BusinessProfile } from "./types";

export const DEMO_LEGACY_URL = "https://legacy.rwenzoriharvest.example";

export const business: BusinessProfile = {
  slug: "rwenzori-harvest",
  name: "Rwenzori Harvest Coffee Ltd",
  description:
    "A Ugandan coffee producer and export supplier serving business buyers with green, roasted, ground, instant, and single-serve coffee formats.",
  country: "Uganda",
  sector: "Coffee production and export",
  status: "ACTIVE",
  lastAttested: "2026-08-26",
  email: "trade@rwenzoriharvest.example",
  phone: "+256 780 240 826",
  capabilities: {
    b2bInquiries: true,
    exports: true,
    samples: true,
    privateLabel: true,
    marketsServed: ["East Africa", "Japan", "European Union", "United Kingdom"],
  },
  workflow: "REQUEST_QUOTATION",
  evidenceState: "OWNER_CONFIRMED",
  products: [
    {
      id: "arabica-green-60kg",
      name: "Arabica Green Coffee",
      description:
        "Screened unroasted Arabica lots for roasters and wholesale buyers.",
      status: "CURRENTLY_AVAILABLE",
      packaging: "60 kg export-grade lined jute bags",
      moq: "10 bags / 600 kg",
      minimumQuantity: 600,
      privateLabel: false,
      exportMarkets: ["Japan", "European Union", "United Kingdom"],
      certifications:
        "Lot documentation and available quality records shared during quotation; no third-party certification is claimed in this demo.",
      evidenceState: "OWNER_CONFIRMED",
      lastConfirmed: "2026-08-26",
    },
    {
      id: "roasted-arabica-1kg",
      name: "Roasted Arabica Beans",
      description:
        "Whole-bean Arabica with roast profile and packaging options for hospitality and retail partners.",
      status: "CURRENTLY_AVAILABLE",
      packaging: "250 g, 500 g, or 1 kg valve bags",
      moq: "500 retail packs",
      minimumQuantity: 500,
      privateLabel: true,
      exportMarkets: ["Uganda", "Japan", "East Africa", "United Kingdom"],
      certifications:
        "Product specifications are owner-confirmed demonstration data; buyer-required documentation is reviewed per order.",
      evidenceState: "OWNER_CONFIRMED",
      lastConfirmed: "2026-08-26",
    },
    {
      id: "ground-arabica-250g",
      name: "Ground Arabica Coffee",
      description:
        "Ground Arabica offered in multiple grind sizes for retail and food-service distribution.",
      status: "CURRENTLY_AVAILABLE",
      packaging: "250 g or 500 g sealed valve bags",
      moq: "1,000 retail packs",
      minimumQuantity: 1000,
      privateLabel: true,
      exportMarkets: ["Uganda", "Japan", "East Africa"],
      certifications:
        "No unsupported certification claims; documentation is confirmed during buyer review.",
      evidenceState: "OWNER_CONFIRMED",
      lastConfirmed: "2026-08-26",
    },
    {
      id: "instant-coffee-100g",
      name: "Instant Coffee",
      description:
        "Soluble coffee format for institutional and retail distribution programs.",
      status: "SEASONAL",
      packaging: "100 g jars or bulk food-service pouches",
      moq: "2,500 retail units",
      minimumQuantity: 2500,
      privateLabel: true,
      exportMarkets: ["Uganda", "East Africa"],
      certifications:
        "Availability and destination eligibility require confirmation at quotation.",
      evidenceState: "OWNER_CONFIRMED",
      lastConfirmed: "2026-08-26",
    },
    {
      id: "drip-coffee-10pack",
      name: "Drip Coffee Packs",
      description:
        "Single-cup pour-over sachets designed for travel, gifting, and compact retail shelves.",
      status: "CURRENTLY_AVAILABLE",
      packaging: "Box of 10 individually wrapped drip bags",
      moq: "2,000 boxes",
      minimumQuantity: 2000,
      privateLabel: true,
      exportMarkets: ["Japan", "Uganda", "East Africa", "United Kingdom"],
      certifications:
        "Export documentation and label requirements are scoped with the buyer before production.",
      evidenceState: "OWNER_CONFIRMED",
      lastConfirmed: "2026-08-26",
    },
  ],
};

export const assessment = {
  business: business.name,
  websiteStatus: "Reachable",
  digitalFreshness: "Low",
  latestVisibleUpdate: "2021",
  currentBusinessStatus: "Not yet attested",
  contactFlow: "Potentially outdated",
  productsDetected: 12,
  productsConfirmedCurrent: 0,
  conflicts: 3,
  recentPublicEvidence: "Found",
  recommendedWorkflow: "B2B product inquiry",
};

export const legacyContacts = [
  {
    value: "+256 700 111 201",
    label: "Phone listed on legacy website",
    evidenceState: "CONFLICT" as const,
  },
  {
    value: business.email,
    label: "Current trade email",
    evidenceState: "OWNER_CONFIRMED" as const,
  },
  {
    value: business.phone,
    label: "Current trade phone",
    evidenceState: "OWNER_CONFIRMED" as const,
  },
];
