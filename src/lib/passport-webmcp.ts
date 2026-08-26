import {
  getBusinessPassport,
  isOfferingPublishable,
  searchPassportOfferings,
} from "@/domain/passport";
import type {
  InquiryDraft,
  InquiryField,
  PassportVersion,
} from "@/domain/types";
import {
  asToolInput,
  assertExactKeys,
  optionalBoolean,
  optionalNumber,
  optionalString,
  requiredString,
} from "@/lib/webmcp";

const objectSchema = {
  type: "object",
  additionalProperties: false,
} as const;

const searchKeys = [
  "query",
  "destinationCountry",
  "privateLabelRequired",
  "maxResults",
] as const;

export const preparableInquiryFields = [
  "productId",
  "quantity",
  "destinationCountry",
  "requestSamples",
  "privateLabel",
  "buyerCompany",
  "buyerName",
  "buyerEmail",
  "questions",
] as const satisfies readonly InquiryField[];

interface PrepareResult {
  draft: InquiryDraft;
  valid: boolean;
  missingFields: string[];
}

interface PassportToolOptions {
  getVersion: () => PassportVersion;
  onPrepare: (
    values: Partial<Omit<InquiryDraft, "idempotencyKey" | "updatedAt">>,
    fields: InquiryField[],
  ) => Promise<PrepareResult>;
  onActivity?: (tool: string, summary: string, readOnly: boolean) => void;
}

interface SubmitToolOptions {
  getAuthority: () => {
    hydrated: boolean;
    approved: boolean;
    valid: boolean;
    approvalFingerprint: string | null;
    currentFingerprint: string;
  };
  onSubmit: () => Promise<{
    reference: string;
    status: "SUBMITTED";
    duplicate: boolean;
  }>;
}

function requiredBoolean(input: Record<string, unknown>, key: string) {
  const value = optionalBoolean(input, key);
  if (value === undefined) throw new TypeError(`${key} is required.`);
  return value;
}

function parsePositiveInteger(input: Record<string, unknown>, key: string) {
  const value = optionalNumber(input, key);
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new TypeError(`${key} must be a positive whole number.`);
  }
  return Number(value);
}

export function inquiryAuthorityFingerprint(
  draft: InquiryDraft,
  passportVersionId: string,
) {
  return JSON.stringify({
    passportVersionId,
    productId: draft.productId,
    quantity: draft.quantity,
    destinationCountry: draft.destinationCountry,
    requestSamples: draft.requestSamples,
    privateLabel: draft.privateLabel,
    buyerCompany: draft.buyerCompany,
    buyerName: draft.buyerName,
    buyerEmail: draft.buyerEmail,
    questions: draft.questions,
    idempotencyKey: draft.idempotencyKey,
  });
}

