import {
  latestHumanResolution,
  reviewableContinuityFields,
  summarizeContinuityState,
  validateResolutionProposals,
  type ResolutionProposalInput,
  type ReviewableContinuityField,
} from "@/domain/continuity";
import { derivePassport } from "@/domain/passport";
import type { ContinuityState, ResolutionAction } from "@/domain/types";
import { asToolInput, assertExactKeys } from "@/lib/webmcp";

const objectSchema = {
  type: "object",
  additionalProperties: false,
} as const;

const proposalKeys = [
  "field",
  "action",
  "proposedValue",
  "supportingSourceIds",
  "explanation",
] as const;

const sourceIdsSchema = {
  type: "array",
  minItems: 1,
  maxItems: 4,
  uniqueItems: true,
  items: { type: "string", minLength: 1, maxLength: 80 },
} as const;

const explanationSchema = {
  type: "string",
  minLength: 1,
  maxLength: 320,
} as const;

function requiredBoundedString(
  input: Record<string, unknown>,
  key: string,
  maxLength: number,
) {
  const value = input[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${key} must be a non-empty string.`);
  }
  if (value.length > maxLength) {
    throw new TypeError(`${key} must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function parseSourceIds(input: Record<string, unknown>) {
  const value = input.supportingSourceIds;
  if (!Array.isArray(value) || value.length < 1 || value.length > 4) {
    throw new TypeError("supportingSourceIds must contain between 1 and 4 source IDs.");
  }
  const ids = value.map((sourceId) => {
    if (typeof sourceId !== "string" || !sourceId.trim() || sourceId.length > 80) {
      throw new TypeError("Every supporting source ID must be a bounded string.");
    }
    return sourceId.trim();
  });
  if (new Set(ids).size !== ids.length) {
    throw new TypeError("Supporting source IDs must be unique.");
  }
  return ids;
}

function parseField(value: unknown): ReviewableContinuityField {
  if (
    typeof value !== "string" ||
    !reviewableContinuityFields.includes(value as ReviewableContinuityField)
  ) {
    throw new TypeError("field must identify a reviewable Continuity Ledger field.");
  }
  return value as ReviewableContinuityField;
}

function parseAction(value: unknown): ResolutionAction {
  if (value !== "USE_VALUE" && value !== "EXCLUDE") {
    throw new TypeError("action must be USE_VALUE or EXCLUDE.");
  }
  return value;
}

export function parseResolutionProposalInput(
  rawInput: unknown,
  state: ContinuityState,
) {
  const input = asToolInput(rawInput);
  assertExactKeys(input, ["proposals"]);
  if (!Array.isArray(input.proposals)) {
    throw new TypeError("proposals must be an array.");
  }
  if (input.proposals.length < 1 || input.proposals.length > 6) {
    throw new TypeError("Stage between 1 and 6 proposals at a time.");
  }

  const proposals = input.proposals.map((rawProposal, index) => {
    const proposal = asToolInput(rawProposal);
    assertExactKeys(proposal, proposalKeys, `Proposal ${index + 1}`);
    const field = parseField(proposal.field);
    const action = parseAction(proposal.action);
    const hasProposedValue = Object.hasOwn(proposal, "proposedValue");
    if (action === "USE_VALUE" && !hasProposedValue) {
      throw new TypeError("USE_VALUE proposals require proposedValue.");
    }
    if (action === "EXCLUDE" && hasProposedValue) {
      throw new TypeError("EXCLUDE proposals must not contain proposedValue.");
    }
    if (field === "certification" && action !== "EXCLUDE") {
      throw new TypeError("The unsupported certification claim can only be excluded.");
    }
    return {
      field,
      action,
      ...(action === "USE_VALUE"
        ? { proposedValue: proposal.proposedValue }
        : {}),
      supportingSourceIds: parseSourceIds(proposal),
      explanation: requiredBoundedString(proposal, "explanation", 320),
    } satisfies ResolutionProposalInput;
  });

  const fields = proposals.map((proposal) => proposal.field);
  if (new Set(fields).size !== fields.length) {
    throw new TypeError("A proposal batch cannot contain the same field twice.");
  }
  for (const field of fields) {
    const alreadyPending = state.resolutions.some(
      (resolution) =>
        resolution.field === field && resolution.state === "AGENT_PROPOSED",
    );
    if (alreadyPending) {
      throw new TypeError(`${field} already has a pending agent proposal.`);
    }
  }

  validateResolutionProposals(state, proposals);
  return proposals;
}

interface ContinuityToolOptions {
  getState: () => ContinuityState;
  onInspect?: () => void;
  onStage: (
    proposals: readonly ResolutionProposalInput[],
  ) => ContinuityState | Promise<ContinuityState>;
}

export function createContinuityToolDefinitions(options: ContinuityToolOptions) {
  const inspect: WebMcpTool = {
    name: "inspect_business_truth",
    title: "Inspect recovered business truth",
    description:
      "Use to identify which recovered fields need human review. Returns a bounded summary of counts, review fields, and attestation date; never returns source text or changes state.",
    inputSchema: objectSchema,
    annotations: { readOnlyHint: true },
    execute: async (rawInput = {}) => {
      const input = asToolInput(rawInput);
      assertExactKeys(input, []);
      const state = options.getState();
      const summary = summarizeContinuityState(state);
      options.onInspect?.();
      return {
        business: derivePassport(state).profile.name,
        sources: summary.sources,
        resolved: summary.resolved,
        reviewed: summary.reviewed,
        conflicts: summary.conflicts,
        unresolved: summary.unresolved,
        reviewRemaining: summary.reviewRemaining,
        unsupportedClaims: summary.unsupportedClaims,
        needsReview: summary.needsReview,
        lastRepresentativeAttestation: summary.lastRepresentativeAttestation,
      };
    },
  };

  const stage: WebMcpTool = {
    name: "stage_claim_resolutions",
    title: "Stage claim resolutions for human review",
    description:
      "Use only to append up to six validated, source-backed AGENT_PROPOSED resolutions to the visible Ledger. This cannot accept, edit, reject, keep unresolved, or publish anything.",
    inputSchema: {
      ...objectSchema,
      properties: {
        proposals: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: {
            oneOf: [
              {
                ...objectSchema,
                properties: {
                  field: { const: "tradePhone" },
                  action: { const: "USE_VALUE" },
                  proposedValue: { type: "string", minLength: 1, maxLength: 240 },
                  supportingSourceIds: sourceIdsSchema,
                  explanation: explanationSchema,
                },
                required: proposalKeys,
              },
              {
                ...objectSchema,
                properties: {
                  field: { const: "instantCoffeeMoq" },
                  action: { const: "USE_VALUE" },
                  proposedValue: { type: "integer", minimum: 1, maximum: 1_000_000 },
                  supportingSourceIds: sourceIdsSchema,
                  explanation: explanationSchema,
                },
                required: proposalKeys,
              },
              {
                ...objectSchema,
                properties: {
                  field: { const: "japanAvailability" },
                  action: { const: "USE_VALUE" },
                  proposedValue: {
                    type: "string",
                    enum: ["SUPPORTED", "AVAILABLE_BY_INQUIRY", "UNSUPPORTED", "UNKNOWN"],
                  },
                  supportingSourceIds: sourceIdsSchema,
                  explanation: explanationSchema,
                },
                required: proposalKeys,
              },
              {
                ...objectSchema,
                properties: {
                  field: { const: "certification" },
                  action: { const: "EXCLUDE" },
                  supportingSourceIds: sourceIdsSchema,
                  explanation: explanationSchema,
                },
                required: ["field", "action", "supportingSourceIds", "explanation"],
              },
            ],
          },
        },
      },
      required: ["proposals"],
    },
    annotations: { readOnlyHint: false },
    execute: async (rawInput) => {
      const before = options.getState();
      const proposals = parseResolutionProposalInput(rawInput, before);
      const humanFieldsBefore = new Set<string>(
        proposals
          .filter((proposal) => latestHumanResolution(before, proposal.field))
          .map((proposal) => proposal.field),
      );
      const next = await options.onStage(proposals);
      const staged = next.resolutions.slice(before.resolutions.length).filter(
        (resolution) => resolution.state === "AGENT_PROPOSED",
      );
      return {
        count: staged.length,
        staged: staged.map((resolution) => ({
          proposalId: resolution.id,
          field: resolution.field,
          status: resolution.state,
          humanDecisionPreserved:
            !humanFieldsBefore.has(resolution.field) ||
            Boolean(latestHumanResolution(next, resolution.field)),
        })),
        humanReviewRequired: true,
        published: false,
      };
    },
  };

  return { inspect, stage };
}
