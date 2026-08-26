"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { WebMcpStatus } from "@/lib/webmcp";

export interface AgentGuidePrompt {
  label: string;
  text: string;
}

export function AgentDemoGuide({
  status,
  prompts,
  manualFallback,
  compact = false,
}: {
  status: WebMcpStatus;
  prompts: readonly AgentGuidePrompt[];
  manualFallback?: ReactNode;
  compact?: boolean;
}) {
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const copyResetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
    }
  }, []);

  async function copyPrompt(text: string, index: number) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopyError(false);
      setCopiedPrompt(index);
      if (copyResetTimer.current !== null) {
        window.clearTimeout(copyResetTimer.current);
      }
      copyResetTimer.current = window.setTimeout(() => setCopiedPrompt(null), 1600);
    } catch {
      setCopiedPrompt(null);
      setCopyError(true);
    }
  }

  if (collapsed) {
    return (
      <button
        className="agent-guide-restore"
        type="button"
        onClick={() => setCollapsed(false)}
      >
        Show demo guide
      </button>
    );
  }

  const ready = status === "ready";
  const unavailable = status === "unsupported" || status === "error";

  return (
    <section
      className={`agent-guide status-${status} ${compact ? "compact" : ""}`}
      aria-labelledby={compact ? "passport-agent-guide-heading" : "ledger-agent-guide-heading"}
      aria-busy={status === "checking"}
    >
      <div className="agent-guide-heading">
        <div>
          <p className="eyebrow">Try with your agent</p>
          <h2 id={compact ? "passport-agent-guide-heading" : "ledger-agent-guide-heading"}>
            {ready
              ? "Agent assistance available"
              : status === "checking"
                ? "Checking for agent assistance…"
                : "Manual review available"}
          </h2>
        </div>
        <button className="text-button" type="button" onClick={() => setCollapsed(true)}>
          Hide guide
        </button>
      </div>

      <p className="agent-guide-status" role="status" aria-live="polite">
        {ready
          ? "Your agent can organize the evidence and prepare visible work. Only you can decide what gets published or submitted."
          : status === "checking"
            ? "Confirming whether this browser can register the page's agent tools."
            : status === "unsupported"
              ? "WebMCP isn't available in this browser. You can still complete the entire workflow manually."
              : "Agent tools could not be registered. Manual review remains available."}
      </p>

      {ready && (
        <div className="agent-prompt-list">
          {prompts.map((prompt, index) => (
            <article key={prompt.text} className="agent-prompt-card">
              <span>{prompt.label}</span>
              <p>&ldquo;{prompt.text}&rdquo;</p>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => void copyPrompt(prompt.text, index)}
              >
                {copiedPrompt === index ? "Copied" : "Copy prompt"}
              </button>
            </article>
          ))}
        </div>
      )}

      {copyError && (
        <p className="agent-guide-copy-error" role="alert">
          Copy is unavailable here. Select the prompt text and copy it manually.
        </p>
      )}

      {manualFallback && ready && (
        <details className="agent-manual-fallback">
          <summary>No compatible agent? Use demo suggestions</summary>
          <div>{manualFallback}</div>
        </details>
      )}

      {manualFallback && unavailable && (
        <div className="agent-manual-primary">
          <strong>Manual suggestion controls</strong>
          {manualFallback}
        </div>
      )}
    </section>
  );
}
