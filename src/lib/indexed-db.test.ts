import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { emptyInquiry } from "@/domain/inquiry";
import { deserializeDraft, loadDraft, loadReceipt, saveDraft, saveReceipt, serializeDraft } from "./indexed-db";

describe("local persistence", () => {
  it("serializes and rejects malformed draft payloads", () => {
    const draft = emptyInquiry("serialized-key");
    expect(deserializeDraft(serializeDraft(draft))).toEqual(draft);
    expect(deserializeDraft("not-json")).toBeNull();
    expect(deserializeDraft('{"productId":"x"}')).toBeNull();
  });

  it("round-trips a structured draft through IndexedDB", async () => {
    const factory = new IDBFactory();
    const draft = { ...emptyInquiry("idb-key"), buyerCompany: "Recovered buyer" };
    await saveDraft(draft, factory);
    await expect(loadDraft(factory)).resolves.toEqual(draft);
  });

  it("stores submission receipts by idempotency key", async () => {
    const factory = new IDBFactory();
    const receipt = {
      idempotencyKey: "receipt-key",
      reference: "SH-TEST123",
      status: "SUBMITTED" as const,
      submittedAt: "2026-08-26T10:00:00.000Z",
    };
    await saveReceipt(receipt, factory);
    await expect(loadReceipt("receipt-key", factory)).resolves.toEqual(receipt);
  });
});
