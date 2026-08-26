# StillHere

> The website may be outdated. The business isn't.

StillHere is business continuity infrastructure for the long tail of the web. It recovers candidate facts from a stale digital presence, asks a business representative to attest what is current, and publishes a small continuity profile that people and browser agents can use together.

This repository is a submission to the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). It uses the current experimental WebMCP API directly: search the source for [`registerTool`](src/hooks/use-webmcp.ts).

**Live demo:** [stillhere-azure.vercel.app](https://stillhere-azure.vercel.app)

## Why this exists

An active business can have a website that is abandoned, heavy, or unreliable. Agent tooling can make that site easier to operate, but it cannot make stale claims true.

StillHere takes a different sequence:

1. **Assess** the digital presence without inferring that the business is closed.
2. **Recover and attest** individual contacts, offerings, capabilities, and one useful workflow.
3. **Publish** a lightweight profile with explicit evidence states.
4. **Collaborate** through a few purposeful WebMCP tools while keeping consequential action visible and human-approved.

The challenge build demonstrates this flow with the fictional **Rwenzori Harvest Coffee Ltd**. It can also make a bounded observation of one public HTML page, but it does not crawl a site, verify identity or legal status, or deliver a real inquiry to an external business.

## What makes it different

| Existing automation pattern | StillHere |
| --- | --- |
| Make an existing website easier for an agent to operate | First establish which information is current, then expose a continuity surface |
| Infer actions from a large or changing interface | Declare four small, task-specific browser tools |
| Treat machine readability as the goal | Treat evidence, currentness, and human control as prerequisites |
| Let the agent act behind the interface | Put prepared values, approval, submission state, and errors in the visible UI |

**An agent-ready version of stale information is still stale information.**

## Demo at a glance

- No account, API key, seed command, or environment variable is required.
- The assessment keeps `https://legacy.rwenzoriharvest.example` as a deterministic demo and also accepts ordinary public HTTP(S) websites through the bounded one-page assessment API.
- The six-step Information Attestation wizard saves a fictional, device-local attestation snapshot and publishes it into `/business/rwenzori-harvest`.
- Three WebMCP tools are registered on the profile initially.
- A fourth submission tool exists only while the visible form is valid and the human approval checkbox remains checked.
- Drafts and demo receipts are stored in browser IndexedDB. The demo API only returns a receipt; it sends no email, order, payment, or external message.

See the [under-three-minute demo script](docs/demo-script.md) for the exact judge flow.

## Screenshots

The final submission package should capture the deployed landing page, the Information Attestation review, the agent-prepared inquiry, and the approval-gated tool lifecycle after the public repository and demo video are frozen.

## Architecture

```text
Next.js App Router
├─ bounded one-page assessment API + deterministic demo
├─ attested fictional business data + domain rules
├─ public continuity profile
│  ├─ visible inquiry state and approval
│  └─ direct document.modelContext.registerTool(...) integration
├─ IndexedDB drafts and receipts
├─ service worker + Cache Storage profile fallback
├─ POST /api/assessments (SSRF-resistant public-page observation)
└─ POST /api/inquiries (process-local demo receipt ledger)
```

The browser tab is the collaboration boundary: WebMCP tools reuse the same domain functions and form state that the human sees. No separate MCP server or agent-only workflow is involved. Read the full [architecture](docs/architecture.md), [WebMCP implementation notes](docs/webmcp.md), and [security model](docs/security.md).

## WebMCP tools

| Tool | Availability | Effect |
| --- | --- | --- |
| `get_business_status` | While the profile is open | Returns compact attested status and capabilities; read-only |
| `search_current_offerings` | While the profile is open | Returns only currently available, evidence-eligible products; read-only |
| `prepare_business_inquiry` | While the profile is open | Updates and highlights the visible form, validates it, and saves the draft locally; never submits |
| `submit_approved_inquiry` | Only while the form is valid **and** approved | Revalidates current visible state, calls the demo API, and records the receipt |

The registration lifecycle uses `AbortController`. Base tools are aborted when the profile unmounts. The submit tool is registered by a separate effect when `approved && valid` becomes true, then unregistered immediately by aborting its signal if approval or validity changes.

WebMCP is progressive enhancement. `document.modelContext` is feature-detected, and the complete human form remains usable in an ordinary browser. WebMCP itself is an experimental proposed standard; see the [WebMCP project](https://github.com/webmachinelearning/webmcp), [Chrome overview](https://developer.chrome.com/docs/ai/webmcp), and [Chrome imperative API guide](https://developer.chrome.com/docs/ai/webmcp/imperative-api).

## Run locally

Prerequisites:

- Node.js 24.x (declared in `package.json`)
- npm

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For the complete human path:

1. Select **Try Demo**.
2. Submit the prefilled deterministic URL, or replace it with a public website to test the bounded observer.
3. Select **Recover & attest current information**.
4. Walk through the six attestation screens and publish the demo profile.
5. Complete all required inquiry fields, check the explicit approval control, and select **Send approved inquiry**.

The final step returns a demo receipt only.

## Test WebMCP exactly

Use either ChatGPT's in-app browser, which the [challenge page](https://openai.com/webmcp-challenge/) identifies as WebMCP-capable, or a compatible Chrome build:

1. For local Chrome testing, open `chrome://flags/#enable-webmcp-testing`.
2. Set the flag to **Enabled** and relaunch Chrome, following the [Chrome WebMCP setup](https://developer.chrome.com/docs/ai/webmcp#get-started).
3. Run the app and open `http://localhost:3000/business/rwenzori-harvest`.
4. Confirm the page shows **WebMCP ready** and three tools available.
5. Ask the browser agent: **“Is this business currently active, and find a product suitable for private-label distribution in Japan.”**
6. Confirm calls to `get_business_status` and `search_current_offerings` appear in **Agent Activity**.
7. Ask: **“Prepare an inquiry for 2,000 units of drip-coffee-10pack, requesting samples, private-label packaging and delivery information for Kobe, Japan.”**
8. Confirm `prepare_business_inquiry` visibly fills and highlights the supplied fields, reports the three missing buyer fields, and does **not** submit.
9. Enter fictional buyer details, change quantity to `5000`, add **“Please include Japanese labelling support.”**, and confirm the human-edited fields lose their agent highlight.
10. Check **I have reviewed this inquiry and approve submission**. Confirm `submit_approved_inquiry` becomes available.
11. Ask the agent to submit the approved inquiry. Confirm the visible receipt and activity entry.
12. Edit any form field or clear approval. Confirm the submission tool is removed/locked.

For deterministic verification of descriptions, schemas, UI side effects, and lifecycle behavior, see [docs/webmcp.md](docs/webmcp.md). Chrome recommends combining deterministic tests with agent evaluations in its [WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run the same suite in one command:

```bash
npm run check
```

The automated tests cover business and offering filters, inquiry validation, idempotent receipt behavior, IndexedDB persistence, low-data preference, WebMCP feature detection and approval logic, public-page signal extraction, URL/network boundary validation, and the assessment route contract. The browser lifecycle and offline scenarios still require the manual checks in [docs/demo-script.md](docs/demo-script.md).

## Low-data and offline behavior

Low Data mode is a real local preference. It switches the rendered profile to a simpler layout, hides decorative marks, and disables CSS animation, transitions, and backdrop filtering. The application already uses system fonts and no third-party media or embeds. The Data Footprint card reports values observed through the browser Resource Timing API; zero bytes may mean cached data or unavailable transfer detail, not a performance claim.

The switch does **not** unload JavaScript or CSS already transferred for the current visit. No before/after benchmark is claimed until one is measured independently.

After an online visit installs the service worker, the business profile can fall back to its cached response. Static Next.js assets are cached on first use. IndexedDB retains the inquiry draft across refreshes on the same browser profile. First-visit offline access is not supported, and browser storage eviction or site-data clearing can remove all local state.

Offline submission is never reported as successful. The draft remains local with `SUBMISSION PENDING`; the user must reconnect and retry. There is no Background Sync queue.

## Safety and privacy

- The assessment reads one public HTML response only. It blocks private/reserved IP space, credentials, nonstandard ports and reserved hostnames; resolves and validates every redirect; pins the validated address for the connection; enforces time, redirect, request and response limits; requires same-origin browser requests; and never executes remote JavaScript.
- Legacy/public text is fixed untrusted display data and never generates executable tool definitions.
- Agent inputs are schema-bounded and validated again in application code.
- Preparing an inquiry cannot submit it.
- Submission is gated twice: tool registration requires valid, approved state, and execution rechecks both.
- Any human field edit revokes approval and removes the submit tool.
- The API checks request size, the `Idempotency-Key` header, header/body agreement, and the full inquiry again.
- Activity entries describe actions without recording buyer field values.

This is not an authenticated production intake system. Buyer fields are saved in device-local IndexedDB and POSTed to the same-origin demo route. The route keeps accepted keys only in process memory; it has no durable database, cross-instance idempotency, rate limiting, abuse controls, or external delivery. Do not enter real personal or commercial information in a public demo deployment. See [docs/security.md](docs/security.md).

## Deploy

### Vercel

1. Push this directory to a public Git repository.
2. Import the repository into Vercel as a Next.js project.
3. Keep the default install and build behavior (`npm ci`/`npm run build`); no environment variables are required.
4. Confirm the project uses Node.js 24.x, then deploy.
5. Run `npm run check` locally and repeat the browser/WebMCP/offline checks against the production URL.
6. Add the public repository and demo-video links below before submitting the challenge entry.

- **Live app:** [https://stillhere-azure.vercel.app](https://stillhere-azure.vercel.app)
- **Source:** [https://github.com/wagaba26/stillhere](https://github.com/wagaba26/stillhere)
- **Demo video:** `[add final video URL]`

The service worker requires HTTPS in production (localhost is allowed for development). Other Node-compatible deployment targets must support Next.js 16 App Router route handlers and static asset/service-worker delivery.

## Current limitations

- All published company, contact, product and attestation records are fictional seeded demo data. Results for user-supplied public URLs are live page observations and are labelled separately.
- The recovery wizard persists a fictional attestation snapshot in `localStorage` and applies it to the profile on that browser only; it is not authenticated or published to a backend.
- Public assessment inspects only the final HTML response for one page. It does not load scripts, images, PDFs or linked pages, and its year/contact/Product-schema signals do not prove currentness.
- Assessment throttling and concurrency limits are process-local. A production multi-instance service should add durable edge rate limiting, abuse controls and monitoring.
- IndexedDB drafts, receipts, and low-data preferences are specific to one browser profile/device.
- API idempotency is a process-local `Map`; it is neither durable nor shared across server instances. The browser receipt provides an additional same-device retry guard.
- “Submit” produces a demo receipt but does not send email, notify a business, create an order, or call an external service.
- Cached profile access requires a successful prior online visit and remains subject to browser cache/storage eviction.
- WebMCP support depends on an experimental compatible browser or in-app browser. Other browsers receive the normal human experience.
- Information Attestation in this demo is not identity verification, KYC, registry verification, domain control, or certification auditing.

## License

[MIT](LICENSE)
