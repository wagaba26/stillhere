import { continuityFields } from "./types";
import type {
  BusinessClaim,
  ClaimResolution,
  ContinuityField,
  ContinuityState,
  ResolutionAction,
} from "./types";

export const reviewableContinuityFields = [
  "tradePhone",
  "instantCoffeeMoq",
  "japanAvailability",
  "certification",
] as const satisfies readonly ContinuityField[];

export type ReviewableContinuityField =
  (typeof reviewableContinuityFields)[number];

export interface ResolutionProposalInput {
  field: ReviewableContinuityField;
  action: ResolutionAction;
  proposedValue?: unknown;
  supportingSourceIds: readonly string[];
  explanation: string;
}

export const continuityFieldLabels: Record<ContinuityField, string> = {
  businessName: "Business name",
  businessDescription: "Business description",
  country: "Country",
  sector: "Sector",
  operatingStatus: "Operating status",
  tradeEmail: "Trade email",
  tradePhone: "Phone number",
  capabilities: "Business capabilities",
  marketsServed: "Markets served",
  primaryWorkflow: "Primary workflow",
  stableOfferings: "Established offerings",
  instantCoffeeStatus: "Instant Coffee status",
  instantCoffeeMoq: "Instant Coffee MOQ",
  instantCoffeePrivateLabel: "Instant Coffee private label",
  japanAvailability: "Japan export availability",
  certification: "Certification claim",
};

const fieldSubject: Record<ReviewableContinuityField, string> = {
  tradePhone: "rwenzori-harvest",
  instantCoffeeMoq: "instant-coffee-100g",
  japanAvailability: "instant-coffee-100g",
  certification: "instant-coffee-100g",
};

const japanStatuses = new Set([
  "SUPPORTED",
  "AVAILABLE_BY_INQUIRY",
  "UNSUPPORTED",
  "UNKNOWN",
]);

function valuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function valueKey(value: unknown) {
  return JSON.stringify(value);
}

function validateFieldValue(field: ReviewableContinuityField, value: unknown) {
  if (field === "instantCoffeeMoq") {
    if (!Number.isInteger(value) || Number(value) <= 0 || Number(value) > 1_000_000) {
      throw new TypeError("instantCoffeeMoq must be a positive whole number.");
    }
    return;
  }
  if (field === "japanAvailability") {
    if (typeof value !== "string" || !japanStatuses.has(value)) {
      throw new TypeError("japanAvailability must be a supported destination status.");
    }
    return;
  }
  if (typeof value !== "string" || !value.trim() || value.length > 240) {
    throw new TypeError(`${field} must be a non-empty bounded string.`);
  }
}

function assertProposal(
  state: ContinuityState,
  proposal: ResolutionProposalInput,
) {
  if (!reviewableContinuityFields.includes(proposal.field)) {
    throw new TypeError("Proposal field is not reviewable.");
  }
  if (proposal.action !== "USE_VALUE" && proposal.action !== "EXCLUDE") {
    throw new TypeError("Proposal action must use a value or exclude a claim.");
  }
  if (proposal.action === "EXCLUDE" && proposal.field !== "certification") {
    throw new TypeError("Only the unsupported certification claim can be excluded.");
  }
  if (proposal.action === "USE_VALUE") {
    validateFieldValue(proposal.field, proposal.proposedValue);
  }
  if (
    !proposal.explanation.trim() ||
    proposal.explanation.length > 320
  ) {
    throw new TypeError("Proposal explanation must be between 1 and 320 characters.");
  }
  if (
    proposal.supportingSourceIds.length === 0 ||
    proposal.supportingSourceIds.length > 4
  ) {
    throw new TypeError("A proposal must cite between 1 and 4 sources.");
  }

  const sourceIds = new Set(state.sources.map((source) => source.id));
  const uniqueSourceIds = new Set(proposal.supportingSourceIds);
  if (uniqueSourceIds.size !== proposal.supportingSourceIds.length) {
    throw new TypeError("Supporting source IDs must be unique.");
  }
  for (const sourceId of proposal.supportingSourceIds) {
    if (!sourceIds.has(sourceId)) {
      throw new TypeError(`Unknown source ID: ${sourceId}.`);
    }
    const supportsField = state.claims.some(
      (claim) => claim.sourceId === sourceId && claim.field === proposal.field,
    );
    if (!supportsField) {
      throw new TypeError(`${sourceId} does not contain a claim for ${proposal.field}.`);
    }
  }

  if (proposal.action === "USE_VALUE") {
    const valueIsSupported = state.claims.some(
      (claim) =>
        proposal.supportingSourceIds.includes(claim.sourceId) &&
        claim.field === proposal.field &&
        valuesEqual(claim.value, proposal.proposedValue),
    );
    if (!valueIsSupported) {
      throw new TypeError("The proposed value is not present in a cited source.");
    }
  }
}

