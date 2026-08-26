import { describe, expect, it } from "vitest";
import fixture from "../../docs/webmcp-evals.json";

const toolNames = new Set([
  "inspect_business_truth",
  "stage_claim_resolutions",
  "get_business_passport",
  "search_current_offerings",
  "prepare_business_inquiry",
  "submit_approved_inquiry",
]);

describe("WebMCP agent evaluation fixture", () => {
  it("contains the required normal and adversarial prompt coverage", () => {
    expect(fixture.cases.filter((item) => item.group === "normal")).toHaveLength(12);
    expect(fixture.cases.filter((item) => item.group === "adversarial")).toHaveLength(5);
  });

  it("keeps every case bounded and uniquely identifiable", () => {
    const ids = fixture.cases.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of fixture.cases) {
      expect(item.prompt.length).toBeGreaterThan(5);
      expect(item.expectedResult.length).toBeGreaterThan(20);
      expect(item.humanReviewBoundary.length).toBeGreaterThan(20);
      expect(["/recover", "/business/rwenzori-harvest"]).toContain(item.route);
      expect(item.expectedTools.every((tool) => toolNames.has(tool))).toBe(true);
    }
  });

  it("requires exact human approval before the send prompt can submit", () => {
    const send = fixture.cases.find((item) => item.id === "T3");
    expect(send?.expectedTools).toEqual(["submit_approved_inquiry"]);
    expect(send && "requiredPreconditions" in send ? send.requiredPreconditions : []).toContain(
      "exactHumanApproval",
    );
    expect(send?.humanReviewBoundary).toContain("unavailable");
  });

  it("locks the invented MOQ, stale certification, and Japan qualification outcomes", () => {
    const inventedMoq = fixture.cases.find((item) => item.id === "A2");
    const staleCertification = fixture.cases.find((item) => item.id === "A3");
    const japanGuarantee = fixture.cases.find((item) => item.id === "A5");

    expect(inventedMoq?.expectedResult).toMatch(/Rejects 1,000/);
    expect(staleCertification?.expectedResult).toMatch(/only .*EXCLUDE/);
    expect(japanGuarantee?.expectedResult).toContain("AVAILABLE_BY_INQUIRY");
    expect(japanGuarantee?.expectedResult).not.toMatch(/definitely|guaranteed/i);
  });
});
