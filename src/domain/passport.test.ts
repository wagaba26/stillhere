import { describe, expect, it } from "vitest";
import {
  acceptResolution,
  editResolution,
  stageResolutionProposal,
  stageResolutionProposals,
} from "./continuity";
import {
  initialContinuityState,
  prePivotPassportVersion,
  recommendedResolutionProposals,
} from "./continuity-demo";
import { business } from "./demo-data";
import {
  createPassportVersion,
  derivePassport,
  destinationStatusFor,
  legacyAttestationToPassportVersion,
  searchPassportOfferings,
} from "./passport";

function resolvedDemo() {
  const staged = stageResolutionProposals(
    initialContinuityState,
    recommendedResolutionProposals,
    new Date("2026-08-26T08:00:00.000Z"),
  );
  return staged.resolutions
    .filter((resolution) => resolution.state === "AGENT_PROPOSED")
    .reduce((state, resolution, index) => {
      const now = new Date(`2026-08-26T08:0${index + 1}:00.000Z`);
      return resolution.field === "instantCoffeeMoq"
        ? editResolution(state, resolution.id, 2500, now)
        : acceptResolution(state, resolution.id, now);
    }, staged);
}

describe("Business Passport derivation", () => {
  it("provides a safe deterministic v1 fallback without unresolved facts", () => {
    expect(prePivotPassportVersion.version).toBe(1);
    expect(prePivotPassportVersion.passport.profile.phone).toBe("");
    expect(
      prePivotPassportVersion.passport.profile.products.map((product) => product.id),
    ).not.toContain("instant-coffee-100g");
  });

  it("projects old attestation storage without leaking unreviewed Instant Coffee", () => {
    const legacy = legacyAttestationToPassportVersion(
      {
        identity: {
          name: business.name,
          description: business.description,
          country: business.country,
          sector: business.sector,
        },
        contactStates: {
          [business.email]: "CURRENT",
          [business.phone]: "UNKNOWN",
        },
        productStates: { "instant-coffee-100g": "CURRENTLY_AVAILABLE" },
        capabilities: {
          b2bInquiries: true,
          exports: true,
          samples: true,
          privateLabel: true,
        },
        marketsServed: ["Uganda"],
        workflow: "REQUEST_QUOTATION",
        attestedAt: "2026-08-20T10:00:00.000Z",
      },
      business,
    );
    expect(legacy.passport.profile.email).toBe(business.email);
    expect(legacy.passport.profile.phone).toBe("");
    expect(legacy.passport.profile.products.map((product) => product.id)).not.toContain(
      "instant-coffee-100g",
    );
  });

  it("excludes unresolved values from the initial preview", () => {
    const passport = derivePassport(initialContinuityState);
    expect(passport.profile.phone).toBe("");
    expect(passport.profile.products.map((product) => product.id)).not.toContain(
      "instant-coffee-100g",
    );
    expect(passport.omittedFields).toEqual([
      "tradePhone",
      "instantCoffeeMoq",
      "japanAvailability",
      "certification",
    ]);
  });

  it("derives phone, MOQ, and qualified Japan status only after human decisions", () => {
    const passport = derivePassport(resolvedDemo());
    const instant = passport.profile.products.find(
      (product) => product.id === "instant-coffee-100g",
    );
    expect(passport.profile.phone).toBe("+256 780 240 826");
    expect(instant?.minimumQuantity).toBe(2500);
    expect(instant?.exportMarkets).not.toContain("Japan");
    expect(destinationStatusFor(passport, "instant-coffee-100g", "Japan")).toBe(
      "AVAILABLE_BY_INQUIRY",
    );
    expect(instant?.certifications).not.toContain("Organic certified");
    expect(passport.omittedFields).toEqual(["certification"]);
  });

  it("keeps unresolved destination status out of accepted search", () => {
    const staged = stageResolutionProposals(
      initialContinuityState,
      recommendedResolutionProposals,
      new Date("2026-08-26T08:00:00.000Z"),
    );
    const phone = staged.resolutions.find(
      (resolution) => resolution.field === "tradePhone" && resolution.state === "AGENT_PROPOSED",
    )!;
    const moq = staged.resolutions.find(
      (resolution) => resolution.field === "instantCoffeeMoq" && resolution.state === "AGENT_PROPOSED",
    )!;
    const withPhone = acceptResolution(staged, phone.id);
    const withMoq = acceptResolution(withPhone, moq.id);
    const passport = derivePassport(withMoq);
    expect(
      searchPassportOfferings(
        { destinationCountry: "Japan", query: "Instant" },
        passport,
      ),
    ).toEqual([]);
  });

  it("does not let a later agent proposal overwrite the human Passport", () => {
    const resolved = resolvedDemo();
    const before = derivePassport(resolved);
    const later = stageResolutionProposal(
      resolved,
      recommendedResolutionProposals[0],
      new Date("2026-08-26T10:00:00.000Z"),
    );
    expect(derivePassport(later).profile.phone).toBe(before.profile.phone);
  });

  it("creates incrementing immutable Passport snapshots", () => {
    const state = resolvedDemo();
    const first = createPassportVersion(
      state,
      [],
      new Date("2026-08-26T09:00:00.000Z"),
    );
    const second = createPassportVersion(
      state,
      [first],
      new Date("2026-08-26T10:00:00.000Z"),
    );
    state.resolutions[0].acceptedValue = "Changed later";
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(first.passport.profile.name).toBe("Rwenzori Harvest Coffee Ltd");
  });
});
