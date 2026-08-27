"use client";

import { useEffect, useRef, useState } from "react";
import type { ResolutionProposalInput } from "@/domain/continuity";
import type { ActivityEntry, ContinuityState } from "@/domain/types";
import { createContinuityToolDefinitions } from "@/lib/continuity-webmcp";
import { hasWebMcp, type WebMcpStatus } from "@/lib/webmcp";

interface UseContinuityWebMcpOptions {
  hydrated: boolean;
  getState: () => ContinuityState;
  onStage: (
    proposals: readonly ResolutionProposalInput[],
  ) => ContinuityState | Promise<ContinuityState>;
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
}

export function useContinuityWebMcp(options: UseContinuityWebMcpOptions) {
  const callbacks = useRef(options);
  const [status, setStatus] = useState<WebMcpStatus>("checking");

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
    const definitions = createContinuityToolDefinitions({
      getState: () => callbacks.current.getState(),
      onInspect: () => {
        callbacks.current.addActivity({
          tool: "inspect_business_truth",
          action: "completed",
          summary: "Returned compact review counts without exposing recovered source text.",
          readOnly: true,
          approvalRequired: false,
        });
      },
      onStage: async (proposals) => {
        callbacks.current.addActivity({
          tool: "stage_claim_resolutions",
          action: "called",
          summary: `Agent requested ${proposals.length} source-backed proposal${proposals.length === 1 ? "" : "s"}.`,
          readOnly: false,
          approvalRequired: false,
        });
        const next = await callbacks.current.onStage(proposals);
        callbacks.current.addActivity({
          tool: "stage_claim_resolutions",
          action: "completed",
          summary: `${proposals.length} proposal${proposals.length === 1 ? "" : "s"} staged; human review is still required.`,
          readOnly: false,
          approvalRequired: false,
        });
        return next;
      },
    });

    async function registerTools() {
      if (!document.modelContext) {
        setStatus("unsupported");
        return;
      }

      try {
        // Route-scoped direct WebMCP registration. Recovered source text never
        // controls these constant definitions, schemas, or tool names.
        await document.modelContext.registerTool(definitions.inspect, {
          signal: controller.signal,
        });
        await document.modelContext.registerTool(definitions.stage, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setStatus("ready");
        callbacks.current.addActivity({
          tool: "WebMCP",
          action: "available",
          summary: "Inspection and proposal-staging tools are available on this ledger.",
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

    void registerTools();
    return () => controller.abort();
  }, [options.hydrated]);

  return status;
}
