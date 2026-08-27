# Devpost submission package

Copy-ready content for the OpenAI WebMCP Challenge. Recheck the logged-in form for any additional required fields before submitting.

## Project name

StillHere

## Tagline

**Human-approved continuity for work that can't stop.**

Alternatives:

1. **Recover the work. Reconcile the truth. Resume with approval.**
2. **Reconcile stale web evidence into a Business Passport for people and agents.**

## One-sentence pitch

StillHere lets a browser agent organize conflicting business evidence and prepare useful work, while a human decides what becomes a versioned Business Passport and what may become an approved action.

## Short description

StillHere is a human-agent business continuity layer for organizations whose websites are no longer reliable sources of current information. Instead of making stale pages easier to automate, it recovers conflicting source evidence into a shared Continuity Ledger. WebMCP lets an agent inspect the bounded review state, stage cited proposals, search a published Business Passport, and prepare a visible buyer inquiry. A human alone can accept or edit claims, exclude unsupported certification wording, publish a Passport version, and approve the exact final draft. Six route-scoped tools operate on the same state shown in the UI, and the consequential submit tool exists only while the approved draft and Passport version still match. The public demo needs no account, uses fictional data, and includes Low Data, local persistence, and honest offline behavior.

## Full project description

### Problem

Businesses rarely lose every file at once. More often, they lose the context, agreement, and authority required to continue safely. A website may still be online while its phone number, minimum order, export availability, or certification wording is stale. Giving an agent better access to that page improves actuation, but it does not establish which claims are still fit to publish or use.

StillHere's thesis is: **an agent-ready version of stale information is still stale information.**

### Solution

StillHere is a human-agent business continuity layer built around five visible stages: **Recover → Reconcile → Approve → Publish → Transact**.

The challenge demo follows a fictional Ugandan coffee supplier. A bounded assessment separates website condition from business condition. Four recovered records then disagree about a trade phone, Instant Coffee minimum order, Japan availability, and an unsupported legacy certification claim. The Continuity Ledger keeps those sources separate instead of collapsing them into an unqualified profile.

### Why WebMCP

This workflow needs structured, contextual browser-agent collaboration rather than scraping or hidden click automation. WebMCP gives the current page a small, typed capability surface. On the Ledger route, an agent can inspect bounded conflict counts and stage source-backed proposals. On the Passport route, it can read the exact published version, search current offerings without losing destination qualifications, and prepare the same visible inquiry form the human sees.

The browser agent never receives an accept or publish tool. Source text cannot alter tool definitions. The human uses visible controls to accept, edit, reject, exclude, or keep a claim unresolved. Only accepted facts enter the Draft Passport, and only the human can publish a new version.

### What people and agents can do together

The agent does the high-friction organizational work: it identifies fields needing review, cites recovered sources, stages bounded proposals, searches accepted offerings, and prepares a buyer draft. The human supplies authority: deciding the current phone, editing an MOQ from 2,500 to 3,000, preserving Japan as **Available by inquiry**, excluding an unsupported certification claim, publishing Passport v2, editing the buyer draft, and approving the exact final state.

That combination was difficult before because an agent could operate an old webpage without knowing whether its contents were current, rejected, unresolved, or authorized. StillHere inserts a visible currentness and approval layer before agent-facing action.

### WebMCP implementation

StillHere exposes six direct, route-scoped tools with literal `document.modelContext.registerTool(...)` calls. `/recover` registers `inspect_business_truth` and `stage_claim_resolutions`. The published Passport registers `get_business_passport`, `search_current_offerings`, and `prepare_business_inquiry`. `submit_approved_inquiry` is registered dynamically only when the visible valid draft, idempotency key, Passport version, and explicit human approval have the same fingerprint.

Each registration is tied to an `AbortController` and disappears on route or authority changes. JSON Schema helps selection, while strict runtime parsers independently reject extra keys, invented values, unknown or mismatched sources, invalid qualifications, and stale approval. Editing one approved field removes the submit capability; even a retained executor cannot keep authority.

### Execution, resilience, and safety

The public Next.js application is deployed on Vercel, needs no login, and uses a deterministic fictional scenario. IndexedDB retains Ledger, Passport versions, drafts, and receipts on the device. A service worker caches the Ledger and Passport shells after an online visit. Low Data is a persistent preference that simplifies decoration and motion; transfer values are reported honestly as visit-specific browser observations.

Recovered text is evidence, never an instruction or tool definition. Unsupported certification remains out. No agent can auto-publish. Preparation never implies submission. The receipt is fictional and process-local: no email, order, payment, webhook, or external message is sent. StillHere demonstrates a careful human-agent authority pattern, not identity verification, KYC, a signed credential, or a production delivery system.

