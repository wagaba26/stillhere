# Final demo video package

## Target runtime

Aim for **2:35–2:50**. The challenge limit is under three minutes, so leave a few seconds of export and platform margin.

## The one-sentence story

StillHere keeps an outdated website as evidence, lets an agent organize conflicting claims, gives a person the final decision, and publishes a versioned Business Passport that agents can query instead of guessing from stale pages.

**WebMCP is the structured access layer, not the truth engine.**

## Timeline and exact narration

### 0:00–0:14 — The problem

**Screen:** Opening card, then the StillHere home page.

> “Rwenzori Harvest is still trading, but its 2021 website lists an old phone number, a five-thousand-unit minimum order, and an unsupported certification. An agent reading that page could give a confident, wrong answer.”

### 0:14–0:34 — Evidence, not automatic truth

**Screen:** Run the assessment, then show the evidence and conflict summary.

> “The website is only one source. StillHere keeps it beside a later catalogue, recent public evidence, and a fictional business representative. These records disagree, so none is silently promoted to current truth.”

### 0:34–0:53 — The Continuity Ledger

**Screen:** Open the Ledger and run `inspect_business_truth`.

> “On the Continuity Ledger, WebMCP gives the agent a bounded tool to inspect what needs review. It sees fields and source references—not raw pages turned into instructions.”

### 0:53–1:14 — Agent proposals remain proposals

**Screen:** Run `stage_claim_resolutions` and show the proposal cards.

> “The agent can stage cited proposals: use the newer phone, preserve Japan as available by inquiry, and exclude the unsupported certification claim. These are visible proposals. The agent has approved and published nothing.”

### 1:14–1:40 — Human authority

**Screen:** Accept the phone, edit the minimum order from 2,500 to 3,000, accept the Japan qualification, and accept exclusion of the certification wording.

> “The human supplies authority. I accept the current phone, edit the minimum order to three thousand, keep the Japan qualification, and exclude certification wording that is no longer supported. Unresolved facts stay out of the Draft Passport.”

### 1:40–2:00 — Publish the Passport

**Screen:** Publish, then show the newly versioned Passport.

> “Only the human can publish. StillHere creates a new versioned Business Passport containing accepted facts only. In this challenge build, that Passport is device-local; a production service would add authenticated, hosted publication.”

### 2:00–2:24 — The payoff

**Screen:** Run `search_current_offerings` for a Japanese private-label buyer and show the returned result.

> “Now the agent reads the published Passport, not the stale website. For a Japanese private-label buyer it returns Instant Coffee with a three-thousand-unit minimum and the exact qualification, available by inquiry. The source of the answer has changed.”

### 2:24–2:35 — Safe next action

**Screen:** Briefly show `prepare_business_inquiry`; do not submit.

> “The same approved Passport can prepare a visible inquiry, but preparation never equals authorization. The full app provides six route-scoped tools; this video focuses on the core reconciliation path.”

### 2:35–2:48 — Resilience without overclaiming

**Screen:** Show Simplified view, its diagnostic panel, and the offline page or a previously cached Passport response.

> “StillHere also stores work locally. Simplified view removes selected decoration and motion, while previously visited Ledger and Passport pages have a best-effort offline cache. It does not claim first-load bandwidth savings.”

### 2:48–2:55 — Close

**Screen:** Final card with the live app and repository links.

> “StillHere helps agents organize what may be true, while people decide what becomes current.”

## Exact WebMCP prompts

Use these prompts as written so the video remains reproducible.

1. **Inspect**

   `Inspect the Rwenzori Harvest continuity ledger. Summarize what still needs human review. Do not approve or publish anything.`

2. **Propose**

   `Stage cited proposals for Rwenzori Harvest: use the newer phone +256 312 555 826; set Instant Coffee minimum order to 2500; mark Japan as available by inquiry; exclude the unsupported organic-certification claim. Do not accept, publish, approve, or submit.`

3. **Search the published Passport**

   `Using only the published Business Passport, find a current private-label Instant Coffee option for a buyer in Japan. Return the minimum order, the exact market qualification, and source references.`

4. **Prepare, do not submit**

   `Prepare a visible inquiry for the Japanese private-label Instant Coffee option. Do not approve or submit it.`

## Human actions shown in the video

1. Accept the proposed current phone.
2. Edit the proposed minimum order from 2,500 to 3,000, then accept it.
3. Accept the qualified Japan availability claim.
4. Accept exclusion of the unsupported certification wording.
5. Publish the Passport.

These clicks are the central product point: the agent organizes evidence, while the person controls acceptance and publication.

## What the video intentionally omits

To keep the story understandable and under three minutes, do not walk through every buyer field, revoke and re-approve a draft, submit an inquiry, or linger on the receipt. The app and the full judge walkthrough still demonstrate all six WebMCP tools and the approval-bound submission path.

## Recording setup

- 1920×1080, 16:9, browser zoom at 100%.
- Use only the fictional Rwenzori Harvest scenario.
- Hide bookmarks, personal tabs, notifications, tokens, and account details.
- Use clean narration with no background music.
- Burn in readable captions and include a separate `.srt` file.
- Keep the cursor still unless it is showing a deliberate human decision.
- End with the live app and public repository links long enough to read.

## YouTube metadata

### Title

`StillHere — From a stale website to a human-approved Business Passport | WebMCP Challenge`

### Description

```text
StillHere helps an active business recover from an outdated website without letting an AI agent decide what is true.

The demo shows how WebMCP lets an agent inspect a bounded Continuity Ledger, stage cited proposals, query a human-published Business Passport, and prepare—but never silently submit—a buyer inquiry.

Live app: https://stillhere-azure.vercel.app
Source: https://github.com/wagaba26/stillhere

The Rwenzori Harvest scenario and all business data shown are fictional. The challenge build stores its Ledger and Passport on the current device. Simplified view is a visual preference, and offline support is best-effort after an online visit.
```

### Visibility and final check

Set the upload to **Public**, confirm the processed duration remains below three minutes, test the video in a signed-out browser, and replace the YouTube placeholder in the submission package with the public URL.
