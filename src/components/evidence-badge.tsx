import type { EvidenceState } from "@/domain/types";
import { evidenceLabel } from "@/lib/format";

export function EvidenceBadge({ state }: { state: EvidenceState }) {
  return (
    <span className={`evidence-badge evidence-${state.toLocaleLowerCase()}`}>
      <span aria-hidden="true" className="badge-dot" />
      {evidenceLabel(state)}
    </span>
  );
}
