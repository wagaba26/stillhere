# WebMCP implementation

StillHere uses WebMCP's imperative browser API directly. The source contains literal `document.modelContext.registerTool(...)` calls in `src/hooks/use-webmcp.ts`; there is no wrapper package, generated MCP server, or hidden agent-only endpoint.

WebMCP is an experimental proposed web standard. The implementation follows the current [`document.modelContext` proposal](https://github.com/webmachinelearning/webmcp) and Chrome's [WebMCP](https://developer.chrome.com/docs/ai/webmcp) and [imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api) documentation.

## Progressive enhancement

`hasWebMcp()` checks for `document.modelContext.registerTool`. The profile has four visible status outcomes:

- `checking`
- `unsupported`
- `ready`
- `error`

If unsupported, no polyfill is loaded and no manual feature is disabled. A person can browse offerings, fill the form, approve it, submit to the same demo route, save a draft locally, and use offline fallback without an agent.

The tools exist only while `/business/rwenzori-harvest` is mounted. This is consistent with WebMCP's tab/page-bound model rather than a persistent server-side MCP service.

## Registered tools

### `get_business_status`

- **Availability:** base profile lifecycle
- **Annotation:** `readOnlyHint: true`
- **Input:** optional `language` string, limited to 16 characters; the demo validates it but returns English
- **Output:** business ID, name, `ACTIVE` status, country, sector, confirmation date, evidence state, four boolean capabilities, and a fictional-data note
- **Side effect:** two metadata-only Agent Activity entries (`called`, `completed`)

The result is compact domain data, not HTML or a page scrape.

### `search_current_offerings`

- **Availability:** base profile lifecycle
- **Annotation:** `readOnlyHint: true`
- **Input:** optional `query` (120 chars), `destinationCountry` (80 chars), `privateLabelRequired` (boolean), and `maxResults` (schema 1–5)
- **Output:** `{ count, offerings }`, where each result contains product ID, name, short description, MOQ, private-label status, evidence state, and last-confirmed date
- **Side effect:** metadata-only activity entries

Runtime logic clamps result count to 1–5 even if a caller bypasses the schema. It excludes seasonal, discontinued, unknown, and insufficiently evidenced products.

### `prepare_business_inquiry`

- **Availability:** base profile lifecycle
- **Annotations:** `readOnlyHint: false`, `untrustedContentHint: true`
- **Required input:** `productId`, positive whole-number `quantity`, `destinationCountry`, `requestSamples`, and `privateLabel`
- **Optional input:** `buyerCompany`, `buyerName`, `buyerEmail`, and `questions`
- **Effect:** sanitizes/bounds inputs, applies them to the current visible draft, highlights agent-supplied fields, revokes any earlier approval, saves to IndexedDB, scrolls to the form, focuses the review UI, and returns validation/missing-field state
- **Non-effect:** it never calls the submission API

The tool keeps the existing human-owned idempotency key. If a product ID is not currently eligible for inquiry, preparation rejects it. Buyer identity stays optional at the agent boundary so the supplied challenge prompt can prepare a partial, visibly invalid draft; a person must complete those fields before approval is enabled.

The browser agent can prepare values, but the human remains authoritative: editing a field removes its highlight and revokes approval.

### `submit_approved_inquiry`

- **Availability:** dynamically registered only while `approved && valid`
- **Annotation:** `readOnlyHint: false`
- **Input:** empty object
- **Effect:** checks the latest approval and validation state, reuses the current visible draft, checks for a device-local receipt, rejects offline submission, or POSTs to `/api/inquiries`
- **Output:** reference, `SUBMITTED` status, and duplicate flag

It is deliberately absent at page load. It is also absent after an agent prepares a draft, because preparation always clears approval.

## Dynamic registration with `AbortController`

Current WebMCP registration accepts an `AbortSignal`; aborting it unregisters the associated tool. StillHere uses that lifecycle rather than leaving a permanently registered submit action with an internal “permission denied” branch only.

Conceptually, the submit effect is:

```ts
useEffect(() => {
  if (!hasWebMcp() || !approved || !valid) return;

  const controller = new AbortController();
  void document.modelContext!.registerTool(submitTool, {
    signal: controller.signal,
  });

  return () => controller.abort();
}, [approved, valid]);
```

The implemented version also records availability/failure in the visible activity panel and updates `submitToolAvailable` for the lifecycle indicator.

The sequence is:

```mermaid
sequenceDiagram
    participant Human
    participant UI as Visible form
    participant Hook as useWebMcp
    participant Browser as document.modelContext
    participant Agent

    Hook->>Browser: register 3 base tools (base AbortSignal)
    Agent->>Browser: prepare_business_inquiry(input)
    Browser->>UI: populate + highlight + persist draft
    Human->>UI: edit and review
    Human->>UI: check approval
    UI->>Hook: approved=true, valid=true
    Hook->>Browser: register submit_approved_inquiry (fresh AbortSignal)
    Agent->>Browser: submit_approved_inquiry({})
    Browser->>UI: recheck latest approval and visible draft
    UI-->>Agent: compact demo receipt
    Human->>UI: edit field or clear approval
    UI->>Hook: approved=false or valid=false
    Hook->>Browser: abort signal; submit tool removed
```

Base tools use a separate controller and are removed when the page unmounts.

## State freshness

React callbacks are copied into a ref on every render. Registered tool functions call `callbacks.current`, so they see the latest approval, validation, form, submission, and activity behavior without repeatedly registering the three base tools.

Submission also validates at execution time. Dynamic availability communicates capability to the agent; it is not the only enforcement boundary.

## Agent Activity

The profile records up to 12 recent entries in React state. Entries include:

- tool name;
- lifecycle action (`available`, `called`, `completed`, or `failed` in the current flow);
- human-readable summary;
- timestamp;
- read-only/state-changing classification;
- whether approval is required.

It intentionally does not log tool parameters or buyer field values. This is an in-page explanation surface, not durable analytics, an audit log, or telemetry.

## Exact manual test

### 1. Browser setup

Use ChatGPT's in-app browser as described by the [OpenAI challenge FAQ](https://openai.com/webmcp-challenge/), or enable Chrome's local testing flag:

1. Navigate to `chrome://flags/#enable-webmcp-testing`.
2. Set it to **Enabled**.
3. Relaunch Chrome.
4. Start the app with `npm run dev`.
5. Open `http://localhost:3000/business/rwenzori-harvest`.

### 2. Discovery and read-only tools

1. Confirm the page says **WebMCP ready** and **3 tools available**.
2. Expect the visible lifecycle indicator to report three base tools and no `submit_approved_inquiry`.
3. Ask: **“Is this business currently active, and find a product suitable for private-label distribution in Japan.”**
4. Expect the status tool plus the offering search. The expected Japan/private-label product IDs are:

   - `roasted-arabica-1kg`
   - `ground-arabica-250g`
   - `drip-coffee-10pack`

5. Confirm the Agent Activity panel shows calls/completions without buyer data.

### 3. Prepare and human edit

1. Ask: **“Prepare an inquiry for 2,000 units of drip-coffee-10pack, requesting samples, private-label packaging and delivery information for Kobe, Japan.”**
2. Expect the browser agent to call `prepare_business_inquiry`.
3. Confirm the visible form scrolls into view, supplied fields are highlighted, the three buyer fields remain visibly required, and the status remains a local draft.
4. Confirm `submit_approved_inquiry` is still absent/locked.
5. Enter fictional buyer company, name, and email values. Change quantity from `2000` to `5000` and add **“Please include Japanese labelling support.”**
6. Confirm the human-edited fields no longer have the agent highlight.

### 4. Approval lifecycle and submission

1. Check the explicit approval checkbox.
2. Confirm the visible lifecycle indicator shows `submit_approved_inquiry` as available.
3. Clear the checkbox. Confirm the tool disappears.
4. Check approval again and ask: **“Submit the inquiry I approved.”**
5. Expect a visible `SH-...` receipt and a completed activity entry.
6. Confirm the result describes a demo acceptance, not an order/payment/delivery.

### 5. Revocation and failure paths

Before successful submission, check approval and then change any required field. Confirm approval clears and the tool is removed. Check approval again, switch DevTools Network to **Offline**, and attempt submission. Expect `SUBMISSION PENDING`, a clear “nothing was submitted” error, and no receipt. Reconnect and use **Retry now**.

## Automated coverage

Run:

```bash
npm run test
```

The unit tests cover feature detection, input boundary rejection, approval predicate behavior, product eligibility and result bounds, inquiry validation, idempotent receipts, and local persistence. They do not simulate a WebMCP-capable browser agent or assert React effect registration/unregistration end to end; those remain required manual/evaluation steps.

Chrome's [WebMCP eval guidance](https://developer.chrome.com/docs/ai/webmcp/evals) recommends deterministic tool tests alongside probabilistic evaluations for tool selection and full journeys. A submission-grade evaluation set should add direct, ambiguous, invalid, stale-product, approval-revocation, and offline prompts.

## Known WebMCP constraints

- The standard and implementations are experimental and may change.
- Tools are discoverable only after an agent visits the profile page.
- WebMCP availability depends on a compatible browser/origin configuration.
- The local TypeScript declaration covers only the subset used here; it is not a vendored canonical specification package.
- The app has deterministic domain tests but no automated browser-agent evaluation harness yet.
- A tool call receives structured browser-mediated input, but all consequential server trust still belongs at the application/API boundary.
