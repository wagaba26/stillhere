import type {
  ContinuityState,
  InquiryDraft,
  InquiryReceipt,
  PassportVersion,
} from "@/domain/types";

export const STILLHERE_DATABASE_NAME = "stillhere-continuity";
export const STILLHERE_DATABASE_VERSION = 2;
const DRAFT_STORE = "drafts";
const SUBMISSION_STORE = "submissions";
const CONTINUITY_STORE = "continuity";
const PASSPORT_VERSION_STORE = "passportVersions";
const PROFILE_DRAFT_KEY = "rwenzori-harvest-inquiry";
const DEMO_BUSINESS_ID = "rwenzori-harvest";

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
    const request = indexedDBFactory.open(
      STILLHERE_DATABASE_NAME,
      STILLHERE_DATABASE_VERSION,
    );
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
      if (!database.objectStoreNames.contains(CONTINUITY_STORE)) {
        database.createObjectStore(CONTINUITY_STORE, {
          keyPath: "businessId",
        });
      }
      if (!database.objectStoreNames.contains(PASSPORT_VERSION_STORE)) {
        const store = database.createObjectStore(PASSPORT_VERSION_STORE, {
          keyPath: "id",
        });
        store.createIndex("businessId", "businessId", { unique: false });
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onblocked = () =>
      reject(new Error("IndexedDB upgrade is blocked by another open StillHere tab."));
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

function isContinuityState(value: unknown): value is ContinuityState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<ContinuityState>;
  return (
    typeof state.businessId === "string" &&
    typeof state.updatedAt === "string" &&
    Array.isArray(state.sources) &&
    Array.isArray(state.claims) &&
    Array.isArray(state.resolutions)
  );
}

function isPassportVersion(value: unknown): value is PassportVersion {
  if (!value || typeof value !== "object") return false;
  const version = value as Partial<PassportVersion>;
  return (
    typeof version.id === "string" &&
    typeof version.businessId === "string" &&
    Number.isInteger(version.version) &&
    typeof version.publishedAt === "string" &&
    Array.isArray(version.generatedFromResolutionIds) &&
    Boolean(version.passport)
  );
}

export async function saveContinuityState(
  state: ContinuityState,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  await withStore(
    CONTINUITY_STORE,
    "readwrite",
    (store) => store.put(structuredClone(state)),
    indexedDBFactory,
  );
}

export async function loadContinuityState(
  businessId = DEMO_BUSINESS_ID,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  const value = await withStore<unknown>(
    CONTINUITY_STORE,
    "readonly",
    (store) => store.get(businessId),
    indexedDBFactory,
  );
  return isContinuityState(value) ? value : null;
}

export async function savePassportVersion(
  version: PassportVersion,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  await withStore(
    PASSPORT_VERSION_STORE,
    "readwrite",
    (store) => store.put(structuredClone(version)),
    indexedDBFactory,
  );
}

export async function loadPassportVersion(
  id: string,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  const value = await withStore<unknown>(
    PASSPORT_VERSION_STORE,
    "readonly",
    (store) => store.get(id),
    indexedDBFactory,
  );
  return isPassportVersion(value) ? value : null;
}

export async function loadPassportVersions(
  businessId = DEMO_BUSINESS_ID,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  const values = await withStore<unknown[]>(
    PASSPORT_VERSION_STORE,
    "readonly",
    (store) => store.getAll(),
    indexedDBFactory,
  );
  return values
    .filter(isPassportVersion)
    .filter((version) => version.businessId === businessId)
    .sort((left, right) => left.version - right.version);
}

export async function loadPublishedPassport(
  businessId = DEMO_BUSINESS_ID,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  const state = await loadContinuityState(businessId, indexedDBFactory);
  if (!state?.publishedVersionId) return null;
  return loadPassportVersion(state.publishedVersionId, indexedDBFactory);
}

export async function publishPassportVersion(
  state: ContinuityState,
  version: PassportVersion,
  indexedDBFactory: IDBFactory = indexedDB,
) {
  if (
    version.businessId !== state.businessId ||
    version.passport.businessId !== state.businessId
  ) {
    throw new TypeError("Passport version must belong to the continuity business.");
  }
  const database = await openStillHereDatabase(indexedDBFactory);
  try {
    const transaction = database.transaction(
      [CONTINUITY_STORE, PASSPORT_VERSION_STORE],
      "readwrite",
    );
    const completion = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    transaction
      .objectStore(PASSPORT_VERSION_STORE)
      .put(structuredClone(version));
    transaction.objectStore(CONTINUITY_STORE).put({
      ...structuredClone(state),
      publishedVersionId: version.id,
      updatedAt: version.publishedAt,
    });
    await completion;
  } finally {
    database.close();
  }
}

export async function clearDemoContinuityState(
  indexedDBFactory: IDBFactory = indexedDB,
) {
  const database = await openStillHereDatabase(indexedDBFactory);
  try {
    const transaction = database.transaction(
      [
        DRAFT_STORE,
        SUBMISSION_STORE,
        CONTINUITY_STORE,
        PASSPORT_VERSION_STORE,
      ],
      "readwrite",
    );
    const completion = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    transaction.objectStore(DRAFT_STORE).delete(PROFILE_DRAFT_KEY);
    transaction.objectStore(SUBMISSION_STORE).clear();
    transaction.objectStore(CONTINUITY_STORE).delete(DEMO_BUSINESS_ID);
    const versions = transaction.objectStore(PASSPORT_VERSION_STORE);
    const cursor = versions.openCursor();
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (!current) return;
      const value = current.value as Partial<PassportVersion>;
      if (value.businessId === DEMO_BUSINESS_ID) current.delete();
      current.continue();
    };
    await completion;
  } finally {
    database.close();
  }
}
