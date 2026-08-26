import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { emptyInquiry } from "@/domain/inquiry";
import {
  initialContinuityState,
  recommendedResolutionProposals,
} from "@/domain/continuity-demo";
import { stageResolutionProposals } from "@/domain/continuity";
import { createPassportVersion } from "@/domain/passport";
import {
  STILLHERE_DATABASE_NAME,
  clearDemoContinuityState,
  deserializeDraft,
  loadContinuityState,
  loadDraft,
  loadPassportVersions,
  loadPublishedPassport,
  loadReceipt,
  openStillHereDatabase,
  publishPassportVersion,
  saveContinuityState,
  saveDraft,
  savePassportVersion,
  saveReceipt,
  serializeDraft,
} from "./indexed-db";

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

  it("upgrades a version-one database without deleting its draft", async () => {
    const factory = new IDBFactory();
    const draft = { ...emptyInquiry("legacy-draft"), buyerCompany: "Preserved buyer" };
    await new Promise<void>((resolve, reject) => {
      const request = factory.open(STILLHERE_DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("drafts", { keyPath: "id" });
        request.result.createObjectStore("submissions", {
          keyPath: "idempotencyKey",
        });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("drafts", "readwrite");
        transaction.objectStore("drafts").put({
          id: "rwenzori-harvest-inquiry",
          draft,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });

    const upgraded = await openStillHereDatabase(factory);
    expect([...upgraded.objectStoreNames]).toEqual([
      "continuity",
      "drafts",
      "passportVersions",
      "submissions",
    ]);
    upgraded.close();
    await expect(loadDraft(factory)).resolves.toEqual(draft);
  });

  it("round-trips continuity state and ordered Passport versions", async () => {
    const factory = new IDBFactory();
    const staged = stageResolutionProposals(
      initialContinuityState,
      recommendedResolutionProposals,
      new Date("2026-08-26T08:00:00.000Z"),
    );
    const first = createPassportVersion(
      staged,
      [],
      new Date("2026-08-26T09:00:00.000Z"),
    );
    const second = createPassportVersion(
      staged,
      [first],
      new Date("2026-08-26T10:00:00.000Z"),
    );
    await saveContinuityState(staged, factory);
    await savePassportVersion(second, factory);
    await savePassportVersion(first, factory);
    await expect(loadContinuityState("rwenzori-harvest", factory)).resolves.toEqual(
      staged,
    );
    await expect(loadPassportVersions("rwenzori-harvest", factory)).resolves.toEqual([
      first,
      second,
    ]);
  });

  it("publishes the immutable Passport and continuity pointer atomically", async () => {
    const factory = new IDBFactory();
    const version = createPassportVersion(
      initialContinuityState,
      [],
      new Date("2026-08-26T09:00:00.000Z"),
    );
    await publishPassportVersion(initialContinuityState, version, factory);
    await expect(loadPublishedPassport("rwenzori-harvest", factory)).resolves.toEqual(
      version,
    );
    await expect(loadContinuityState("rwenzori-harvest", factory)).resolves.toMatchObject({
      publishedVersionId: version.id,
    });
  });

  it("clears only StillHere demo records", async () => {
    const factory = new IDBFactory();
    const draft = emptyInquiry("reset-draft");
    const receipt = {
      idempotencyKey: "reset-draft",
      reference: "SH-RESET00",
      status: "SUBMITTED" as const,
      submittedAt: "2026-08-26T10:00:00.000Z",
    };
    const version = createPassportVersion(initialContinuityState);
    await saveDraft(draft, factory);
    await saveReceipt(receipt, factory);
    await saveContinuityState(initialContinuityState, factory);
    await savePassportVersion(version, factory);
    await clearDemoContinuityState(factory);
    await expect(loadDraft(factory)).resolves.toBeNull();
    await expect(loadReceipt(receipt.idempotencyKey, factory)).resolves.toBeUndefined();
    await expect(loadContinuityState("rwenzori-harvest", factory)).resolves.toBeNull();
    await expect(loadPassportVersions("rwenzori-harvest", factory)).resolves.toEqual([]);
  });
});
