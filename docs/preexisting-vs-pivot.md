# Pre-existing Application vs Continuity Pivot

StillHere began as a functioning WebMCP challenge application. The pivot is additive: it preserves the original routes and safety work while changing the product's primary truth model from a generic attestation snapshot to a shared Continuity Ledger and derived Passport.

## Existing before the pivot

- `/assessment` with a deterministic fictional demo and a bounded public-page observer.
- SSRF-resistant `safe-site-fetch` controls for protocol, credentials, ports, DNS/IP ranges, redirects, timeout, content type, encoding, and response size.
- A six-step information-attestation wizard on `/recover`.
- A public Rwenzori Harvest profile and B2B inquiry form.
- Low Data preference and resource-footprint display.
- Production service-worker registration, cached profile/offline shell, and honest offline submission state.
- IndexedDB inquiry drafts and device-local receipt persistence.
- Direct `document.modelContext.registerTool(...)` integration with AbortController cleanup.
- Business status, offering search, inquiry preparation, and dynamically approval-gated submission tools.
- Visible agent-prepared fields, human editing, explicit approval, idempotency key use, and fictional demo receipts.

## Added during the pivot

- First-class `EvidenceSource`, `BusinessClaim`, `ClaimResolution`, `ContinuityState`, `BusinessPassport`, destination-status, and Passport-version concepts.
- Four fictional evidence source types: legacy website, catalogue, public source, and representative.
- Explicit phone, Instant Coffee MOQ, Japan availability, and unsupported-certification reconciliation scenarios.
- Pure continuity conflict, proposal, human-decision, summary, Passport derivation, and versioning functions.
- Recovered Evidence presentation on seeded assessment results.
- The three-panel `/recover` Continuity Ledger with Source Evidence, Resolution Queue, and live accepted-facts Passport preview.
- Agent proposal staging with strict field/value/source validation and no acceptance or publication authority.
- Human accept, edit, reject, exclusion, unresolved, and representative-value controls.
- Latest-human-decision precedence, including later rejection/unresolved decisions superseding older acceptance.
- IndexedDB schema version 2 with additive `continuity` and `passportVersions` stores.
- Atomic Passport snapshot/publication-pointer persistence and validated legacy-attestation fallback.
- Published profile hydration from Passport version, compatibility snapshot, or safe accepted-facts baseline.
- Product search and inquiry preparation bound to the same hydrated Passport.
- `AVAILABLE_BY_INQUIRY` destination qualification for Instant Coffee in Japan.
- Two recovery WebMCP tools and the renamed `get_business_passport`, producing six purposeful tools across the two routes.
- Exact-draft/Passport-version approval fingerprint and stale-executor rejection.
- Scoped two-step demo reset, global Low Data hydration, cached `/recover`, and stricter service-worker exclusions.
- Expanded migration, reset, human-authority, Passport, search, preparation, and WebMCP tests.

## Preserved by design

- Existing route URLs and the no-login demo.
- Next.js/Vercel deployment model and lightweight dependency set.
- The original visual language, semantic HTML, visible focus, and responsive layout.
- Human-only final approval and progressive enhancement without WebMCP.
- The bounded assessment instead of an unrestricted crawler.
- Honest limitations: no identity proof, no real delivery, no durable server idempotency, and no cross-device Passport authority.

## Commit provenance

The original commit remains intact as `Build StillHere WebMCP continuity platform`. The pivot follows it as a sequence of focused domain, persistence, UI, WebMCP, profile, inquiry, offline, documentation, and hardening commits so reviewers can inspect the evolution rather than a squashed rewrite.
