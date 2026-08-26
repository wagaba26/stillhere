# Demo script (under three minutes)

## Before recording

1. Deploy the final commit over HTTPS or run it in a WebMCP-enabled local Chrome build.
2. Open a fresh browser profile if you want the draft-persistence moment to be obvious.
3. Confirm `npm run check` passes.
4. Load `/business/rwenzori-harvest` online once and wait for **Profile ready** before any offline demonstration.
5. Confirm the browser agent discovers the three base tools.
6. Keep DevTools closed unless the recording specifically needs tool discovery or offline emulation.
7. Do not enter real buyer information; all names and addresses below are fictional demo values.

## 0:00–0:20 — Establish the problem

Open `/`.

Say:

> “An active business can have a stale website. Making that website machine-readable does not make its information true. StillHere establishes what is current first, then publishes a tiny surface for people and agents.”

Point to **The website may be outdated. The business isn't.** Select **Try Demo**.

## 0:20–0:45 — Assess without overclaiming

The assessment is prefilled with `https://legacy.rwenzoriharvest.example`.

Select **Assess website**.

Say:

> “This target is deterministic for a repeatable demo. The production form also accepts a public website through a bounded one-page observer: no JavaScript, subresources, linked-page crawl, or private-network access. It separates website condition from business condition.”

Point to the latest visible update, zero confirmed-current products, three conflicts, and **Current business status: Not yet attested**.

## 0:45–1:05 — Recover and attest

Select **Recover & attest current information**.

Move briskly through the six steps: identity, contacts, product status, capabilities, one primary workflow, and review. On the final screen say:

> “Information Attestation confirms individual fictional demo facts. It is not identity verification, KYC, a registry check, or certification auditing.”

Select **Publish demo profile**.

## 1:05–1:30 — Read with WebMCP

On the profile, show the active/attested date, evidence badge, current catalogue, **WebMCP ready**, and three available tools.

Ask the browser agent exactly:

> “Is this business currently active, and find a product suitable for private-label distribution in Japan.”

Expected behavior:

1. `get_business_status` returns `ACTIVE`, confirmation date `2026-08-26`, `OWNER_CONFIRMED`, and compact capabilities.
2. `search_current_offerings` returns the three current Japan/private-label candidates: roasted beans, ground coffee, and drip packs.
3. Agent Activity shows read-only calls without buyer field values.

Say:

> “The agent uses structured current data, not a scrape of the legacy page.”

## 1:30–2:05 — Prepare together

Ask exactly:

> “Prepare an inquiry for 2,000 units of drip-coffee-10pack, requesting samples, private-label packaging and delivery information for Kobe, Japan.”

Expected behavior:

- `prepare_business_inquiry` populates the visible form;
- supplied fields are highlighted;
- the draft is saved to this device;
- the three required buyer fields remain empty for human completion;
- nothing is submitted;
- `submit_approved_inquiry` remains locked.

Enter fictional buyer details (`Kobe Coffee Trading`, `Aiko Mori`, and `aiko@example.com`). Change quantity from `2000` to `5000`. Add:

> “Please include Japanese labelling support.”

Point out that human edits remove the agent highlight and remain authoritative.

## 2:05–2:35 — Approval creates capability

Say:

> “The final tool does not exist from page load. A valid visible form is not enough; the human must explicitly approve it.”

Check **I have reviewed this inquiry and approve submission.** Point to `submit_approved_inquiry — Available to your agent`.

Optionally clear approval once to show the tool disappearing, then check it again.

Ask:

> “Submit the inquiry I approved.”

Expected behavior:

- execution rechecks approval and validation;
- the page calls the same-origin demo API with the draft's idempotency key;
- a visible `SH-...` receipt appears;
- the activity panel marks the state-changing call as human-approval required.

Say:

> “This receipt is only a demo acceptance. No email, order, payment, or external delivery occurs.”

## 2:35–2:55 — Low-data/offline honesty

Toggle **Low Data**. Point to the simplified profile and Data Footprint panel.

Say:

> “The figures come from this browser's Resource Timing entries. A zero can mean cached or unavailable transfer detail; we claim no invented benchmark, and the switch cannot unload bytes already transferred.”

If time allows, switch DevTools Network to **Offline** only after the profile has loaded online. Refresh the profile and show the offline/cached status. With a new unsent draft, attempt submission and show `SUBMISSION PENDING` rather than false success.

## 2:55–3:00 — Close

Say:

> “StillHere is a continuity layer: recover what is true, make currentness explicit, and let people and agents complete one useful workflow together.”

## Expected tool arguments

An agent may phrase optional questions differently. The central prepared values should be equivalent to:

```json
{
  "productId": "drip-coffee-10pack",
  "quantity": 2000,
  "destinationCountry": "Japan",
  "requestSamples": true,
  "privateLabel": true,
  "questions": "Please provide delivery information for Kobe, Japan."
}
```

The human then changes `quantity` to `5000` and adds the labelling requirement before approval.

## Recovery plan if the agent varies

- If the agent does not call a tool, state the tool name explicitly and repeat the request.
- If WebMCP shows unsupported, verify that the recording uses ChatGPT's in-app browser or Chrome with `chrome://flags/#enable-webmcp-testing` enabled, then relaunch and reopen the profile.
- If the submit tool is absent, confirm all required fields are valid and approval is checked.
- If the profile is not available offline, reconnect, revisit the profile, wait for **Profile ready**, then retry. Offline-first is not supported.
- If a receipt repeats, the browser is correctly reusing the existing receipt for that draft key. Edit a field after submission to create a new key.

## Claims to avoid

Do not say that the demo:

- verified a real business, owner, domain, legal entity, registry, or certification;
- crawled or secured an arbitrary website;
- sent an email or inquiry to a real recipient;
- guarantees cross-device or cross-instance idempotency;
- works offline before a successful online visit;
- measured a universal low-data savings percentage;
- supports WebMCP in every browser.
