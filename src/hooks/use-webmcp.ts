"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActivityEntry,
  InquiryDraft,
  InquiryField,
  PassportVersion,
} from "@/domain/types";
import {
  createPassportToolDefinitions,
  createSubmitToolDefinition,
} from "@/lib/passport-webmcp";
import { canOfferSubmitTool } from "@/lib/preferences";
import { hasWebMcp } from "@/lib/webmcp";

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

interface UsePassportWebMcpOptions {
  hydrated: boolean;
  approved: boolean;
  valid: boolean;
  approvalFingerprint: string | null;
  currentFingerprint: string;
  passportVersion: PassportVersion;
  onPrepare: (
    values: Partial<Omit<InquiryDraft, "idempotencyKey" | "updatedAt">>,
    fields: InquiryField[],
  ) => Promise<PrepareResult>;
  onSubmit: () => Promise<SubmitResult>;
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
}

export function usePassportWebMcp(options: UsePassportWebMcpOptions) {
  const callbacks = useRef(options);
  const [status, setStatus] = useState<WebMcpStatus>("checking");
  const [submitToolAvailable, setSubmitToolAvailable] = useState(false);

  useEffect(() => {
    callbacks.current = options;
  }, [options]);

  useEffect(() => {
    if (!options.hydrated) return;
    if (!hasWebMcp()) {
      queueMicrotask(() => setStatus("unsupported"));
      return;
    }

    const controller = new AbortController();
    const definitions = createPassportToolDefinitions({
      getVersion: () => callbacks.current.passportVersion,
      onPrepare: (values, fields) =>
        callbacks.current.onPrepare(values, fields),
      onActivity: (tool, summary, readOnly) => {
        callbacks.current.addActivity({
          tool,
          action: "completed",
          summary,
          readOnly,
          approvalRequired: false,
        });
      },
    });

    async function registerBaseTools() {
      try {
        // Direct WebMCP registration is intentionally visible. All three base
        // tools read the same hydrated Passport snapshot rendered on this page.
        await document.modelContext!.registerTool(definitions.getPassport, {
          signal: controller.signal,
        });
        await document.modelContext!.registerTool(definitions.search, {
          signal: controller.signal,
        });
        await document.modelContext!.registerTool(definitions.prepare, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setStatus("ready");
        callbacks.current.addActivity({
          tool: "WebMCP",
          action: "available",
          summary: "Three Passport tools are available to a compatible browser agent.",
          readOnly: true,
          approvalRequired: false,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
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

    void registerBaseTools();
    return () => controller.abort();
  }, [options.hydrated]);

  const submitEligible =
    options.hydrated &&
    canOfferSubmitTool(options.approved, options.valid) &&
    Boolean(options.approvalFingerprint) &&
    options.approvalFingerprint === options.currentFingerprint;

  useEffect(() => {
    if (!hasWebMcp() || !submitEligible) return;

    const controller = new AbortController();
    let registered = false;
    const definition = createSubmitToolDefinition({
      getAuthority: () => ({
        hydrated: callbacks.current.hydrated,
        approved: callbacks.current.approved,
        valid: callbacks.current.valid,
        approvalFingerprint: callbacks.current.approvalFingerprint,
        currentFingerprint: callbacks.current.currentFingerprint,
      }),
      onSubmit: async () => {
        callbacks.current.addActivity({
          tool: "submit_approved_inquiry",
          action: "called",
          summary: "Agent requested submission of the exact human-approved draft.",
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
    });

    async function registerSubmitTool() {
      try {
        // The consequential capability exists only for the exact approved draft.
        await document.modelContext!.registerTool(definition, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        registered = true;
        setSubmitToolAvailable(true);
        callbacks.current.addActivity({
          tool: "submit_approved_inquiry",
          action: "available",
          summary: "Human approval made the exact-draft submission tool available.",
          readOnly: false,
          approvalRequired: true,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
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

    void registerSubmitTool();
    return () => {
      controller.abort();
      setSubmitToolAvailable(false);
      if (registered) {
        callbacks.current.addActivity({
          tool: "submit_approved_inquiry",
          action: "removed",
          summary: "Draft, Passport, validity, or human approval changed; submission was removed.",
          readOnly: false,
          approvalRequired: true,
        });
      }
    };
  }, [submitEligible, options.currentFingerprint]);

  return { status, submitToolAvailable };
}
