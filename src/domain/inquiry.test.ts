import { describe, expect, it } from "vitest";
import { emptyInquiry, prepareInquiry, SubmissionLedger, validateInquiry } from "./inquiry";

const validDraft = () => ({
  ...emptyInquiry("test-idempotency-key"),
  productId: "drip-coffee-10pack",
  quantity: "5000",
  destinationCountry: "Japan",
  requestSamples: true,
  privateLabel: true,
  buyerCompany: "Kobe Coffee Trading",
  buyerName: "Aiko Mori",
  buyerEmail: "aiko@example.com",
  questions: "Please include Japanese labelling support.",
});

describe("inquiry rules", () => {
  it("reports required fields without throwing", () => {
    const result = validateInquiry(emptyInquiry("empty-test"));
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors)).toEqual(
      expect.arrayContaining([
        "productId",
        "quantity",
        "destinationCountry",
        "buyerCompany",
        "buyerName",
        "buyerEmail",
      ]),
    );
  });

  it("accepts a complete reviewed inquiry", () => {
    expect(validateInquiry(validDraft())).toEqual({ valid: true, errors: {} });
  });

  it("preserves the human draft key while applying visible agent values", () => {
    const current = emptyInquiry("human-owned-key");
    const prepared = prepareInquiry(
      { productId: "drip-coffee-10pack", quantity: "2000", privateLabel: true },
      current,
    );
    expect(prepared.idempotencyKey).toBe("human-owned-key");
    expect(prepared).toMatchObject({
      productId: "drip-coffee-10pack",
      quantity: "2000",
      privateLabel: true,
    });
  });

  it("rejects an unknown or non-current product instead of preserving an old selection", () => {
    const current = validDraft();
    expect(() => prepareInquiry({ productId: "not-a-product" }, current)).toThrow(
      "currently available product",
    );
    expect(() =>
      prepareInquiry({ productId: "instant-coffee-100g" }, current),
    ).toThrow("currently available product");
  });

  it("returns the same receipt for a duplicate idempotency key", () => {
    const ledger = new SubmissionLedger();
    const first = ledger.submit(validDraft(), new Date("2026-08-26T10:00:00Z"));
    const second = ledger.submit(validDraft(), new Date("2026-08-26T11:00:00Z"));
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.receipt).toEqual(first.receipt);
  });
});