## Why the use case is a strong WebMCP fit

StillHere needs an agent to operate on structured, route-current state while sharing a visible workspace with a person. WebMCP supplies typed capabilities tied to the active Ledger or Passport, avoiding brittle DOM interpretation and preventing a generic tool server from drifting away from the state the judge sees. Dynamic registration also makes authority legible: the final action literally does not exist until the exact draft receives human approval.

## Better user experience

The agent organizes conflict-heavy work without hiding it. Proposed phone, MOQ, destination status, and exclusion decisions arrive as visible proposal cards. The human can inspect sources, change values, and see the Draft Passport update only after a human decision. Later, agent-prepared inquiry values are highlighted in the normal form, edits revoke approval, and success or pending states remain visible.

## What was difficult or impossible before

An agent could scrape or click through an old business page, but it lacked a trustworthy distinction between legacy evidence, recent public evidence, representative input, accepted current state, and permission to act. StillHere turns those distinctions into a shared browser workflow with enforceable tool boundaries.

## Brief WebMCP implementation explanation

Six project-specific tools are registered directly from two client hooks after browser-local state hydrates. Tool schemas are narrow; callbacks run strict parsers and pure domain rules. Abort signals remove route tools on navigation and remove the submit tool whenever draft validity, approval, idempotency key, or Passport version changes.

## Judging criteria

### WebMCP Leverage

StillHere uses WebMCP as the product interaction model, not a decorative chat layer. Six tools are divided between reconciliation and transaction routes; all use the same hydrated state rendered to the human. Direct registrations, strict schemas/parsers, route cleanup, read-only annotations, visible state changes, and exact-draft dynamic submission demonstrate a working, non-trivial lifecycle. The most consequential capability appears and disappears with human authority.

### Execution

The entry is a coherent public product: no-login assessment, conflict-rich Ledger, agent proposals, human decisions, immutable-by-workflow Passport versions, qualified offering search, visible inquiry preparation, approval revocation, and fictional receipts. It includes a bounded one-page assessor, additive IndexedDB migration, scoped reset, offline shells, responsive layouts, reduced-motion behavior, Vercel deployment, and 86 deterministic tests across 14 files.

### Potential Impact

StillHere addresses active organizations whose digital presence no longer reflects current operations. The immediate problem is not a missing website; it is the unsafe gap between recovered information and authorized action. A continuity layer can help a small team resume buyer communication while preserving provenance, uncertainty, and human responsibility. The demo makes that case without claiming a market size, verifying a real business, or pretending browser-local state is a production system of record.

### Creativity & Ambition

Most agent-enablement flows begin with an existing website and expose tools over it. StillHere begins one step earlier:

```text
Fragmented evidence
→ agent-assisted reconciliation
→ human decision
→ versioned Passport
→ agent tools
```

It is not a website-to-MCP converter, generic tool generator, directory, storefront bot, or autonomous publisher. Its novel boundary is currentness before actuation: establish which claims are publishable before giving an agent a transaction surface.

## Testing instructions

No account is required. All business, buyer, and receipt data are fictional. Use ChatGPT's in-app browser or Chrome 149+ with WebMCP testing enabled.

1. Open <https://stillhere-azure.vercel.app> and select **Try Demo**.
2. Run the prefilled assessment and select **Review recovered evidence**.
3. On the Ledger, ask: **“Inspect this business's recovered evidence and tell me what needs review.”** Expect `inspect_business_truth`.
4. Ask: **“Propose source-backed resolutions for these conflicts, but do not accept or publish anything.”** Expect `stage_claim_resolutions` and four visible proposals.
5. As the human: accept phone, edit MOQ 2,500→3,000, accept **Available by inquiry**, and accept certification exclusion.
6. Select **Publish Business Passport**.
7. Ask: **“Read the published Business Passport and find current private-label offerings for Japan.”** Expect Passport read/search; Instant Coffee remains `AVAILABLE_BY_INQUIRY`.
8. Ask: **“Prepare an inquiry for 5,000 units of Instant Coffee for Japan, requesting samples, private-label packaging and Japanese labelling support.”** The visible draft changes; nothing submits.
9. Enter fictional buyer values, edit quantity to 6,000, and approve. Confirm `submit_approved_inquiry` appears. Edit any field to see it disappear; then review and reapprove.
10. Submit through the agent. The `SH-...` result is a fictional demo receipt only.

Reset is in the footer and requires **Reset demo → Confirm reset**.

## Submission links

```text
Live URL:
https://stillhere-azure.vercel.app

Repository:
https://github.com/wagaba26/stillhere

Demo video:
[WAITING FOR FINAL PUBLIC YOUTUBE URL]
```
