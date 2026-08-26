# Security and privacy model

StillHere is a public challenge demonstration, not a production identity-verification or inquiry-delivery service. Its core scope remains narrow: one fictional continuity profile, a bounded one-page public-site observer, fixed demo product data, four explicit page tools, no account system, and no real external inquiry delivery.

## Trust boundaries

| Boundary | Trusted for | Not trusted for |
| --- | --- | --- |
| Seeded demo data | Reproducible fictional UI and domain tests | Real-world business claims |
| Legacy/public source concept | Candidate information and conflict display | Tool definitions, currentness, code, or instructions |
| Supplied assessment URL and remote HTML | A request to observe public page signals | Authorization, trusted instructions, business identity, currentness, or executable content |
| Browser agent input | A proposal to validate and display | Authorization or proof of human intent |
| Human approval checkbox | Current in-page approval signal | Durable identity, authentication, or non-repudiation |
| Browser IndexedDB | Same-device draft/receipt convenience | Durable, encrypted, cross-device storage |
| Demo API process | Returning a temporary receipt | External delivery or globally durable acceptance |
| Agent Activity panel | Current-page explanation | Audit, analytics, or compliance logging |

## Implemented controls

### Bounded public-page observation instead of crawling

`/assessment` retains the deterministic `https://legacy.rwenzoriharvest.example` result and can now submit another public URL to `POST /api/assessments`. The route retrieves one HTML response only; it never renders or executes the page, loads its subresources, follows its links, or returns its source HTML to the browser.

The server-side boundary:

- accepts only HTTP(S), strips fragments, rejects embedded credentials, and permits only ports 80/443;
- blocks local/reserved/test hostnames and private, loopback, link-local, carrier-grade NAT, documentation, multicast and reserved IP ranges;
- requires all DNS answers to be public, then pins a validated address into the connection to reduce DNS-rebinding risk;
- repeats parsing, DNS/IP validation and connection pinning for every redirect and permits at most three redirects;
- preserves the original Host header and TLS server name, so certificate validation remains active;
- enforces a nine-second total network budget and a 750 KB uncompressed HTML limit;
- requests identity encoding, rejects non-HTML and unexpected compressed responses, and returns only conservative derived signals;
- requires same-origin browser requests and applies process-local per-address and concurrency limits.

The remote server still sees a request from the hosting provider with the identified `StillHereAssessment/1.0` user agent. No robots bypass, authentication, CAPTCHA handling, arbitrary headers, cookies, or browser session is attempted.

### Fixed mapping from attested data to tools

Tool names, descriptions, schemas, and execution callbacks are authored in source. Legacy/public text is never interpolated into executable tool definitions. The current demo catalogue is an imported TypeScript object, not fetched page content.

### Progressive enhancement and least capability

Only three tools are available at profile load, two of them read-only. `prepare_business_inquiry` may change visible local state but cannot submit. The consequential `submit_approved_inquiry` is registered only during a valid, explicitly approved UI state.

Registration uses an `AbortSignal`. Editing any field clears approval; clearing approval or invalidating the form triggers React cleanup and aborts the signal, unregistering the tool. Tool execution independently rechecks the latest approval and validation state.