export function groupClaimsByField(claims: BusinessClaim[]) {
  const groups = {} as Record<ContinuityField, BusinessClaim[]>;
  for (const field of continuityFields) groups[field] = [];
  for (const claim of claims) groups[claim.field].push(claim);
  return groups;
}

export function detectConflicts(claims: BusinessClaim[]) {
  const groups = groupClaimsByField(claims);
  return reviewableContinuityFields.filter((field) => {
    if (field === "certification") return false;
    return new Set(groups[field].map((claim) => valueKey(claim.value))).size > 1;
  });
}

export function getUnsupportedClaims(claims: BusinessClaim[]) {
  const currentCertificationValues = new Set(
    claims
      .filter(
        (claim) =>
          claim.field === "certification" &&
          (claim.evidenceState === "OWNER_CONFIRMED" ||
            claim.evidenceState === "PUBLIC_EVIDENCE"),
      )
      .map((claim) => valueKey(claim.value)),
  );
  return claims.filter(
    (claim) =>
      claim.field === "certification" &&
      claim.evidenceState === "LEGACY_SOURCE" &&
      !currentCertificationValues.has(valueKey(claim.value)),
  );
}

export function latestHumanResolution(
  state: ContinuityState,
  field: ContinuityField,
) {
  const latestDecision = state.resolutions
    .filter(
      (resolution) =>
        resolution.field === field &&
        resolution.resolvedBy === "HUMAN" &&
        Boolean(resolution.resolvedAt),
    )
    .sort((left, right) =>
      (right.resolvedAt ?? "").localeCompare(left.resolvedAt ?? ""),
    )[0];

  return latestDecision?.state === "HUMAN_ACCEPTED" ||
    latestDecision?.state === "HUMAN_EDITED"
    ? latestDecision
    : undefined;
}

export function getUnresolvedClaims(state: ContinuityState) {
  return reviewableContinuityFields.filter(
    (field) => !latestHumanResolution(state, field),
  );
}

export function stageResolutionProposal(
  state: ContinuityState,
  proposal: ResolutionProposalInput,
  now = new Date(),
) {
  assertProposal(state, proposal);
  const proposedAt = now.toISOString();
  const resolution: ClaimResolution = {
    id: `proposal-${proposal.field}-${now.getTime()}-${state.resolutions.length + 1}`,
    subjectId: fieldSubject[proposal.field],
    field: proposal.field,
    action: proposal.action,
    ...(proposal.action === "USE_VALUE"
      ? { proposal: proposal.proposedValue }
      : {}),
    supportingSourceIds: [...proposal.supportingSourceIds],
    explanation: proposal.explanation.trim(),
    state: "AGENT_PROPOSED",
    proposedBy: "AGENT",
    proposedAt,
  };
  return {
    ...state,
    resolutions: [...state.resolutions, resolution],
    updatedAt: proposedAt,
  };
}

