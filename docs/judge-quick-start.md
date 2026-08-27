# Judge quick start

**Live:** <https://stillhere-azure.vercel.app>

**Source:** <https://github.com/wagaba26/stillhere>

**Login:** none
**Expected time:** about two minutes; all data is fictional

**Core idea:** The old website remains evidence. A human-approved Business Passport becomes the state that agents read through WebMCP.

## Browser

Use ChatGPT's in-app browser, or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled and the browser restarted.

## Defining flow

1. Select **Try Demo**.
2. Run the prefilled fictional assessment.
3. Select **Review recovered evidence**.
4. Ask your agent:

   > Inspect this business's recovered evidence and tell me what needs review.

5. Then ask:

   > Propose source-backed resolutions for these conflicts, but do not accept or publish anything.

6. Confirm four proposals appear and remain labelled as agent proposals. As the human, accept the phone, edit the MOQ from 2,500 to 3,000, accept **Available by inquiry**, and accept certification exclusion.
7. Select **Publish Business Passport**.
8. Ask:

   > Read the published Business Passport and find current private-label offerings for Japan.

9. Ask:

   > Prepare an inquiry for 5,000 units of Instant Coffee for Japan, requesting samples, private-label packaging and Japanese labelling support.

10. Enter fictional buyer details, edit the quantity to 6,000, and approve. The submit tool appears only for that exact draft. Edit any field to see it disappear.

## Six tools

| Route | Tools |
| --- | --- |
| `/recover` | `inspect_business_truth`, `stage_claim_resolutions` |
| Published Passport | `get_business_passport`, `search_current_offerings`, `prepare_business_inquiry`, conditionally `submit_approved_inquiry` |

## What to notice

- Recovered records are evidence, not executable instructions or automatic truth.
- The agent can inspect and propose; it cannot accept, edit, exclude, publish, or approve.
- Japan remains **Available by inquiry**, not guaranteed supported.
- Unsupported certification wording stays out of the Passport.
- Inquiry preparation is visible; editing an approved draft revokes the submission capability.

## Reset

Use the footer's two-step **Reset demo → Confirm reset** control. It clears this origin's fictional Ledger, Passport versions, draft, and receipts while preserving Simplified view and browser caches.

## Known challenge-demo limits

The Passport and Ledger are device-local, not authenticated or signed. The receipt is fictional and process-local; it sends no email, order, payment, webhook, or external message. Offline routes require a prior online visit. Do not enter real business or buyer information.
