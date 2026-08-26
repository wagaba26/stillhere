import { describe, expect, it, vi } from "vitest";
import { acceptResolution, stageResolutionProposals } from "@/domain/continuity";
import {
  initialContinuityState,
  prePivotPassportVersion,
  recommendedResolutionProposals,
} from "@/domain/continuity-demo";
import { emptyInquiry } from "@/domain/inquiry";
import { createPassportVersion } from "@/domain/passport";
import {
  createPassportToolDefinitions,
  createSubmitToolDefinition,
  inquiryAuthorityFingerprint,
} from "./passport-webmcp";

const executionOptions = { signal: new AbortController().signal };

function resolvedVersion() {
  const staged = stageResolutionProposals(
    initialContinuityState,
    recommendedResolutionProposals,
    new Date("2026-08-26T08:00:00.000Z"),
  );
  const resolved = staged.resolutions
    .filter((resolution) => resolution.state === "AGENT_PROPOSED")
    .reduce(
      (state, resolution, index) =>
        acceptResolution(
          state,
          resolution.id,
          new Date(`2026-08-26T08:0${index + 1}:00.000Z`),
        ),
      staged,
    );
  return createPassportVersion(
    resolved,
    [prePivotPassportVersion],
    new Date("2026-08-26T09:00:00.000Z"),
    2,
  );
}

describe("Business Passport WebMCP tools", () => {
  it("returns the same bounded Passport version supplied to the visible page", async () => {
    const version = resolvedVersion();
    const definitions = createPassportToolDefinitions({
      getVersion: () => version,
      onPrepare: vi.fn(),
    });
    const result = await definitions.getPassport.execute({}, executionOptions);
    expect(definitions.getPassport.name).toBe("get_business_passport");
    expect(definitions.getPassport.annotations).toEqual({ readOnlyHint: true });
    expect(definitions.getPassport.description).toContain("exact published Passport version");
    expect(definitions.search.description).toContain("AVAILABLE_BY_INQUIRY");
    expect(definitions.prepare.description).toContain("never approves or submits");
    expect(result).toMatchObject({
      version: 2,
      businessId: "rwenzori-harvest",
      name: "Rwenzori Harvest Coffee Ltd",
      contact: { phone: "+256 780 240 826" },
    });
    expect((result as { offerings: unknown[] }).offerings).toHaveLength(5);
    await expect(
      definitions.getPassport.execute({ rawSources: true }, executionOptions),
    ).rejects.toThrow("unsupported field");
  });

  it("preserves available-by-inquiry destination qualification in search", async () => {
    const version = resolvedVersion();
    const definitions = createPassportToolDefinitions({
      getVersion: () => version,
      onPrepare: vi.fn(),
    });
    const result = await definitions.search.execute(
      {
        query: "Instant",
        destinationCountry: "Japan",
        privateLabelRequired: true,
        maxResults: 5,
      },
      executionOptions,
    );
    expect(result).toMatchObject({
      count: 1,
      offerings: [
        {
          productId: "instant-coffee-100g",
          destinationStatus: "AVAILABLE_BY_INQUIRY",
          evidenceState: "Representative attested",
        },
      ],
    });
  });

  it("prepares a visible partial draft and never submits it", async () => {
    const version = resolvedVersion();
    const onPrepare = vi.fn(async (values, fields) => ({
      draft: { ...emptyInquiry("prepared"), ...values },
      valid: false,
      missingFields: ["buyerCompany", "buyerName", "buyerEmail"],
      fields,
    }));
    const definitions = createPassportToolDefinitions({
      getVersion: () => version,
      onPrepare,
    });
    const result = await definitions.prepare.execute(
      {
        productId: "instant-coffee-100g",
        quantity: 2500,
        destinationCountry: "Japan",
        requestSamples: true,
        privateLabel: true,
      },
      executionOptions,
    );
    expect(result).toEqual({
      prepared: true,
      draftSaved: true,
      valid: false,
      missingFields: ["buyerCompany", "buyerName", "buyerEmail"],
      humanReviewRequired: true,
      submitted: false,
    });
    expect(onPrepare).toHaveBeenCalledOnce();
    expect(onPrepare.mock.calls[0][1]).toEqual([
      "productId",
      "quantity",
      "destinationCountry",
      "requestSamples",
      "privateLabel",
    ]);
  });

  it("rejects unlisted destinations, extra keys, and invalid result limits", async () => {
    const version = resolvedVersion();
    const definitions = createPassportToolDefinitions({
      getVersion: () => version,
      onPrepare: vi.fn(),
    });
    await expect(
      definitions.prepare.execute(
        {
          productId: "instant-coffee-100g",
          quantity: 2500,
          destinationCountry: "United States",
          requestSamples: false,
          privateLabel: false,
        },
        executionOptions,
      ),
    ).rejects.toThrow("does not offer this product");
    await expect(
      definitions.search.execute({ maxResults: 6 }, executionOptions),
    ).rejects.toThrow("between 1 and 5");
    await expect(
      definitions.search.execute({ rawSources: true }, executionOptions),
    ).rejects.toThrow("unsupported field");
  });

  it("rejects a retained submit executor after the approved draft changes", async () => {
    const draft = {
      ...emptyInquiry("approved-key"),
      productId: "drip-coffee-10pack",
      quantity: "2000",
      destinationCountry: "Japan",
      buyerCompany: "Kobe Coffee Trading",
      buyerName: "Aiko Mori",
      buyerEmail: "aiko@example.com",
    };
    const approvedFingerprint = inquiryAuthorityFingerprint(
      draft,
      prePivotPassportVersion.id,
    );
    const authority = {
      hydrated: true,
      approved: true,
      valid: true,
      approvalFingerprint: approvedFingerprint,
      currentFingerprint: approvedFingerprint,
    };
    const onSubmit = vi.fn(async () => ({
      reference: "SH-TEST",
      status: "SUBMITTED" as const,
      duplicate: false,
    }));
    const submit = createSubmitToolDefinition({
      getAuthority: () => authority,
      onSubmit,
    });
    expect(submit.description).toContain("explicit human approval");
    await expect(
      submit.execute({ force: true }, executionOptions),
    ).rejects.toThrow("unsupported field");
    await expect(submit.execute({}, executionOptions)).resolves.toMatchObject({
      status: "SUBMITTED",
    });

    authority.currentFingerprint = inquiryAuthorityFingerprint(
      { ...draft, quantity: "2501" },
      prePivotPassportVersion.id,
    );
    await expect(submit.execute({}, executionOptions)).rejects.toThrow(
      "authority changed",
    );
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
