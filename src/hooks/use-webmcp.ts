"use client";

import { useEffect, useRef, useState } from "react";
import { getBusinessStatus, searchCurrentOfferings } from "@/domain/business";
import type {
  ActivityEntry,
  BusinessProfile,
  InquiryDraft,
  InquiryField,
} from "@/domain/types";
import {
  asToolInput,
  hasWebMcp,
  optionalBoolean,
  optionalNumber,
  optionalString,
  requiredString,
} from "@/lib/webmcp";
import { canOfferSubmitTool } from "@/lib/preferences";

type WebMcpStatus = "checking" | "unsupported" | "ready" | "error";

interface PrepareResult {
  draft: InquiryDraft;
  valid: boolean;
  missingFields: string[];
}

interface SubmitResult {
  reference: string;
  status: "SUBMITTED";
  duplicate: boolean;
}

interface UseWebMcpOptions {
  approved: boolean;
  valid: boolean;
  profile: BusinessProfile;
  onPrepare: (
    values: Partial<Omit<InquiryDraft, "idempotencyKey" | "updatedAt">>,
    fields: InquiryField[],
  ) => Promise<PrepareResult>;
  onSubmit: () => Promise<SubmitResult>;
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
}

const objectSchema = {
  type: "object",
  additionalProperties: false,
} as const;

function fieldList(input: Record<string, unknown>): InquiryField[] {
  return Object.keys(input).filter(
    (key) => key !== "idempotencyKey" && key !== "updatedAt",
  ) as InquiryField[];
}

