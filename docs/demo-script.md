# Demo script (under three minutes)

This script demonstrates all six route-scoped WebMCP tools while keeping every authority transition visible.

## Before recording

1. Use the deployed HTTPS app or a WebMCP-enabled local Chrome build.
2. In the footer, select **Reset demo**, then **Confirm reset**. This clears device demo Ledger/Passport/draft/receipts but preserves Low Data and caches.
3. If Low Data was previously on, turn it off from the Passport route before recording; reset intentionally preserves the preference.
4. Confirm `npm run check` passes. The polish snapshot is 14 test files and 86 tests.
5. Use only the fictional buyer values below.

## 0:00–0:18 — Problem and differentiation

Open `/`.

Say:

> “An active business can have a stale website. Making it agent-readable does not make its claims true. StillHere recovers source evidence, lets an agent stage explanations, and lets a human decide what becomes a versioned Business Passport.”

Point to **Recover → Reconcile → Approve → Publish → Transact** and select **Try Demo**.

## 0:18–0:38 — Assessment and Source Evidence

The fictional URL is prefilled. Select **Assess website**.

Say:

> “The assessment separates website condition from business condition. The seeded path is deterministic; public URLs use a bounded one-page observer and never become trusted Ledger claims automatically.”

Point briefly to the stale-site result and the four **Recovered Evidence** cards: legacy website, catalogue, recent public evidence, and fictional representative. Select **Review recovered evidence**.

## 0:38–1:20 — Agent proposes; human decides

On `/recover`, show the **Agent assistance available** panel, compact **Source Evidence**, the **Continuity Ledger**, the Draft Passport, and the two route tools.

Ask:

> “Inspect this business's recovered evidence and tell me what needs review.”

Expected: `inspect_business_truth` returns bounded counts, four review fields, and no raw source documents.

Then ask the agent to call `stage_claim_resolutions` with:

```json
{
  "proposals": [
    {
      "field": "tradePhone",
      "action": "USE_VALUE",
      "proposedValue": "+256 780 240 826",
      "supportingSourceIds": ["representative-2026", "public-evidence-2026"],
      "explanation": "Use the latest representative and public value."
    },
    {
      "field": "instantCoffeeMoq",
      "action": "USE_VALUE",
      "proposedValue": 2500,
      "supportingSourceIds": ["representative-2026"],
      "explanation": "Use the representative-attested MOQ."
    },
    {
      "field": "japanAvailability",
      "action": "USE_VALUE",
      "proposedValue": "AVAILABLE_BY_INQUIRY",
      "supportingSourceIds": ["representative-2026"],
      "explanation": "Preserve the representative's qualified availability."
    },
    {
      "field": "certification",
      "action": "EXCLUDE",
      "supportingSourceIds": ["legacy-website-2021", "representative-2026"],
      "explanation": "The legacy certification wording lacks current support."
    }
  ]
}
```

Point to the brief **Agent proposal · New** highlight and say:

> “The agent staged proposals; it accepted and published nothing.”

As the human, select **Accept** for phone, **Edit** the MOQ from `2,500` to `3,000`, accept Japan qualification, then **Accept exclusion** for certification. Point to the Draft Passport's **Ready to publish** state and say:

> “Unresolved or rejected facts are omitted. Available by inquiry is not upgraded to supported.”

Select **Publish Business Passport**.

## 1:20–1:53 — Published Passport tools

On the profile, point to **Business Passport Version 2** (or a later version if the device has retained history) and three available tools.

Use the copyable Passport guide and ask:

> “Which current products from this business are suitable for a Japanese private-label buyer?”

Then ask:

> “Prepare an inquiry for 5,000 units of Instant Coffee for Japan, requesting samples, private-label packaging and Japanese labelling support.”

Expected calls:

1. `get_business_passport` returns the same visible version.
2. `search_current_offerings` returns current Passport offerings and preserves Instant Coffee as `AVAILABLE_BY_INQUIRY`.
3. `prepare_business_inquiry` fills/highlights the visible form, saves the draft, and reports buyer company/name/email as missing.

Say:

> “The agent acts on the published Passport, not the old website. Preparation is visible and cannot approve or submit.”

## 1:53–2:28 — Exact-draft human approval

Enter the fictional buyer details:

- Buyer company: `Kobe Coffee Trading`
- Name: `Aiko Mori`
- Email: `aiko@example.com`

Check **I have reviewed this inquiry and approve submission.** Point to the newly available `submit_approved_inquiry`.

Then change quantity from `5000` to `6000`. Point to the visible approval-revoked message and the removed submit capability. Keep or add:

> “Please include Japanese labelling support.”

Point out that the edited field loses its agent highlight. Review the new exact draft and check approval again; the submit capability returns.

Ask:

> “Submit the exact inquiry I approved.”

Expected: a visible `SH-...` receipt and an activity item marked human approval required.

Say:

> “This is a process-local demo acceptance only. It sends no email, order, payment, or external message.”

## 2:28–2:50 — Low Data and offline honesty

Toggle **Low Data** and show Data Footprint.

Say:

> “Low Data is a global stored preference. Resource Timing reports this visit; zero can mean cache or unavailable detail, and the toggle cannot unload bytes already transferred.”

If recording offline behavior, first load both `/recover` and the Passport online and wait for the service worker. Switch DevTools Network to offline:

- `/recover` can fall back to its cached shell and restore the device Ledger;
- the Passport can fall back to its cached shell;
- a new inquiry attempt becomes `SUBMISSION PENDING`, never falsely submitted.

## 2:50–3:00 — Close

Say:

> “StillHere keeps evidence, proposals, human authority, and action separate: recover what may be true, reconcile it visibly, publish accepted facts, then transact with explicit approval.”

## Recovery plan

- **Ledger tools absent:** wait for device hydration and confirm the route says WebMCP Ready.
- **Proposal rejected:** use the exact field/value/source combinations above; values must occur in cited claims.
- **Proposal already pending:** complete or reset the earlier proposal; duplicate pending fields are rejected.
- **Passport still version 1:** resolve proposals and use the human **Publish Business Passport** button; agents cannot publish.
- **Submit tool absent:** fill all required buyer fields and approve the exact visible draft.
- **Submit tool disappears:** a field, idempotency key, validity state, approval, or Passport version changed; review and reapprove.
- **Instant Coffee submission fails:** confirm Passport v2 (or later) is published, Japan reads **Available by inquiry**, quantity meets the edited MOQ, all buyer fields are present, and the exact draft was reapproved after the last edit. The fictional receipt API mirrors current Instant Coffee status but still does not receive Passport destination or approval authority.
- **Offline shell missing:** reconnect, visit the target route online, and retry. Offline-first is not supported.
- **Repeated receipt:** an exact same-device or same-process retry is being deduplicated. Edit after submission to create a new draft key.

## Claims to avoid

Do not claim that StillHere:

- verified a real business, representative, domain, legal entity, registry, or certification;
- treats public HTML as trusted current information;
- lets an agent accept resolutions or publish a Passport;
- creates a signed, server-hosted, or cross-device credential;
- guarantees durable/global idempotency or delivery;
- sends the inquiry to a real recipient;
- works offline before a successful online visit;
- reports a measured universal data-saving percentage;
- supports WebMCP in every browser.
