import { describe, expect, it } from "vitest";
import {
  acceptResolution,
  editResolution,
  stageResolutionProposal,
  stageResolutionProposals,
} from "./continuity";
import {
  initialContinuityState,
  recommendedResolutionProposals,
} from "./continuity-demo";
import {
  createPassportVersion,
  derivePassport,
  destinationStatusFor,
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
