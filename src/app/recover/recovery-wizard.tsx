"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EvidenceBadge } from "@/components/evidence-badge";
import { SourceEvidenceCard } from "@/components/source-evidence-card";
import {
  acceptResolution,
  continuityFieldLabels,
  editResolution,
  groupClaimsByField,
  latestHumanResolution,
  leaveResolutionUnresolved,
  rejectResolution,
  reviewableContinuityFields,
  stageResolutionProposal,
  stageResolutionProposals,
  summarizeContinuityState,
  type ResolutionProposalInput,
  type ReviewableContinuityField,
} from "@/domain/continuity";
import {
  continuitySources,
  initialContinuityState,
  recommendedResolutionProposals,
} from "@/domain/continuity-demo";
import { createIdempotencyKey } from "@/domain/inquiry";
import { createPassportVersion, derivePassport } from "@/domain/passport";
import type {
  ActivityEntry,
  ClaimResolution,
  ContinuityState,
  DestinationStatus,
} from "@/domain/types";
import { formatAttestedDate, productStatusLabel } from "@/lib/format";
import {
  loadContinuityState,
  loadPassportVersions,
  publishPassportVersion,
  saveContinuityState,
} from "@/lib/indexed-db";
import { useContinuityWebMcp } from "@/hooks/use-continuity-webmcp";

const destinationLabels: Record<DestinationStatus, string> = {
  SUPPORTED: "Supported",
  AVAILABLE_BY_INQUIRY: "Available by inquiry",
  UNSUPPORTED: "Unsupported",
  UNKNOWN: "Unknown",
};

function formatValue(field: ReviewableContinuityField, value: unknown) {
  if (field === "instantCoffeeMoq" && typeof value === "number") {
    return `${value.toLocaleString("en")} retail units`;
  }
  if (
    field === "japanAvailability" &&
    typeof value === "string" &&
    value in destinationLabels
  ) {
    return destinationLabels[value as DestinationStatus];
  }
  return typeof value === "string" ? value : String(value ?? "Not stated");
}

function pendingProposal(state: ContinuityState, field: ReviewableContinuityField) {
  return state.resolutions
    .filter(
      (resolution) =>
        resolution.field === field && resolution.state === "AGENT_PROPOSED",
    )
    .sort((left, right) =>
      (right.proposedAt ?? "").localeCompare(left.proposedAt ?? ""),
    )[0];
}