This follows WebMCP's direct, browser-mediated model described by the [WebMCP proposal](https://github.com/webmachinelearning/webmcp) and Chrome's [security and permissions overview](https://developer.chrome.com/docs/ai/webmcp#security-and-permissions). Browser mediation does not replace application authorization.

### Input boundaries

WebMCP tools set `additionalProperties: false` and size/type constraints in their JSON Schemas. Runtime helpers also:

- reject non-object input;
- trim and cap strings;
- reject non-finite numbers;
- require quantity to be a positive integer;
- validate required fields again after preparation.

`search_current_offerings` clamps result count to 1–5 even if schema validation is bypassed. It returns only current, evidence-eligible products.

The inquiry API:

- rejects a declared body over 20,000 bytes;
- requires a nonempty `Idempotency-Key` no longer than 160 characters;
- parses JSON with an explicit error response;
- requires the header and reviewed draft key to match;
- repeats domain validation;
- returns `Cache-Control: no-store` on a newly accepted demo receipt.

The `Content-Length` check alone is not a streaming hard limit when the header is missing or inaccurate. A production deployment should enforce request-size limits at the platform/proxy and parser boundaries too.

The assessment API independently reads its JSON body as a stream with a 4 KB hard limit, rejects cross-origin browser requests, and never reflects remote HTML. Its rate limiter is deliberately bounded in memory but is process-local and therefore not a distributed abuse control.

### Idempotency and honest failure

The browser creates a draft key and stores successful receipts in IndexedDB. Before a request, it checks for a receipt with the same key. The API also keeps a process-local `Map`, binds an accepted key to a SHA-256 hash of the reviewed payload, returns the earlier receipt for an exact in-process retry, and rejects reuse of the key with changed payload.

Offline or failed requests save the draft and set `SUBMISSION PENDING`; they never fabricate a receipt. No Background Sync or automatic retry runs without a visible user action.

These controls reduce accidental duplicates in the demo but do not guarantee distributed exactly-once behavior. Server restarts, another deployment instance, another device, or cleared site data can bypass the local ledgers.

### Response and browser headers

`next.config.ts` applies:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

`/sw.js` additionally receives an explicit JavaScript content type, no-store cache policy, and `Content-Security-Policy: default-src 'self'; script-src 'self'`.

These are useful baseline controls, not a complete application Content Security Policy. The general application responses do not currently set a CSP, HSTS, Permissions Policy, or COOP/COEP headers in source.

### Data minimization

Agent Activity retains at most 12 entries in React state and records summaries rather than buyer field values. There is no third-party analytics or telemetry dependency.

The business profile uses system fonts and no remote media, map, social embed, or advertising script. This limits passive third-party data disclosure.

## Buyer data lifecycle

The visible inquiry contains company, contact name, email, destination, product, quantity, flags, and questions.

1. During editing, React holds the current draft in memory.
2. After hydration, changes are saved to IndexedDB after a 180 ms debounce. Agent preparation saves immediately.
3. On submit, the full draft is sent to the same-origin `/api/inquiries` route.
4. A successful receipt is stored in IndexedDB by idempotency key.
5. The API keeps the receipt, not a separate persisted draft, in its process-local `Map`. The request body still passes through the hosting/runtime infrastructure.

There is no in-app delete/export UI. A user can remove local data by clearing site data for the origin. Browser storage can also be evicted automatically. A real deployment needs explicit retention, deletion, access, and encryption policies before collecting personal or commercial information.

Use only fictional values in the challenge demo.

## Service worker scope

The service worker registers only on HTTPS or localhost. It intercepts same-origin GET requests but excludes `/api/`, React Server Component requests, and router prefetches. API submissions are never cached.

Navigation is network-first. A previously cached business profile can be returned offline; otherwise the cached offline page is used. Static Next.js assets are cached on first successful fetch. Cache entries and the profile response are not confidential storage.

## Important non-controls and limitations

The current build does not implement:

- authentication, authorization, account recovery, or representative verification;
- KYC, legal status, registry, DNS, domain-email, or certification validation;
- CSRF tokens or an explicit Origin/Referer check on the demo inquiry route (the assessment route does enforce same-origin browser requests);
- distributed rate limiting, bot mitigation, CAPTCHA, anomaly detection, or abuse queues (the assessment route has only process-local throttling);
- a durable database, multi-region idempotency, encryption policy, or backup/restore;
- verified recipients, email delivery, webhooks, fulfilment, orders, or payments;
- server-side output escaping beyond framework defaults or a site-wide CSP;
- security monitoring, audit logs, data-subject workflows, or incident response automation;
- automated dependency/security scanning in the repository scripts.

Because the demo has no authenticated account and creates no real-world side effect, the approval checkbox is a UX safety gate, not an authorization system. It must not be reused as one in production.

## Production hardening checklist

Before processing real inquiries:

1. Define representative identity, organization, and role authorization.
2. Store attestations and source evidence with issuer, scope, timestamps, expiry, and review history.
3. Add durable storage with a unique idempotency constraint and transactional delivery/outbox design.
4. Verify recipients and make delivery status explicit (`accepted`, `queued`, `delivered`, `failed`) rather than equating API acceptance with delivery.
5. Enforce request limits at the edge and application, then add rate limiting and abuse detection.
6. Review CSRF/origin protections for the final authentication architecture.
7. Establish CSP, HSTS, Permissions Policy, secure logging, alerting, dependency review, and secrets management.
8. Add data-retention, deletion, export, encryption, access-control, and privacy-notice workflows.
9. Reassess URL ingestion under production traffic, including alternate IP encodings, DNS behavior, proxy/platform egress, redirect races, decompression, content sniffing and distributed abuse.
10. Run browser-agent security tests for prompt injection, schema bypass, approval revocation races, duplicate delivery, stale state, and cross-origin embedding.

Chrome's [WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp) notes that the API is gated by origin isolation and a `tools` Permissions Policy. Deployment verification should confirm the selected host/browser combination satisfies current requirements rather than assuming local feature detection proves production availability.

## Reporting

This repository does not currently publish a security contact or vulnerability disclosure policy. Until one is added, report issues through the repository's private maintainer contact rather than including sensitive exploit details in a public issue.