export function useWebMcp(options: UseWebMcpOptions) {
  const callbacks = useRef(options);
  const [status, setStatus] = useState<WebMcpStatus>("checking");
  const [submitToolAvailable, setSubmitToolAvailable] = useState(false);

  useEffect(() => {
    callbacks.current = options;
  }, [options]);

  useEffect(() => {
    if (!hasWebMcp()) {
      queueMicrotask(() => setStatus("unsupported"));
      return;
    }

    const controller = new AbortController();
    const modelContext = document.modelContext!;

    async function registerBaseTools() {
      try {
        // Direct WebMCP registration is intentional: judges can grep registerTool,
        // and browsers without this experimental API continue with the normal UI.
        await modelContext.registerTool(
          {
            name: "get_business_status",
            title: "Get current business status",
            description:
              "Return the current attested status and major capabilities of Rwenzori Harvest Coffee Ltd. This is compact fictional demonstration data.",
            inputSchema: {
              ...objectSchema,
              properties: {
                language: {
                  type: "string",
                  description: "Optional BCP 47 response language. English is used in this demo.",
                  maxLength: 16,
                },
              },
            },
            annotations: { readOnlyHint: true },
            execute: async (rawInput) => {
              const input = asToolInput(rawInput ?? {});
              optionalString(input, "language", 16);
              callbacks.current.addActivity({
                tool: "get_business_status",
                action: "called",
                summary: "Agent requested the attested business status.",
                readOnly: true,
                approvalRequired: false,
              });
              const result = getBusinessStatus(callbacks.current.profile);
              callbacks.current.addActivity({
                tool: "get_business_status",
                action: "completed",
                summary: "Returned current status, date, and four capabilities.",
                readOnly: true,
                approvalRequired: false,
              });
              return result;
            },
          },
          { signal: controller.signal },
        );

        await modelContext.registerTool(
          {
            name: "search_current_offerings",
            title: "Search current offerings",
            description:
              "Search only currently available, attested coffee offerings. Filter by query, destination country, and private-label requirement.",
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
            execute: async (rawInput) => {
              const input = asToolInput(rawInput ?? {});
              const result = searchCurrentOfferings(
                {
                  query: optionalString(input, "query", 120),
                  destinationCountry: optionalString(
                    input,
                    "destinationCountry",
                    80,
                  ),
                  privateLabelRequired: optionalBoolean(
                    input,
                    "privateLabelRequired",
                  ),
                  maxResults: optionalNumber(input, "maxResults"),
                },
                callbacks.current.profile,
              );
              callbacks.current.addActivity({
                tool: "search_current_offerings",
                action: "called",
                summary: "Agent searched the attested product catalogue.",
                readOnly: true,
                approvalRequired: false,
              });
              callbacks.current.addActivity({
                tool: "search_current_offerings",
                action: "completed",
                summary: `Returned ${result.length} eligible offering${result.length === 1 ? "" : "s"}.`,
                readOnly: true,
                approvalRequired: false,
              });
              return { count: result.length, offerings: result };
            },
          },
          { signal: controller.signal },
        );

        await modelContext.registerTool(
          {
            name: "prepare_business_inquiry",
            title: "Prepare a visible business inquiry",
            description:
              "Populate the visible B2B inquiry form and save a local draft. This never submits. The human can review and edit every value.",
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
            annotations: {
              readOnlyHint: false,
              untrustedContentHint: true,
            },
            execute: async (rawInput) => {
              const input = asToolInput(rawInput);
              const quantity = optionalNumber(input, "quantity");
              if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
                throw new TypeError("quantity must be a positive whole number.");
              }
              const values = {
                productId: requiredString(input, "productId", 80),
                quantity: String(quantity),
                destinationCountry: requiredString(
                  input,
                  "destinationCountry",
                  80,
                ),
                requestSamples: optionalBoolean(input, "requestSamples") ?? false,
                privateLabel: optionalBoolean(input, "privateLabel") ?? false,
                buyerCompany: optionalString(input, "buyerCompany", 120) ?? "",
                buyerName: optionalString(input, "buyerName", 120) ?? "",
                buyerEmail: optionalString(input, "buyerEmail", 160) ?? "",
                questions: optionalString(input, "questions", 1000) ?? "",
              };
              callbacks.current.addActivity({
                tool: "prepare_business_inquiry",
                action: "called",
                summary: `Prepared ${values.quantity} units of ${values.productId} for ${values.destinationCountry}; samples ${values.requestSamples ? "requested" : "not requested"}, private label ${values.privateLabel ? "requested" : "not requested"}.`,
                readOnly: false,
                approvalRequired: false,
              });
              const result = await callbacks.current.onPrepare(
                values,
                fieldList(input),
              );
              callbacks.current.addActivity({
                tool: "prepare_business_inquiry",
                action: "completed",
                summary: result.valid
                  ? "Draft saved and ready for human review."
                  : `Draft saved; ${result.missingFields.length} required field${result.missingFields.length === 1 ? " needs" : "s need"} attention.`,
                readOnly: false,
                approvalRequired: false,
              });
              return {
                prepared: true,
                draftSaved: true,
                valid: result.valid,
                missingFields: result.missingFields,
                message: "Prepared by your agent — review before sending.",
              };
            },
          },
          { signal: controller.signal },
        );

        setStatus("ready");
        callbacks.current.addActivity({
          tool: "WebMCP",
          action: "available",
          summary: "Three page tools are available to a compatible browser agent.",
          readOnly: true,
          approvalRequired: false,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatus("error");
          callbacks.current.addActivity({
            tool: "WebMCP",
            action: "failed",
            summary:
              error instanceof Error ? error.message : "Tool registration failed.",
            readOnly: true,
            approvalRequired: false,
          });
        }
      }
    }

    void registerBaseTools();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!hasWebMcp() || !canOfferSubmitTool(options.approved, options.valid)) {
      return;
    }

    const controller = new AbortController();
    let registered = false;
    const modelContext = document.modelContext!;

    async function registerSubmitTool() {
      try {
        // The consequential tool exists only during the human-approved state.
        // Aborting this signal removes it immediately if approval or validity changes.
        await modelContext.registerTool(
          {
            name: "submit_approved_inquiry",
            title: "Submit the human-approved inquiry",
            description:
              "Submit the current visible inquiry only after the human has reviewed and approved it. The tool revalidates approval and form state at execution time.",
            inputSchema: objectSchema,
            annotations: { readOnlyHint: false },
            execute: async () => {
              if (!callbacks.current.approved || !callbacks.current.valid) {
                throw new Error(
                  "Submission is unavailable because approval or validation changed.",
                );
              }
              callbacks.current.addActivity({
                tool: "submit_approved_inquiry",
                action: "called",
                summary: "Agent requested submission of the reviewed visible form.",
                readOnly: false,
                approvalRequired: true,
              });
              try {
                const result = await callbacks.current.onSubmit();
                callbacks.current.addActivity({
                  tool: "submit_approved_inquiry",
                  action: "completed",
                  summary: `Inquiry accepted with reference ${result.reference}.`,
                  readOnly: false,
                  approvalRequired: true,
                });
                return result;
              } catch (error) {
                callbacks.current.addActivity({
                  tool: "submit_approved_inquiry",
                  action: "failed",
                  summary:
                    error instanceof Error ? error.message : "Submission failed.",
                  readOnly: false,
                  approvalRequired: true,
                });
                throw error;
              }
            },
          },
          { signal: controller.signal },
        );
        setSubmitToolAvailable(true);
        registered = true;
        callbacks.current.addActivity({
          tool: "submit_approved_inquiry",
          action: "available",
          summary: "Human approval made the final submission tool available.",
          readOnly: false,
          approvalRequired: true,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setSubmitToolAvailable(false);
          callbacks.current.addActivity({
            tool: "submit_approved_inquiry",
            action: "failed",
            summary:
              error instanceof Error
                ? error.message
                : "Could not register the submit tool.",
            readOnly: false,
            approvalRequired: true,
          });
        }
      }
    }

    void registerSubmitTool();
    return () => {
      controller.abort();
      setSubmitToolAvailable(false);
      if (registered) {
        callbacks.current.addActivity({
          tool: "submit_approved_inquiry",
          action: "removed",
          summary: "Approval or form validity changed; the submit tool was removed.",
          readOnly: false,
          approvalRequired: true,
        });
      }
    };
  }, [options.approved, options.valid]);

  return { status, submitToolAvailable };
}
