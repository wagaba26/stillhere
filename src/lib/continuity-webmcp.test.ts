import { describe, expect, it } from "vitest";
import {
  acceptResolution,
  latestHumanResolution,
  stageResolutionProposals,
} from "@/domain/continuity";
import {
  initialContinuityState,
  recommendedResolutionProposals,
} from "@/domain/continuity-demo";
import type { ContinuityState } from "@/domain/types";
import {
  createContinuityToolDefinitions,
  parseResolutionProposalInput,
} from "./continuity-webmcp";

const executionOptions = { signal: new AbortController().signal };

function setup(state = structuredClone(initialContinuityState)) {
  let current = state;
  const definitions = createContinuityToolDefinitions({
    getState: () => current,
    onStage: (proposals) => {
      current = stageResolutionProposals(
        current,
        proposals,
        new Date("2026-08-26T10:00:00.000Z"),
      );
      return current;
    },
  });
  return { definitions, getState: () => current };
}

describe("Continuity Ledger WebMCP tools", () => {
  it("exposes a bounded read-only truth summary without raw evidence", async () => {
    const original = structuredClone(initialContinuityState);
    const { definitions } = setup();

    expect(definitions.inspect.name).toBe("inspect_business_truth");
    expect(definitions.inspect.annotations).toEqual({ readOnlyHint: true });
    expect(definitions.inspect.description).toContain("need human review");
    expect(definitions.stage.description).toContain("cannot accept, edit, reject");
    await expect(
      definitions.inspect.execute({}, executionOptions),
    ).resolves.toEqual({
      business: "Rwenzori Harvest Coffee Ltd",
      sources: 4,
      resolved: 0,
      reviewed: 0,
      conflicts: 3,
      unresolved: 4,
      reviewRemaining: 4,
      unsupportedClaims: 1,
      needsReview: [
        "tradePhone",
        "instantCoffeeMoq",
        "japanAvailability",
        "certification",
      ],
      lastRepresentativeAttestation: "2026-08-26",
    });
    expect(initialContinuityState).toEqual(original);
  });

  it("rejects non-object or extended inspection input", async () => {
    const { definitions } = setup();
    await expect(
      definitions.inspect.execute("unsafe", executionOptions),
    ).rejects.toThrow("must be an object");
    await expect(
      definitions.inspect.execute({ includeDocuments: true }, executionOptions),
    ).rejects.toThrow("unsupported field");
  });

  it("stages bounded proposals while leaving all authority with the human", async () => {
    const { definitions, getState } = setup();
    const original = structuredClone(initialContinuityState);

    expect(definitions.stage.name).toBe("stage_claim_resolutions");
    expect(definitions.stage.annotations).toEqual({ readOnlyHint: false });
    const result = await definitions.stage.execute(
      { proposals: recommendedResolutionProposals },
      executionOptions,
    );

    expect(result).toMatchObject({
      count: 4,
      humanReviewRequired: true,
      published: false,
    });
    const staged = (result as { staged: Array<Record<string, unknown>> }).staged;
    expect(staged).toHaveLength(4);
    expect(staged.every((proposal) => proposal.status === "AGENT_PROPOSED")).toBe(true);
    expect(staged.every((proposal) => !("proposedValue" in proposal))).toBe(true);
    expect(initialContinuityState).toEqual(original);
    expect(
      getState().resolutions.slice(-4).every((item) => item.state === "AGENT_PROPOSED"),
    ).toBe(true);
    expect(getState().publishedVersionId).toBeUndefined();
  });

  it("rejects human-only metadata, duplicates, unsupported values, and pending fields", () => {
    const phone = recommendedResolutionProposals[0];
    expect(() =>
      parseResolutionProposalInput(
        { proposals: [{ ...phone, acceptedValue: phone.proposedValue }] },
        initialContinuityState,
      ),
    ).toThrow("unsupported field");
    expect(() =>
      parseResolutionProposalInput(
        { proposals: [phone, phone] },
        initialContinuityState,
      ),
    ).toThrow("same field twice");
    expect(() =>
      parseResolutionProposalInput(
        {
          proposals: [
            { ...phone, proposedValue: "+256 999 999 999" },
          ],
        },
        initialContinuityState,
      ),
    ).toThrow("not present in a cited source");

    const pending = stageResolutionProposals(
      initialContinuityState,
      [phone],
      new Date("2026-08-26T09:00:00.000Z"),
    );
    expect(() =>
      parseResolutionProposalInput({ proposals: [phone] }, pending),
    ).toThrow("already has a pending");
  });

  it("rejects unknown sources, certification publication, and invalid batch sizes", () => {
    const phone = recommendedResolutionProposals[0];
    const certification = recommendedResolutionProposals[3];
    expect(() =>
      parseResolutionProposalInput(
        {
          proposals: [{ ...phone, supportingSourceIds: ["unknown-source"] }],
        },
        initialContinuityState,
      ),
    ).toThrow("Unknown source ID");
    expect(() =>
      parseResolutionProposalInput(
        {
          proposals: [
            {
              ...certification,
              action: "USE_VALUE",
              proposedValue: "Organic certified",
            },
          ],
        },
        initialContinuityState,
      ),
    ).toThrow("only be excluded");
    expect(() =>
      parseResolutionProposalInput({ proposals: [] }, initialContinuityState),
    ).toThrow("between 1 and 6");
  });

  it("preserves an earlier human decision when a later proposal is staged", async () => {
    const phone = recommendedResolutionProposals[0];
    const firstStage = stageResolutionProposals(
      initialContinuityState,
      [phone],
      new Date("2026-08-26T09:00:00.000Z"),
    );
    const proposal = firstStage.resolutions.at(-1)!;
    const accepted: ContinuityState = acceptResolution(
      firstStage,
      proposal.id,
      new Date("2026-08-26T09:05:00.000Z"),
    );
    const acceptedValue = latestHumanResolution(accepted, "tradePhone")?.acceptedValue;
    const { definitions, getState } = setup(accepted);

    const result = await definitions.stage.execute(
      { proposals: [phone] },
      executionOptions,
    );
    expect(result).toMatchObject({
      staged: [{ field: "tradePhone", humanDecisionPreserved: true }],
    });
    expect(latestHumanResolution(getState(), "tradePhone")?.acceptedValue).toBe(
      acceptedValue,
    );
  });
});