export function createPassportToolDefinitions(options: PassportToolOptions) {
  const getPassport: WebMcpTool = {
    name: "get_business_passport",
    title: "Get the published Business Passport",
    description:
      "Return the compact published Passport for Rwenzori Harvest Coffee Ltd, including accepted contact, capabilities, and current offerings only.",
    inputSchema: objectSchema,
    annotations: { readOnlyHint: true },
    execute: async (rawInput = {}) => {
      const input = asToolInput(rawInput);
      assertExactKeys(input, []);
      const version = options.getVersion();
      options.onActivity?.(
        "get_business_passport",
        `Returned published Passport version ${version.version}.`,
        true,
      );
      return {
        version: version.version,
        publishedAt: version.publishedAt,
        ...getBusinessPassport(version.passport),
      };
    },
  };

  const search: WebMcpTool = {
    name: "search_current_offerings",
    title: "Search published current offerings",
    description:
      "Search only current offerings in the published Business Passport. Destination results preserve supported versus available-by-inquiry qualification.",
    inputSchema: {
      ...objectSchema,
      properties: {
        query: { type: "string", maxLength: 120 },
        destinationCountry: { type: "string", maxLength: 80 },
        privateLabelRequired: { type: "boolean" },
        maxResults: { type: "integer", minimum: 1, maximum: 5 },
      },
    },
    annotations: { readOnlyHint: true },
    execute: async (rawInput = {}) => {
      const input = asToolInput(rawInput);
      assertExactKeys(input, searchKeys);
      const maxResults = optionalNumber(input, "maxResults");
      if (
        maxResults !== undefined &&
        (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 5)
      ) {
        throw new TypeError("maxResults must be a whole number between 1 and 5.");
      }
      const version = options.getVersion();
      const offerings = searchPassportOfferings(
        {
          query: optionalString(input, "query", 120),
          destinationCountry: optionalString(input, "destinationCountry", 80),
          privateLabelRequired: optionalBoolean(input, "privateLabelRequired"),
          maxResults,
        },
        version.passport,
      );
      options.onActivity?.(
        "search_current_offerings",
        `Returned ${offerings.length} published offering${offerings.length === 1 ? "" : "s"}.`,
        true,
      );
      return { version: version.version, count: offerings.length, offerings };
    },
  };

  const prepare: WebMcpTool = {
    name: "prepare_business_inquiry",
    title: "Prepare a visible business inquiry",
    description:
      "Populate and save the visible inquiry form using a published offering. This never approves or submits; the human reviews every value.",
    inputSchema: {
      ...objectSchema,
      properties: {
        productId: { type: "string", maxLength: 80 },
        quantity: { type: "integer", minimum: 1 },
        destinationCountry: { type: "string", maxLength: 80 },
        requestSamples: { type: "boolean" },
        privateLabel: { type: "boolean" },
        buyerCompany: { type: "string", maxLength: 120 },
        buyerName: { type: "string", maxLength: 120 },
        buyerEmail: { type: "string", format: "email", maxLength: 160 },
        questions: { type: "string", maxLength: 1000 },
      },
      required: [
        "productId",
        "quantity",
        "destinationCountry",
        "requestSamples",
        "privateLabel",
      ],
    },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute: async (rawInput) => {
      const input = asToolInput(rawInput);
      assertExactKeys(input, preparableInquiryFields);
      const values = {
        productId: requiredString(input, "productId", 80),
        quantity: String(parsePositiveInteger(input, "quantity")),
        destinationCountry: requiredString(input, "destinationCountry", 80),
        requestSamples: requiredBoolean(input, "requestSamples"),
        privateLabel: requiredBoolean(input, "privateLabel"),
        buyerCompany: optionalString(input, "buyerCompany", 120) ?? "",
        buyerName: optionalString(input, "buyerName", 120) ?? "",
        buyerEmail: optionalString(input, "buyerEmail", 160) ?? "",
        questions: optionalString(input, "questions", 1000) ?? "",
      };
      if (values.buyerEmail && !/^\S+@\S+\.\S+$/.test(values.buyerEmail)) {
        throw new TypeError("buyerEmail must be a valid email address.");
      }
      const version = options.getVersion();
      if (
        !isOfferingPublishable(
          version.passport,
          values.productId,
          values.destinationCountry,
        )
      ) {
        throw new TypeError(
          "The published Passport does not offer this product for that destination.",
        );
      }
      const product = version.passport.profile.products.find(
        (item) => item.id === values.productId,
      );
      if (values.privateLabel && !product?.privateLabel) {
        throw new TypeError(
          "The published Passport does not offer private-label packaging for this product.",
        );
      }
      const fields = preparableInquiryFields.filter((field) =>
        Object.hasOwn(input, field),
      );
      const result = await options.onPrepare(values, fields);
      options.onActivity?.(
        "prepare_business_inquiry",
        result.valid
          ? "Prepared a valid visible draft for human review."
          : `Prepared a visible draft with ${result.missingFields.length} field${result.missingFields.length === 1 ? "" : "s"} still requiring human attention.`,
        false,
      );
      return {
        prepared: true,
        draftSaved: true,
        valid: result.valid,
        missingFields: result.missingFields,
        humanReviewRequired: true,
        submitted: false,
      };
    },
  };

  return { getPassport, search, prepare };
}

export function createSubmitToolDefinition(options: SubmitToolOptions) {
  const submit: WebMcpTool = {
    name: "submit_approved_inquiry",
    title: "Submit the human-approved inquiry",
    description:
      "Submit the current visible inquiry only while it exactly matches the human-approved draft and published Passport version.",
    inputSchema: objectSchema,
    annotations: { readOnlyHint: false },
    execute: async (rawInput = {}) => {
      const input = asToolInput(rawInput);
      assertExactKeys(input, []);
      const authority = options.getAuthority();
      if (
        !authority.hydrated ||
        !authority.approved ||
        !authority.valid ||
        !authority.approvalFingerprint ||
        authority.approvalFingerprint !== authority.currentFingerprint
      ) {
        throw new Error(
          "Submission is unavailable because the reviewed draft or Passport authority changed.",
        );
      }
      return options.onSubmit();
    },
  };
  return submit;
}
