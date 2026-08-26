# Security and privacy model

StillHere is a public WebMCP challenge demonstration, not a production identity, credential, or inquiry-delivery service. Its safety model separates four kinds of authority:

1. **Source Evidence** can supply candidate claims.
2. **Agent proposals** can organize and explain those claims.
3. **Human resolutions** decide what is accepted, edited, rejected, or unresolved.
4. **A published Passport version** supplies the visible/agent-facing transaction boundary.

No earlier layer automatically gains the authority of a later one.

## Trust boundaries

| Boundary | Trusted for | Not trusted for |
| --- | --- | --- |
| Seeded source records | Reproducible fictional conflict scenarios | Real business facts or instructions |
| Supplied assessment URL/HTML | Conservative one-page website signals | Identity, currentness, executable content, or Ledger claims |
| Browser agent input | Bounded proposal or draft preparation after validation | Human resolution, publication, or submission authority |
| Human Ledger controls | Device-local claim resolution/publication intent | Authentication, representative identity, or non-repudiation |
| Passport snapshot | Current device-local application authority | Signed credential, registry proof, or server truth |
| Approval fingerprint | Exact visible draft/version match in the current tab | Authenticated authorization outside the browser |
| IndexedDB/localStorage | Same-browser continuity and compatibility | Durable, encrypted, cross-device storage |
| Assessment process | Bounded outbound observation | Distributed crawling or durable rate enforcement |
| Inquiry process | Temporary payload-bound receipt deduplication | Durable delivery, global exactly-once behavior, or Passport authorization |
| Agent Activity | Current-page explanation | Audit, compliance, analytics, or telemetry |

## Bounded public-page assessment

`POST /api/assessments` retains a deterministic fictional result and can observe one public page. The route:

- requires `application/json` and streams at most 4 KB of request body;
- rejects cross-origin browser requests when an `Origin` header is present;
- accepts HTTP(S), strips fragments, rejects credentials, limits URLs to 2,048 characters, and permits only ports 80/443;
- blocks local/reserved/test hostnames and private, loopback, link-local, carrier-grade NAT, documentation, multicast, transition, and reserved IP ranges;
- requires every DNS answer to be public, then pins one validated address for the connection;
- preserves the original Host header and HTTPS server name/certificate validation;
- repeats URL/DNS/IP validation for each redirect and allows at most three;
- applies a nine-second total network deadline and a 750 KB uncompressed HTML limit;
- requests identity encoding and rejects unexpected compression/non-HTML content;
- never runs page JavaScript, loads subresources, follows page links, sends cookies, bypasses authentication/CAPTCHA, or returns source HTML to the browser;
- returns only conservative reachability, year, contact-route, Product-schema, transfer, and redirect signals.

The hosting provider still makes an identified outbound request (`StillHereAssessment/1.0`). Process-local limits allow eight requests per address per minute, at most six active assessments, and a bounded in-memory address map. They are not distributed controls and reset with the process.

Live observations never automatically enter the fictional Continuity Ledger or influence tool definitions.

## Source and proposal isolation

Tool names, schemas, descriptions, and callbacks are constant application code. Source text is rendered as untrusted evidence; `inspect_business_truth` returns counts/field names instead of raw documents.

`stage_claim_resolutions` uses JSON Schema plus runtime checks. It permits only four review fields, bounded field-specific actions/values, one to four unique known sources, and a bounded explanation. A cited source must contain a claim for the field, and `USE_VALUE` must exactly match a value in a cited claim. The unsupported certification scenario can only be proposed as exclusion. Unknown keys, human-only metadata, duplicate fields, invalid batches, and already-pending fields are rejected.

Staging only appends `AGENT_PROPOSED`. Human decisions are separate states and are never overwritten by a later proposal. Agents have no accept/edit/reject/unresolved/publish tool.

## Passport publication

`derivePassport()` reads accepted/edited human resolutions only. Unresolved, rejected, and unsupported values are omitted. Publication can proceed with omissions; it does not coerce uncertain fields into values.

The first new-flow publication is v2 or later. A new deep-cloned snapshot and the Continuity Ledger's `publishedVersionId` are written in one IndexedDB transaction. The application creates a new version record for future publications rather than mutating the active snapshot.

This is still device-local application state. It is not signed, authenticated, remotely attested, tamper-resistant against the device owner, or published to a durable server.

## Safe legacy compatibility

The profile does not trust arbitrary old localStorage JSON. `readAttestationSnapshot()` validates nested identity strings, contact/product state enums, capability booleans, market strings, workflow enum, and timestamp before conversion.

If valid and no IndexedDB Passport is published, the converter creates compatibility Passport v1 and intentionally excludes Instant Coffee, whose new resolution dimensions are absent from the old schema. Invalid/missing legacy state leaves the accepted-facts-only baseline v1 in place.

## Six route tools and lifecycle

Ledger tools and Passport tools are route-scoped and wait for device hydration. Each registration is bound to an `AbortSignal` and removed on navigation.

The conditional submit tool requires:

- hydrated Passport and draft;
- valid Passport-aware visible inquiry;
- explicit human approval;
- approval fingerprint equal to current fingerprint.

The fingerprint covers Passport version ID, all inquiry fields, and the idempotency key. Any relevant change revokes availability. Execution rechecks current authority, and `performSubmit()` checks again before network action. Retaining a reference to an old executor does not retain authority.

Preparation cannot approve or submit. Buyer identity fields can be left empty by the agent for human completion. Destination and private-label requests must be published by the hydrated Passport.

