import type { InquiryDraft, InquiryReceipt } from "@/domain/types";

const DATABASE_NAME = "stillhere-continuity";
const DATABASE_VERSION = 1;
const DRAFT_STORE = "drafts";
const SUBMISSION_STORE = "submissions";
const PROFILE_DRAFT_KEY = "rwenzori-harvest-inquiry";

interface DraftRecord {
  id: string;
  draft: InquiryDraft;
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

export function openStillHereDatabase(indexedDBFactory: IDBFactory = indexedDB) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDBFactory.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(SUBMISSION_STORE)) {
        database.createObjectStore(SUBMISSION_STORE, {
          keyPath: "idempotencyKey",
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open IndexedDB."));
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  const database = await openStillHereDatabase(indexedDBFactory);
  try {
    const transaction = database.transaction(storeName, mode);
    const completion = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    const result = await requestToPromise(operation(transaction.objectStore(storeName)));
    await completion;
    return result;
  } finally {
    database.close();
  }
}

export function serializeDraft(draft: InquiryDraft) {
  return JSON.stringify(draft);
}

export function deserializeDraft(value: string): InquiryDraft | null {
  try {
    const parsed = JSON.parse(value) as Partial<InquiryDraft>;
    if (
      typeof parsed.idempotencyKey !== "string" ||
      typeof parsed.updatedAt !== "string" ||
      typeof parsed.productId !== "string"
    ) {
      return null;
    }
    return parsed as InquiryDraft;
  } catch {
    return null;
  }
}

export async function saveDraft(
  draft: InquiryDraft,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  const record: DraftRecord = { id: PROFILE_DRAFT_KEY, draft };
  await withStore(DRAFT_STORE, "readwrite", (store) => store.put(record), indexedDBFactory);
}

export async function loadDraft(indexedDBFactory: IDBFactory = indexedDB) {
  const record = await withStore<DraftRecord | undefined>(
    DRAFT_STORE,
    "readonly",
    (store) => store.get(PROFILE_DRAFT_KEY),
    indexedDBFactory,
  );
  return record?.draft ?? null;
}

export async function saveReceipt(
  receipt: InquiryReceipt,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  await withStore(
    SUBMISSION_STORE,
    "readwrite",
    (store) => store.put(receipt),
    indexedDBFactory,
  );
}

export async function loadReceipt(
  idempotencyKey: string,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  return withStore<InquiryReceipt | undefined>(
    SUBMISSION_STORE,
    "readonly",
    (store) => store.get(idempotencyKey),
    indexedDBFactory,
  );
}
