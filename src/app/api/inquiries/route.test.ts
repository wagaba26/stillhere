import { describe, expect, it } from "vitest";
import { emptyInquiry } from "@/domain/inquiry";
import { POST } from "./route";

function instantDraft(idempotencyKey: string) {
  return {
    ...emptyInquiry(idempotencyKey),
    productId: "instant-coffee-100g",
    quantity: "6000",
    destinationCountry: "Japan",
    requestSamples: true,
    privateLabel: true,
    buyerCompany: "Kobe Coffee Trading",
    buyerName: "Aiko Mori",
    buyerEmail: "aiko@example.com",
    questions: "Please include Japanese labelling support.",
  };
}

function inquiryRequest(body: ReturnType<typeof instantDraft>, idempotencyKey: string) {
  return new Request("https://stillhere.example/api/inquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
}

describe("fictional inquiry receipt endpoint", () => {
  it("accepts the reconciled Instant Coffee demo journey", async () => {
    const key = "instant-demo-journey";
    const response = await POST(inquiryRequest(instantDraft(key), key));
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload).toMatchObject({
      receipt: { status: "SUBMITTED", idempotencyKey: key },
      duplicate: false,
      demo: true,
    });
  });

  it("deduplicates an exact replay and rejects changed payload reuse", async () => {
    const key = "instant-demo-idempotency";
    const draft = instantDraft(key);
    const first = await POST(inquiryRequest(draft, key));
    const replay = await POST(inquiryRequest(draft, key));
    const changed = await POST(
      inquiryRequest({ ...draft, quantity: "7000" }, key),
    );

    const firstPayload = await first.json();
    const replayPayload = await replay.json();
    expect(first.status).toBe(202);
    expect(replay.status).toBe(200);
    expect(replayPayload).toMatchObject({
      receipt: firstPayload.receipt,
      duplicate: true,
    });
    expect(changed.status).toBe(409);
  });
});
