import { describe, expect, it } from "vitest";
import { getBusinessStatus, searchCurrentOfferings } from "./business";

describe("business continuity data", () => {
  it("returns a compact owner-attested active status", () => {
    const result = getBusinessStatus();
    expect(result).toMatchObject({
      status: "ACTIVE",
      evidenceState: "OWNER_CONFIRMED",
      lastConfirmed: "2026-08-26",
    });
    expect(result.capabilities).toEqual({
      b2bInquiries: true,
      exports: true,
      samples: true,
      privateLabel: true,
    });
  });

  it("filters to current, destination-eligible private-label offerings", () => {
    const results = searchCurrentOfferings({
      destinationCountry: "Japan",
      privateLabelRequired: true,
      maxResults: 5,
    });
    expect(results.map((product) => product.productId)).toEqual([
      "roasted-arabica-1kg",
      "ground-arabica-250g",
      "drip-coffee-10pack",
    ]);
    expect(results.every((product) => product.evidenceState === "OWNER_CONFIRMED")).toBe(true);
  });

  it("does not expose seasonal products as currently available", () => {
    const results = searchCurrentOfferings({ query: "instant" });
    expect(results).toEqual([]);
  });

  it("bounds result size even when an agent requests more", () => {
    expect(searchCurrentOfferings({ maxResults: 999 })).toHaveLength(4);
    expect(searchCurrentOfferings({ maxResults: 1 })).toHaveLength(1);
  });
});
