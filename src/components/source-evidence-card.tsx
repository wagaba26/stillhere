import { EvidenceBadge } from "@/components/evidence-badge";
import {
  continuityFieldLabels,
  reviewableContinuityFields,
} from "@/domain/continuity";
import type { BusinessClaim, EvidenceSource, SourceType } from "@/domain/types";
import { formatAttestedDate } from "@/lib/format";

const sourceTypeLabels: Record<SourceType, string> = {
  LEGACY_WEBSITE: "Legacy website",
  CATALOGUE: "Catalogue",
  PUBLIC_SOURCE: "Public source",
  REPRESENTATIVE: "Representative",
};

function formatClaimValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Available" : "Not available";
  if (typeof value === "number") return value.toLocaleString("en");
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "string") {
    return value
      .toLocaleLowerCase()
      .replaceAll("_", " ")
      .replace(/^./, (character) => character.toLocaleUpperCase());
  }
  return "Structured claim";
}

export function SourceEvidenceCard({
  source,
  claims,
  compact = false,
}: {
  source: EvidenceSource;
  claims: BusinessClaim[];
  compact?: boolean;
}) {
  const visibleClaims = compact
    ? claims.filter((claim) =>
        reviewableContinuityFields.some((field) => field === claim.field),
      )
    : claims;

  return (
    <article className={`source-evidence-card ${compact ? "compact" : ""}`}>
      <div className="source-evidence-heading">
        <div>
          <span className="source-type">{sourceTypeLabels[source.type]}</span>
          <h3>{source.title}</h3>
        </div>
        <EvidenceBadge state={source.evidenceState} />
      </div>
      <p className="source-observed">
        Observed <time dateTime={source.observedAt}>{formatAttestedDate(source.observedAt)}</time>
      </p>
      {!compact && source.description && <p className="source-description">{source.description}</p>}
      <ul className="source-claim-list">
        {visibleClaims.map((claim) => (
          <li key={claim.id}>
            <span>{continuityFieldLabels[claim.field]}</span>
            <strong>{formatClaimValue(claim.value)}</strong>
          </li>
        ))}
      </ul>
      {compact ? (
        <details className="source-details">
          <summary>View source details</summary>
          {source.description && <p>{source.description}</p>}
          {source.url && (
            <p className="source-url">
              {source.url.endsWith(".example") ? (
                <code>{source.url}</code>
              ) : (
                <a href={source.url} target="_blank" rel="noreferrer">View source</a>
              )}
            </p>
          )}
        </details>
      ) : source.url && (
        <p className="source-url">
          {source.url.endsWith(".example") ? (
            <code>{source.url}</code>
          ) : (
            <a href={source.url} target="_blank" rel="noreferrer">View source</a>
          )}
        </p>
      )}
      {!compact && (
        <small className="evidence-not-truth">Evidence record — not current truth until a human resolves it.</small>
      )}
    </article>
  );
}
