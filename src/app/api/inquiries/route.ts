import { stableReference, validateInquiry } from "@/domain/inquiry";
import { business } from "@/domain/demo-data";
import type { BusinessProfile, InquiryDraft, InquiryReceipt } from "@/domain/types";

const demoReceiptAuthority: BusinessProfile = {
  ...business,
  products: business.products.map((product) =>
    product.id === "instant-coffee-100g"
      ? { ...product, status: "CURRENTLY_AVAILABLE" }
      : product,
  ),
};

const accepted = new Map<
  string,
  { receipt: InquiryReceipt; reviewedPayloadHash: string }
>();

async function hashReviewedPayload(draft: InquiryDraft) {
  const reviewedPayload = JSON.stringify({
    productId: draft.productId,
    quantity: draft.quantity,
    destinationCountry: draft.destinationCountry,
    requestSamples: draft.requestSamples,
    privateLabel: draft.privateLabel,
    buyerCompany: draft.buyerCompany,
    buyerName: draft.buyerName,
    buyerEmail: draft.buyerEmail,
    questions: draft.questions,
  });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(reviewedPayload),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return Response.json({ error: "Inquiry payload is too large." }, { status: 413 });
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 160) {
    return Response.json(
      { error: "A valid Idempotency-Key header is required." },
      { status: 400 },
    );
  }

  let draft: InquiryDraft;
  try {
    draft = (await request.json()) as InquiryDraft;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (draft.idempotencyKey !== idempotencyKey) {
    return Response.json(
      { error: "Idempotency key does not match the reviewed draft." },
      { status: 400 },
    );
  }

  // The public challenge endpoint issues fictional receipts only. This seeded
  // authority mirrors the reconciled Instant Coffee currentness used by the
  // Passport demo; destination and exact-approval authority remain enforced in
  // the visible browser workflow and are not claimed as server authorization.
  const validation = validateInquiry(draft, demoReceiptAuthority);
  if (!validation.valid) {
    return Response.json(
      { error: "Inquiry validation failed.", fields: Object.keys(validation.errors) },
      { status: 422 },
    );
  }

  const reviewedPayloadHash = await hashReviewedPayload(draft);
  const existing = accepted.get(idempotencyKey);
  if (existing) {
    if (existing.reviewedPayloadHash !== reviewedPayloadHash) {
      return Response.json(
        { error: "This idempotency key was already used for a different reviewed inquiry." },
        { status: 409 },
      );
    }
    return Response.json({ receipt: existing.receipt, duplicate: true });
  }

  const receipt: InquiryReceipt = {
    idempotencyKey,
    reference: stableReference(idempotencyKey),
    status: "SUBMITTED",
    submittedAt: new Date().toISOString(),
  };
  accepted.set(idempotencyKey, { receipt, reviewedPayloadHash });

  return Response.json(
    { receipt, duplicate: false, demo: true },
    { status: 202, headers: { "Cache-Control": "no-store" } },
  );
}