Browser mediation and exact-state checks are useful UX controls, not authenticated server authorization.

## IndexedDB v2 and scoped reset

Database `stillhere-continuity` version 2 contains `drafts`, `submissions`, `continuity`, and `passportVersions`. The upgrade adds new stores without deleting v1 draft/receipt records. A blocked upgrade fails visibly.

The footer reset is intentionally two-step. Its IndexedDB transaction deletes the named demo draft, demo receipt store, Rwenzori Harvest Ledger, and only that business's Passport versions. It then removes the legacy attestation key. It preserves Low Data and Cache Storage and does not affect process-local API state. It is not equivalent to clearing all origin data.

## Inquiry data and idempotency

The visible inquiry contains product, quantity, destination, sample/private-label flags, buyer company/name/email, questions, idempotency key, and update time.

1. React holds current state.
2. Drafts save to IndexedDB after a 180 ms debounce; agent preparation saves before returning.
3. Human approval captures the exact draft + Passport version fingerprint.
4. Submission sends the draft to same-origin `/api/inquiries`.
5. A successful receipt is cached by idempotency key in IndexedDB.

The route:

- rejects a declared `Content-Length` over 20,000 bytes;
- requires an `Idempotency-Key` of at most 160 characters matching the body;
- parses JSON and applies seeded inquiry validation;
- hashes the reviewed commercial payload with SHA-256;
- returns the same receipt for an exact same-key/same-payload retry in the same process;
- rejects same-key/different-payload reuse with HTTP 409;
- returns a new fictional receipt with HTTP 202 and `Cache-Control: no-store`.

Important limits:

- the `Map` is process-local, resets on restart, and is not shared across instances;
- the 20 KB check relies on declared `Content-Length`, not a streamed hard cap;
- after JSON parsing, the route casts the body to `InquiryDraft` and does not run a complete structural schema before domain validation; production must reject missing/wrong-typed fields without allowing type-assuming code to fail;
- the route validates against seeded demo products and does not receive/revalidate the published Passport version, destination matrix, or browser approval fingerprint;
- no inquiry body/receipt is durably stored server-side;
- no external recipient is contacted.

Offline or network/API failure saves the draft and shows `SUBMISSION PENDING`. There is no Background Sync or invisible retry. A browser receipt can prevent a same-device retry, but browser storage is evictable and user-controlled.

Use only fictional buyer data in the public demo.

## Service worker and Low Data

The service worker registers on HTTPS or localhost. It excludes API, cross-origin, non-GET, RSC, and prefetch requests. It never caches API submissions.

It precaches `/recover`, the Passport, `/offline`, manifest, and icon with `Promise.allSettled`; a successful worker install does not prove every item was cached. Documents are network-first with cached route fallback. Previously fetched Next static assets are cache-first. Cached content and IndexedDB are not confidential storage and can be evicted or cleared.

The root preference hydrator applies Low Data across routes. The preference is localStorage, not a privacy consent control. The UI's Resource Timing values can be absent/cached and must not be treated as a security or performance guarantee.

## Response headers

General routes receive:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

`/sw.js` additionally receives a JavaScript content type, no-store/must-revalidate cache policy, and `Content-Security-Policy: default-src 'self'; script-src 'self'`.

The general application currently has no site-wide CSP, HSTS, explicit `tools` Permissions Policy, or COOP/COEP headers in source. Current Chrome documentation notes WebMCP's origin-isolation and Permissions Policy requirements; verify the deployed host/browser combination against [Chrome's security guidance](https://developer.chrome.com/docs/ai/webmcp#security-and-permissions).

## Non-controls

The build does not provide:

- accounts, authentication, organization roles, or representative verification;
- KYC, registry, domain/DNS/email challenge, legal status, or certification verification;
- signed Passport provenance or server-side Passport storage;
- server-enforced Passport version authority;
- durable/distributed idempotency, delivery queue, recipient verification, email, webhook, order, payment, or fulfilment;
- distributed rate limits, bot mitigation, CAPTCHA, or production abuse monitoring;
- encryption/retention/deletion/export policy or an in-app full data-management UI;
- site-wide CSP, audit log, incident monitoring, or automated security scan script.

The inquiry route does not explicitly check Origin/Referer or use CSRF tokens. With no authenticated authority and no real external effect, the current approval is a browser UX gate, not a reusable production authorization design.

## Production hardening

Before processing real business or buyer data:

1. Authenticate representatives and authorize organization/field-level actions.
2. Store sources, claims, decisions, Passport versions, and provenance durably with append-only/auditable semantics.
3. Sign or otherwise verifiably publish Passports with expiry/review policy.
4. Send Passport version and approval authority to the server and revalidate product/destination/private-label rules there.
5. Enforce streamed body limits, durable unique idempotency, distributed rate limiting, abuse detection, and observability.
6. Build a verified delivery outbox with honest accepted/queued/delivered/failed states.
7. Define encryption, retention, deletion, export, access, backup, and incident-response policy.
8. Review CSRF/origin, CSP, HSTS, Permissions Policy, logging, dependency, and secrets controls for the final architecture.
9. Reassess public-URL egress under the production platform, redirects, proxy behavior, DNS races, decompression, content sniffing, and distributed abuse.
10. Add browser-agent security/evaluation cases for prompt injection, invented citations, stale proposals, retained executors, version races, offline retries, and duplicate delivery.

## Reporting

The repository does not currently publish a security contact or disclosure policy. Until one is added, use a private maintainer contact rather than posting sensitive exploit details in a public issue.