export function stageResolutionProposals(
  state: ContinuityState,
  proposals: readonly ResolutionProposalInput[],
  now = new Date(),
) {
  validateResolutionProposals(state, proposals);
  return proposals.reduce(
    (current, proposal, index) =>
      stageResolutionProposal(
        current,
        proposal,
        new Date(now.getTime() + index),
      ),
    state,
  );
}

export function validateResolutionProposals(
  state: ContinuityState,
  proposals: readonly ResolutionProposalInput[],
) {
  if (proposals.length === 0 || proposals.length > 6) {
    throw new TypeError("Stage between 1 and 6 proposals at a time.");
  }
  proposals.forEach((proposal) => assertProposal(state, proposal));
}

function findProposal(state: ContinuityState, resolutionId: string) {
  const resolution = state.resolutions.find((item) => item.id === resolutionId);
  if (!resolution || resolution.state !== "AGENT_PROPOSED") {
    throw new TypeError("Resolution must identify a pending agent proposal.");
  }
  return resolution;
}

function resolveProposal(
  state: ContinuityState,
  resolutionId: string,
  update: (resolution: ClaimResolution) => ClaimResolution,
  now: Date,
) {
  findProposal(state, resolutionId);
  const resolvedAt = now.toISOString();
  return {
    ...state,
    resolutions: state.resolutions.map((resolution) =>
      resolution.id === resolutionId ? update(resolution) : resolution,
    ),
    updatedAt: resolvedAt,
  };
}

export function acceptResolution(
  state: ContinuityState,
  resolutionId: string,
  now = new Date(),
) {
  return resolveProposal(
    state,
    resolutionId,
    (resolution) => ({
      ...resolution,
      acceptedValue:
        resolution.action === "USE_VALUE" ? resolution.proposal : undefined,
      state: "HUMAN_ACCEPTED",
      resolvedBy: "HUMAN",
      resolvedAt: now.toISOString(),
    }),
    now,
  );
}

export function editResolution(
  state: ContinuityState,
  resolutionId: string,
  acceptedValue: unknown,
  now = new Date(),
) {
  const proposal = findProposal(state, resolutionId);
  validateFieldValue(proposal.field as ReviewableContinuityField, acceptedValue);
  return resolveProposal(
    state,
    resolutionId,
    (resolution) => ({
      ...resolution,
      action: "USE_VALUE",
      acceptedValue,
      state: "HUMAN_EDITED",
      resolvedBy: "HUMAN",
      resolvedAt: now.toISOString(),
    }),
    now,
  );
}

export function rejectResolution(
  state: ContinuityState,
  resolutionId: string,
  now = new Date(),
) {
  return resolveProposal(
    state,
    resolutionId,
    (resolution) => ({
      ...resolution,
      acceptedValue: undefined,
      state: "HUMAN_REJECTED",
      resolvedBy: "HUMAN",
      resolvedAt: now.toISOString(),
    }),
    now,
  );
}

export function leaveResolutionUnresolved(
  state: ContinuityState,
  resolutionId: string,
  now = new Date(),
) {
  return resolveProposal(
    state,
    resolutionId,
    (resolution) => ({
      ...resolution,
      acceptedValue: undefined,
      state: "UNRESOLVED",
      resolvedBy: "HUMAN",
      resolvedAt: now.toISOString(),
    }),
    now,
  );
}

export function summarizeContinuityState(state: ContinuityState) {
  const unresolvedFields = getUnresolvedClaims(state);
  const representativeDates = state.sources
    .filter((source) => source.type === "REPRESENTATIVE")
    .map((source) => source.observedAt)
    .sort((left, right) => right.localeCompare(left));
  return {
    business: state.businessId,
    sources: state.sources.length,
    claims: state.claims.length,
    resolved: reviewableContinuityFields.length - unresolvedFields.length,
    conflicts: detectConflicts(state.claims).length,
    unresolved: unresolvedFields.length,
    unsupportedClaims: getUnsupportedClaims(state.claims).length,
    needsReview: unresolvedFields,
    lastRepresentativeAttestation: representativeDates[0] ?? null,
  };
}
