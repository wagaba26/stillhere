import { describe, expect, it } from "vitest";
import {
  acceptResolution,
  detectConflicts,
  editResolution,
  getFieldsNeedingReview,
  getUnresolvedClaims,
  getUnsupportedClaims,
  groupClaimsByField,
  latestHumanDecision,
  latestHumanResolution,
  leaveResolutionUnresolved,
  rejectResolution,
  stageResolutionProposal,
  stageResolutionProposals,
  summarizeContinuityState,
} from "./continuity";
import {
  continuityClaims,
  initialContinuityState,
  recommendedResolutionProposals,
} from "./continuity-demo";

describe("Continuity Ledger domain", () => {
  it("groups claims and does not create false conflicts for agreement", () => {
    const groups = groupClaimsByField(continuityClaims);
    expect(groups.tradePhone).toHaveLength(4);
    expect(groups.instantCoffeePrivateLabel).toHaveLength(3);
    expect(detectConflicts(groups.instantCoffeePrivateLabel)).toEqual([]);
  });

  it("detects three competing fields and one unsupported certification claim", () => {
    expect(detectConflicts(continuityClaims)).toEqual([
      "tradePhone",
      "instantCoffeeMoq",
      "japanAvailability",
    ]);
    expect(getUnsupportedClaims(continuityClaims).map((claim) => claim.id)).toEqual([
      "legacy-certification",
    ]);
  });

  it("starts with the four deliberate review scenarios unresolved", () => {
    expect(getUnresolvedClaims(initialContinuityState)).toEqual([
      "tradePhone",
      "instantCoffeeMoq",
      "japanAvailability",
      "certification",
    ]);
    expect(summarizeContinuityState(initialContinuityState)).toMatchObject({
      sources: 4,
      conflicts: 3,
      unresolved: 4,
      unsupportedClaims: 1,
    });
  });

  it("stages proposals without accepting or mutating the original state", () => {
    const original = structuredClone(initialContinuityState);
    const staged = stageResolutionProposals(
      initialContinuityState,
      [...recommendedResolutionProposals],
      new Date("2026-08-26T08:00:00.000Z"),
    );
    expect(initialContinuityState).toEqual(original);
    expect(staged.resolutions.slice(-4).every((item) => item.state === "AGENT_PROPOSED")).toBe(true);
    expect(getUnresolvedClaims(staged)).toHaveLength(4);
  });

  it("rejects invented fields, unknown sources, and unsupported proposal values", () => {
    expect(() =>
      stageResolutionProposal(initialContinuityState, {
        ...recommendedResolutionProposals[0],
        field: "invented" as "tradePhone",
      }),
    ).toThrow("not reviewable");
    expect(() =>
      stageResolutionProposal(initialContinuityState, {
        ...recommendedResolutionProposals[0],
        supportingSourceIds: ["unknown-source"],
      }),
    ).toThrow("Unknown source ID");
    expect(() =>
      stageResolutionProposal(initialContinuityState, {
        ...recommendedResolutionProposals[0],
        proposedValue: "+256 999 999 999",
      }),
    ).toThrow("not present in a cited source");
  });

  it("supports human acceptance, edit, rejection, and later proposals without overwrite", () => {
    const staged = stageResolutionProposals(
      initialContinuityState,
      [...recommendedResolutionProposals],
      new Date("2026-08-26T08:00:00.000Z"),
    );
    const phoneProposal = staged.resolutions.find(
      (item) => item.field === "tradePhone" && item.state === "AGENT_PROPOSED",
    )!;
    const moqProposal = staged.resolutions.find(
      (item) => item.field === "instantCoffeeMoq" && item.state === "AGENT_PROPOSED",
    )!;
    const japanProposal = staged.resolutions.find(
      (item) => item.field === "japanAvailability" && item.state === "AGENT_PROPOSED",
    )!;

    const accepted = acceptResolution(
      staged,
      phoneProposal.id,
      new Date("2026-08-26T08:05:00.000Z"),
    );
    const edited = editResolution(
      accepted,
      moqProposal.id,
      2500,
      new Date("2026-08-26T08:06:00.000Z"),
    );
    const rejected = rejectResolution(
      edited,
      japanProposal.id,
      new Date("2026-08-26T08:07:00.000Z"),
    );

    expect(latestHumanResolution(rejected, "tradePhone")?.acceptedValue).toBe(
      "+256 780 240 826",
    );
    expect(latestHumanResolution(rejected, "instantCoffeeMoq")?.state).toBe(
      "HUMAN_EDITED",
    );
    expect(latestHumanResolution(rejected, "japanAvailability")).toBeUndefined();
    expect(latestHumanDecision(rejected, "japanAvailability")?.state).toBe(
      "HUMAN_REJECTED",
    );
    expect(getFieldsNeedingReview(rejected)).not.toContain("japanAvailability");

    const laterProposal = stageResolutionProposal(
      rejected,
      recommendedResolutionProposals[0],
      new Date("2026-08-26T09:00:00.000Z"),
    );
    expect(latestHumanResolution(laterProposal, "tradePhone")?.acceptedValue).toBe(
      "+256 780 240 826",
    );
    expect(
      laterProposal.resolutions.filter(
        (item) => item.field === "tradePhone" && item.state === "AGENT_PROPOSED",
      ),
    ).toHaveLength(1);
  });

  it("lets a later human rejection or unresolved decision supersede an older acceptance", () => {
    const staged = stageResolutionProposal(
      initialContinuityState,
      recommendedResolutionProposals[0],
      new Date("2026-08-26T08:00:00.000Z"),
    );
    const accepted = acceptResolution(
      staged,
      staged.resolutions.at(-1)!.id,
      new Date("2026-08-26T08:05:00.000Z"),
    );

    const rejectedProposal = stageResolutionProposal(
      accepted,
      recommendedResolutionProposals[0],
      new Date("2026-08-26T09:00:00.000Z"),
    );
    const rejected = rejectResolution(
      rejectedProposal,
      rejectedProposal.resolutions.at(-1)!.id,
      new Date("2026-08-26T09:05:00.000Z"),
    );
    expect(latestHumanResolution(rejected, "tradePhone")).toBeUndefined();

    const unresolvedProposal = stageResolutionProposal(
      accepted,
      recommendedResolutionProposals[0],
      new Date("2026-08-26T10:00:00.000Z"),
    );
    const unresolved = leaveResolutionUnresolved(
      unresolvedProposal,
      unresolvedProposal.resolutions.at(-1)!.id,
      new Date("2026-08-26T10:05:00.000Z"),
    );
    expect(latestHumanResolution(unresolved, "tradePhone")).toBeUndefined();
    expect(latestHumanDecision(unresolved, "tradePhone")?.state).toBe(
      "UNRESOLVED",
    );
    expect(getUnresolvedClaims(unresolved)).toContain("tradePhone");
    expect(getFieldsNeedingReview(unresolved)).not.toContain("tradePhone");
  });
});