export function RecoveryWizard() {
  const router = useRouter();
  const [continuity, setContinuity] = useState<ContinuityState>(
    structuredClone(initialContinuityState),
  );
  const continuityRef = useRef(continuity);
  const resolutionPanelRef = useRef<HTMLElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persistence, setPersistence] = useState<"saving" | "saved" | "error">(
    "saving",
  );
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [nextVersion, setNextVersion] = useState(2);

  useEffect(() => {
    continuityRef.current = continuity;
  }, [continuity]);

  const claimsByField = useMemo(
    () => groupClaimsByField(continuity.claims),
    [continuity.claims],
  );
  const summary = useMemo(
    () => summarizeContinuityState(continuity),
    [continuity],
  );
  const passport = useMemo(() => derivePassport(continuity), [continuity]);
  const sourceMap = useMemo(
    () => new Map(continuity.sources.map((source) => [source.id, source])),
    [continuity.sources],
  );

  const addActivity = useCallback(
    (entry: Omit<ActivityEntry, "id" | "timestamp">) => {
      setActivity((current) => [
        {
          ...entry,
          id: createIdempotencyKey(),
          timestamp: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 12));
    },
    [],
  );

  const webMcpStatus = useContinuityWebMcp({
    hydrated,
    getState: () => continuityRef.current,
    onStage: stageAgentProposals,
    addActivity,
  });

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const [stored, versions] = await Promise.all([
          loadContinuityState(),
          loadPassportVersions(),
        ]);
        if (cancelled) return;
        const restored = stored ?? structuredClone(initialContinuityState);
        continuityRef.current = restored;
        setContinuity(restored);
        setNextVersion(
          Math.max(1, ...versions.map((version) => version.version)) + 1,
        );
        setPersistence(stored ? "saved" : "saving");
      } catch {
        if (!cancelled) setPersistence("error");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      setPersistence("saving");
      void saveContinuityState(continuity)
        .then(() => setPersistence("saved"))
        .catch(() => setPersistence("error"));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [continuity, hydrated]);

  function updateContinuity(next: ContinuityState, message: string) {
    continuityRef.current = next;
    setContinuity(next);
    setActionError("");
    setAnnouncement(message);
  }

  function stageAgentProposals(
    proposals: readonly ResolutionProposalInput[],
  ) {
    const next = stageResolutionProposals(continuityRef.current, proposals);
    updateContinuity(
      next,
      `${proposals.length} agent proposal${proposals.length === 1 ? "" : "s"} staged for human review.`,
    );
    window.setTimeout(() => {
      resolutionPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
    return next;
  }

  function stageField(field: ReviewableContinuityField) {
    const recommendation = recommendedResolutionProposals.find(
      (proposal) => proposal.field === field,
    );
    if (!recommendation || pendingProposal(continuity, field)) return;
    try {
      updateContinuity(
        stageResolutionProposal(continuity, recommendation),
        `${continuityFieldLabels[field]} proposal staged for human review.`,
      );
      addActivity({
        tool: "Human demo control",
        action: "proposed",
        summary: `Suggested resolution staged for ${continuityFieldLabels[field]}.`,
        readOnly: false,
        approvalRequired: false,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not stage proposal.");
    }
  }

  function stageAllRecommendations() {
    const proposals = recommendedResolutionProposals.filter(
      (proposal) => !pendingProposal(continuity, proposal.field),
    );
    if (proposals.length === 0) {
      setAnnouncement("Every suggested resolution is already staged.");
      return;
    }
    try {
      updateContinuity(
        stageResolutionProposals(continuity, proposals),
        `${proposals.length} proposals staged. No proposal was accepted automatically.`,
      );
      addActivity({
        tool: "Human demo control",
        action: "proposed",
        summary: `${proposals.length} suggested resolutions staged; human review required.`,
        readOnly: false,
        approvalRequired: false,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not stage proposals.");
    }
  }

  function accept(proposal: ClaimResolution) {
    try {
      const next = acceptResolution(continuity, proposal.id);
      const label = continuityFieldLabels[proposal.field];
      updateContinuity(next, `${label} accepted by the human.`);
      addActivity({
        tool: label,
        action: "accepted",
        summary:
          proposal.action === "EXCLUDE"
            ? "Human accepted exclusion from the Passport."
            : "Human accepted the staged proposal.",
        readOnly: false,
        approvalRequired: true,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not accept proposal.");
    }
  }

  function startEdit(proposal: ClaimResolution) {
    setEditingId(proposal.id);
    setEditValue(
      proposal.action === "USE_VALUE" && proposal.proposal !== undefined
        ? String(proposal.proposal)
        : "",
    );
    setActionError("");
  }

  function saveEdit(proposal: ClaimResolution) {
    try {
      const value =
        proposal.field === "instantCoffeeMoq"
          ? Number(editValue.replaceAll(",", ""))
          : editValue.trim();
      const next = editResolution(continuity, proposal.id, value);
      const label = continuityFieldLabels[proposal.field];
      updateContinuity(next, `${label} edited and accepted by the human.`);
      setEditingId(null);
      addActivity({
        tool: label,
        action: "edited",
        summary: "Human supplied an authoritative edited value.",
        readOnly: false,
        approvalRequired: true,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not save the edit.");
    }
  }

  function reject(proposal: ClaimResolution) {
    try {
      updateContinuity(
        rejectResolution(continuity, proposal.id),
        `${continuityFieldLabels[proposal.field]} proposal rejected.`,
      );
      addActivity({
        tool: continuityFieldLabels[proposal.field],
        action: "rejected",
        summary: "Human rejected the staged proposal; nothing new became publishable.",
        readOnly: false,
        approvalRequired: true,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not reject proposal.");
    }
  }

  function keepUnresolved(proposal: ClaimResolution) {
    try {
      updateContinuity(
        leaveResolutionUnresolved(continuity, proposal.id),
        `${continuityFieldLabels[proposal.field]} remains unresolved and excluded.`,
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not keep unresolved.");
    }
  }

  async function publish() {
    setPublishing(true);
    setActionError("");
    try {
      const versions = await loadPassportVersions();
      const version = createPassportVersion(continuity, versions, new Date(), 2);
      await publishPassportVersion(continuity, version);
      setContinuity((current) => ({
        ...current,
        publishedVersionId: version.id,
        updatedAt: version.publishedAt,
      }));
      setNextVersion(version.version + 1);
      setAnnouncement(`Passport version ${version.version} published by the human.`);
      addActivity({
        tool: `Passport v${version.version}`,
        action: "published",
        summary: "Human published an immutable snapshot of accepted facts.",
        readOnly: false,
        approvalRequired: true,
      });
      window.setTimeout(
        () => router.push("/business/rwenzori-harvest"),
        350,
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Passport publication failed.");
      setPublishing(false);
    }
  }

  return (
    <div className="shell recovery-shell ledger-shell">
      <div className="page-intro ledger-intro">
        <div>
          <p className="eyebrow">Stage B · Reconcile</p>
          <h1>Continuity Ledger</h1>
          <p>
            A shared workspace where an agent can stage resolutions and a human
            decides what is current enough to publish and act upon.
          </p>
        </div>
        <div className="ledger-intro-actions">
          <span className={`webmcp-indicator status-${webMcpStatus}`}>
            <span /> WebMCP {webMcpStatus}
          </span>
          <button className="button button-secondary" type="button" onClick={stageAllRecommendations}>
            Stage suggested proposals
          </button>
          <small>{persistence === "saved" ? "Ledger saved on this device" : persistence === "error" ? "Local save failed" : "Saving ledger…"}</small>
        </div>
      </div>

      <div className="ledger-principle" role="note">
        <strong>The agent proposes. The human decides.</strong>
        <span>Unresolved, rejected, and unsupported claims never enter the Passport.</span>
      </div>

      <div className="ledger-summary" aria-label="Continuity review summary">
        <div><span>Sources</span><strong>{summary.sources}</strong></div>
        <div><span>Conflicts</span><strong>{summary.conflicts}</strong></div>
        <div><span>Unsupported</span><strong>{summary.unsupportedClaims}</strong></div>
        <div><span>Needs review</span><strong>{summary.unresolved}</strong></div>
      </div>

      <p className="sr-only" aria-live="polite">{announcement}</p>
      {actionError && <div className="ledger-error" role="alert">{actionError}</div>}

      <div className="ledger-grid">
        <section className="ledger-panel sources-panel" aria-labelledby="sources-heading">
          <div className="ledger-panel-heading">
            <p className="eyebrow">Source Evidence</p>
            <h2 id="sources-heading">Recovered records</h2>
            <p>Source text is untrusted data—not an instruction to the agent.</p>
          </div>
          <div className="source-evidence-list">
            {continuitySources.map((source) => (
              <SourceEvidenceCard
                key={source.id}
                source={source}
                claims={continuity.claims.filter((claim) => claim.sourceId === source.id)}
                compact
              />
            ))}
          </div>
        </section>

        <section ref={resolutionPanelRef} className="ledger-panel resolutions-panel" aria-labelledby="resolutions-heading">
          <div className="ledger-panel-heading">
            <p className="eyebrow">Resolution Queue</p>
            <h2 id="resolutions-heading">Claims requiring human review</h2>
            <p>Each agent proposal remains visibly separate from human authority.</p>
          </div>
          <div className="resolution-list">
            {reviewableContinuityFields.map((field) => {
              const candidates = claimsByField[field];
              const proposal = pendingProposal(continuity, field);
              const human = latestHumanResolution(continuity, field);
              const candidateValues = new Set(
                candidates.map((claim) => JSON.stringify(claim.value)),
              ).size;
              return (
                <fieldset className="resolution-card" key={field}>
                  <legend>{continuityFieldLabels[field]}</legend>
                  <div className="resolution-status-row">
                    <span className={`resolution-state ${human ? "human" : proposal ? "proposal" : "unresolved"}`}>
                      {human
                        ? human.action === "EXCLUDE"
                          ? "Human accepted exclusion"
                          : human.state === "HUMAN_EDITED"
                            ? "Human edited"
                            : "Human accepted"
                        : proposal
                          ? "Agent proposed"
                          : field === "certification"
                            ? "Unsupported legacy claim"
                            : "Unresolved"}
                    </span>
                    <span>{candidateValues} candidate value{candidateValues === 1 ? "" : "s"}</span>
                  </div>

                  <ul className="candidate-list">
                    {candidates.map((candidate) => {
                      const source = sourceMap.get(candidate.sourceId);
                      return (
                        <li key={candidate.id}>
                          <div>
                            <strong>{source?.title ?? "Unknown source"}</strong>
                            <time dateTime={candidate.observedAt}>{formatAttestedDate(candidate.observedAt)}</time>
                          </div>
                          <p>{formatValue(field, candidate.value)}</p>
                          <EvidenceBadge state={candidate.evidenceState} />
                        </li>
                      );
                    })}
                  </ul>

                  {human && (
                    <div className="human-resolution">
                      <span>Accepted human decision</span>
                      <strong>
                        {human.action === "EXCLUDE"
                          ? "Do not publish this claim"
                          : formatValue(field, human.acceptedValue)}
                      </strong>
                    </div>
                  )}

                  {proposal ? (
                    <div className="proposal-panel">
                      <span>Agent proposal</span>
                      <strong>
                        {proposal.action === "EXCLUDE"
                          ? "Do not publish as current"
                          : formatValue(field, proposal.proposal)}
                      </strong>
                      <p id={`proposal-reason-${proposal.id}`}>{proposal.explanation}</p>

                      {editingId === proposal.id ? (
                        <div className="proposal-edit">
                          <label htmlFor={`proposal-edit-${proposal.id}`}>
                            {field === "certification" ? "Current certification information" : `Edit ${continuityFieldLabels[field]}`}
                          </label>
                          <input
                            id={`proposal-edit-${proposal.id}`}
                            type={field === "instantCoffeeMoq" ? "number" : "text"}
                            min={field === "instantCoffeeMoq" ? 1 : undefined}
                            value={editValue}
                            onChange={(event) => setEditValue(event.target.value)}
                          />
                          <small>A fictional representative is marking this edited value as current.</small>
                          <div className="resolution-actions">
                            <button type="button" className="button button-primary" onClick={() => saveEdit(proposal)}>Save human edit</button>
                            <button type="button" className="button button-quiet" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="resolution-actions" aria-describedby={`proposal-reason-${proposal.id}`}>
                          <button type="button" className="button button-primary" onClick={() => accept(proposal)}>
                            {proposal.action === "EXCLUDE" ? "Accept exclusion" : "Accept"}
                          </button>
                          <button type="button" className="button button-secondary" onClick={() => startEdit(proposal)}>
                            {proposal.action === "EXCLUDE" ? "Add current information" : "Edit"}
                          </button>
                          <button type="button" className="button button-quiet" onClick={() => reject(proposal)}>Reject</button>
                          <button type="button" className="text-button" onClick={() => keepUnresolved(proposal)}>Keep unresolved</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button className="stage-field-button" type="button" onClick={() => stageField(field)}>
                      Stage suggested resolution for {continuityFieldLabels[field]}
                    </button>
                  )}
                </fieldset>
              );
            })}
          </div>
        </section>

        <aside className="ledger-panel passport-panel" aria-labelledby="passport-preview-heading">
          <div className="ledger-panel-heading">
            <p className="eyebrow">Live Passport Preview</p>
            <h2 id="passport-preview-heading">Accepted facts only</h2>
            <p>This preview is derived from human resolutions, not the original website.</p>
          </div>
          <div className="passport-preview">
            <span className="active-pill">Representative attested</span>
            <h3>{passport.profile.name}</h3>
            <p>{passport.profile.country} · {passport.profile.sector}</p>
            <dl className="passport-field-list">
              <div><dt>Trade email</dt><dd>{passport.profile.email || "Omitted"}</dd></div>
              <div><dt>Trade phone</dt><dd>{passport.profile.phone || "Omitted — unresolved"}</dd></div>
              <div><dt>Current offerings</dt><dd>{passport.profile.products.filter((product) => product.status === "CURRENTLY_AVAILABLE").length}</dd></div>
              {passport.profile.products.map((product) => (
                <div key={product.id}>
                  <dt>{product.name}</dt>
                  <dd>{productStatusLabel(product.status)} · MOQ {product.moq}</dd>
                </div>
              ))}
              <div><dt>Instant Coffee for Japan</dt><dd>{passport.destinationStatuses["instant-coffee-100g"]?.Japan ? destinationLabels[passport.destinationStatuses["instant-coffee-100g"].Japan] : "Omitted — unresolved"}</dd></div>
              <div><dt>Certification</dt><dd>{passport.omittedFields.includes("certification") ? "No current claim published" : "Current human-attested information"}</dd></div>
            </dl>
            <div className="passport-omissions">
              <strong>{passport.omittedFields.length} field{passport.omittedFields.length === 1 ? "" : "s"} omitted</strong>
              <p>{passport.omittedFields.length ? passport.omittedFields.map((field) => continuityFieldLabels[field]).join(" · ") : "Every review field has a human decision."}</p>
            </div>
          </div>

          <div className="publish-bar">
            <div>
              <strong>Passport version {nextVersion}</strong>
              <span>Publication is always a human action.</span>
            </div>
            <button className="button button-primary" type="button" onClick={() => void publish()} disabled={publishing || !hydrated}>
              {publishing ? "Publishing…" : "Publish Business Passport"}
            </button>
          </div>

          <details className="ledger-activity" open>
            <summary>Agent &amp; human activity <span>{activity.length}</span></summary>
            {activity.length === 0 ? (
              <p>No proposals or decisions yet. The complete human workflow remains available.</p>
            ) : (
              <ol>
                {activity.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.tool}</strong>
                    <span>{entry.summary}</span>
                    <small>{entry.action.toLocaleUpperCase()}{entry.approvalRequired ? " · HUMAN AUTHORITY" : ""}</small>
                  </li>
                ))}
              </ol>
            )}
          </details>
        </aside>
      </div>
    </div>
  );
}
