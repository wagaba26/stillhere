import { business } from "./demo-data";
import type { BusinessProfile, InquiryDraft, InquiryReceipt } from "./types";

export const emptyInquiry = (idempotencyKey = createIdempotencyKey()): InquiryDraft => ({
  productId: "",
  quantity: "",
  destinationCountry: "",
  requestSamples: false,
  privateLabel: false,
  buyerCompany: "",
  buyerName: "",
  buyerEmail: "",
  questions: "",
  idempotencyKey,
  updatedAt: new Date().toISOString(),
});

export function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `stillhere-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface InquiryValidation {
  valid: boolean;
  errors: Partial<Record<keyof InquiryDraft, string>>;
}

export function validateInquiry(
  draft: InquiryDraft,
  profile: BusinessProfile = business,
): InquiryValidation {
  const errors: InquiryValidation["errors"] = {};
  const product = profile.products.find((item) => item.id === draft.productId);
  const quantity = Number(draft.quantity);

  if (!product || product.status !== "CURRENTLY_AVAILABLE") {
    errors.productId = "Choose a currently available product.";
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.quantity = "Enter a whole-number quantity greater than zero.";
  }
  if (!draft.destinationCountry.trim()) {
    errors.destinationCountry = "Enter the destination country.";
  }
  if (!draft.buyerCompany.trim()) {
    errors.buyerCompany = "Enter the buyer company.";
  }
  if (!draft.buyerName.trim()) {
    errors.buyerName = "Enter the buyer name.";
  }
  if (!/^\S+@\S+\.\S+$/.test(draft.buyerEmail.trim())) {
    errors.buyerEmail = "Enter a valid business email.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function prepareInquiry(
  input: Partial<Omit<InquiryDraft, "idempotencyKey" | "updatedAt">>,
  current: InquiryDraft,
  profile: BusinessProfile = business,
): InquiryDraft {
  const allowedProduct = profile.products.some(
    (product) =>
      product.id === input.productId && product.status === "CURRENTLY_AVAILABLE",
  );

  if (input.productId !== undefined && !allowedProduct) {
    throw new TypeError("productId must identify a currently available product.");
  }

  return {
    ...current,
    ...(allowedProduct ? { productId: input.productId } : {}),
    ...(input.quantity !== undefined
      ? { quantity: String(input.quantity).trim() }
      : {}),
    ...(input.destinationCountry !== undefined
      ? { destinationCountry: String(input.destinationCountry).trim() }
      : {}),
    ...(input.requestSamples !== undefined
      ? { requestSamples: Boolean(input.requestSamples) }
      : {}),
    ...(input.privateLabel !== undefined
      ? { privateLabel: Boolean(input.privateLabel) }
      : {}),
    ...(input.buyerCompany !== undefined
      ? { buyerCompany: String(input.buyerCompany).trim() }
      : {}),
    ...(input.buyerName !== undefined
      ? { buyerName: String(input.buyerName).trim() }
      : {}),
    ...(input.buyerEmail !== undefined
      ? { buyerEmail: String(input.buyerEmail).trim() }
      : {}),
    ...(input.questions !== undefined
      ? { questions: String(input.questions).trim() }
      : {}),
    updatedAt: new Date().toISOString(),
  };
}

export function stableReference(idempotencyKey: string) {
  let hash = 0;
  for (const character of idempotencyKey) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `SH-${hash.toString(36).toUpperCase().padStart(7, "0").slice(-7)}`;
}

export class SubmissionLedger {
  private readonly receipts = new Map<string, InquiryReceipt>();

  submit(draft: InquiryDraft, now = new Date()): { receipt: InquiryReceipt; duplicate: boolean } {
    const existing = this.receipts.get(draft.idempotencyKey);
    if (existing) return { receipt: existing, duplicate: true };

    const validation = validateInquiry(draft);
    if (!validation.valid) throw new Error("Inquiry is incomplete or invalid.");

    const receipt: InquiryReceipt = {
      idempotencyKey: draft.idempotencyKey,
      reference: stableReference(draft.idempotencyKey),
      status: "SUBMITTED",
      submittedAt: now.toISOString(),
    };
    this.receipts.set(draft.idempotencyKey, receipt);
    return { receipt, duplicate: false };
  }
}
