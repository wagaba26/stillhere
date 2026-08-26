# Continuity Ledger

The Continuity Ledger is StillHere's shared human-agent workspace for deciding which recovered business claims are current enough to publish and act on.

It implements this sequence:

```text
Recover evidence
  → identify agreement, conflict, uncertainty, and unsupported claims
  → let an agent stage bounded source-backed proposals
  → let a human accept, edit, reject, exclude, or keep unresolved
  → derive an accepted-facts-only Passport preview
  → let the human publish an immutable-by-workflow Passport version
```

## Canonical state

The Ledger stores four related concepts:

- `EvidenceSource` describes where and when a record was observed.
- `BusinessClaim` keeps each source value separate from current truth.
- `ClaimResolution` records agent proposals and human decisions as history.
- `PassportVersion` stores the complete derived snapshot, version number, publication time, and contributing resolution IDs.

The pure rules live in `src/domain/continuity.ts` and `src/domain/passport.ts`. React components, persistence code, and WebMCP tools call those rules rather than maintaining parallel interpretations.

## Authority model

An agent may inspect a bounded summary and stage proposals. It cannot:

- accept or edit a proposal;
- reject or mark a claim unresolved;
- add a representative-attested value;
- publish a Passport;
- approve or submit an inquiry.

The effective value for a field comes from its latest human decision. A later agent proposal remains pending and cannot replace an accepted value. A later human rejection or unresolved decision does supersede an older acceptance, so the field is omitted from the derived Passport.

## Seeded review scenarios

The fictional Rwenzori Harvest demo contains four source types and four deliberate review cases:

| Field | Source disagreement | Recommended handling |
| --- | --- | --- |
| Trade phone | Three historical values | Use the representative/public value after human review |
| Instant Coffee MOQ | 5,000, 3,000, and 2,500 | Use or edit the representative value |
| Japan availability | Unknown, supported, and representative-qualified | Publish `AVAILABLE_BY_INQUIRY`, not hard support |
| Certification | Unsupported legacy organic claim | Accept exclusion or provide new current evidence |

Stable offerings and private-label capability provide agreement cases so the Ledger is not conflict-only.

## Publication

The live preview always derives from the current Ledger. The public profile continues to show the last explicitly published version until a human selects **Publish Business Passport**.

Publication uses one IndexedDB transaction across `passportVersions` and `continuity`, storing both the snapshot and its `publishedVersionId` pointer. Historical versions contain snapshots rather than references to mutable resolution state.

## Storage and reset

The browser database remains `stillhere-continuity`, schema version 2:

```text
drafts
submissions
continuity
passportVersions
```

The additive upgrade preserves version-1 drafts and receipts. The confirmed demo reset clears the fictional business's Ledger, Passport versions, inquiry draft, receipts, and legacy attestation compatibility key. It preserves Low Data and Cache Storage.

## WebMCP surface

While `/recover` is mounted and hydrated:

- `inspect_business_truth` returns bounded counts and review fields; it is read-only.
- `stage_claim_resolutions` appends validated `AGENT_PROPOSED` records; it cannot resolve or publish.

Schemas guide the browser agent, while strict runtime parsers independently reject extra keys, invented fields or values, invalid action/value pairs, unknown or unrelated source IDs, duplicate fields, and human-only metadata.

## Scope

All seeded sources and representative decisions are fictional. “Representative attested” is a demonstration state, not identity verification, KYC, a registry lookup, or a certification audit. The Ledger is device/origin-local and does not implement multi-user synchronization.
