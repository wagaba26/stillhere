# Final verification

## Release baseline

| Item | Verified value |
| --- | --- |
| Baseline commit | `f19797111edb1f65ecb1c9a39e2e2d6df96e031a` |
| QA code commit | `a6af4ca1c745a368f15fee9c554ea51fcfedd218` (`fix: close final judge-facing polish gaps`) |
| Verified code deployment | `dpl_5VofBNFJyL21x8oDn4krSzsEmFtT` — READY / production |
| Date | 27 August 2026, Africa/Nairobi |
| Node.js | `v24.15.0` |
| npm | `11.14.0` |
| Next.js | `16.3.3` |
| Production URL | <https://stillhere-azure.vercel.app> |

The worktree and `origin/main` began clean and aligned at `f197971`. `npm ci` initially encountered an `EPERM` because an old local Next.js process still had the SWC binary open. The exact process loading this repository's SWC module was stopped; a second unmodified `npm ci` completed successfully with 393 packages installed.

## Baseline automated verification

Command: `npm run check`

| Gate | Result |
| --- | --- |
| ESLint | **PASS** — `eslint src` |
| TypeScript | **PASS** — `tsc --noEmit` |
| Tests | **PASS** — 14 files, 86 tests |
| Production build | **PASS** — Next.js 16.3.3, 10 routes generated/registered |

After the QA code changes, `npm run typecheck` passed and `npm test` again reported **14 files and 86 passing tests**. The complete release-candidate gate was then repeated with the final documents and screenshots present; its exact result is recorded below.

## Production deployment baseline

Vercel reported deployment `dpl_4sptjZSJBbVr1moCrvLCZXB8ACKA` as **READY / production**, built from exact commit `f19797111edb1f65ecb1c9a39e2e2d6df96e031a` on `main`. In the 24-hour runtime check:

- grouped runtime errors: **none**;
- observed production runtime status group: **5 responses with HTTP 200**;
- public repository visibility in deployment metadata: **public**.

The polished code release was independently checked as deployment `dpl_5VofBNFJyL21x8oDn4krSzsEmFtT`: **READY / production**, exact Git commit `a6af4ca1c745a368f15fee9c554ea51fcfedd218`, custom alias attached, successful Next.js 16.3.3 build, and no grouped runtime errors in the preceding 24 hours. The later documentation-only package commit will trigger another deployment; the final submitted commit/deployment belong in [`release-freeze.md`](release-freeze.md) only after the public video URL is supplied.

## Production browser QA

Executed in the WebMCP-capable in-app browser against the public production release and a deployment-specific origin for a clean device state.

| Area | Result | Evidence |
| --- | --- | --- |
| `/` | **PASS** | Correct title, coherent thesis and demo CTA, no console warnings/errors from the app. |
| `/assessment` seeded path | **PASS** | Prefilled fictional URL and deterministic continuity route present. |
| `/assessment` arbitrary public pages | **PASS** | `https://example.com` returned HTTP 200 / 559 B observation; `https://www.wikipedia.org` returned HTTP 200 / 118 KB observation. Both remained explicitly non-attested. |
| `/recover` | **PASS** | 4 sources, 3 conflicts, 1 unsupported claim, 4 review fields; two route tools. |
| Published Passport | **PASS** | Human decisions produced v2; Instant Coffee MOQ 3,000; Japan remained `AVAILABLE_BY_INQUIRY`; certification omitted. |
| Inquiry preparation | **PASS** | Agent preparation saved the visible draft and left buyer company/name/email for the human. |
| Approval lifecycle | **PASS** | No submit tool before approval; tool appeared after exact approval; editing 5,000→6,000 revoked approval and removed the tool. |
| Live final submission | **NOT RUN — ACTION-TIME CONFIRMATION REQUIRED** | The exact fictional draft reached the ready-to-submit state. Browser safety requires a fresh confirmation immediately before the representational submit action. Automated receipt/idempotency behavior passed in the test suite. |
| Offline | **PASS** | After an online visit, `/recover` and the Passport route rendered from the cache under offline network emulation. |
| Simplified view | **PASS** | Root state persisted across routes; selected decoration was hidden and observed animations/transitions were zero while enabled. This is a visual preference, not a network-savings measurement. |
| Reduced motion | **PASS** | With Simplified view off, `prefers-reduced-motion: reduce` matched; animation and transition durations were zero; scroll behavior was `auto`. |
| Responsive | **PASS** | No horizontal overflow at 360 or 768 px on home, Ledger, and Passport; the 390 px Passport and Ledger captures also had no overflow. |
| Keyboard/focus | **PASS after QA fix** | Focus ring is visible, every route's `main` has `tabIndex={-1}`, and direct `#main-content` fragment navigation focused `<main>` and scrolled to it in production. The browser-control layer did not reliably synthesize native Enter activation, so no stronger automation claim is made. |
| Reset | **PARTIAL LIVE + AUTOMATED PASS** | Production two-step warning and cancellation verified without deletion. Scoped deletion is covered by automated tests; live deletion was not executed because it would delete browser data. |

## WebMCP execution evidence

- Recovery discovery: exactly `inspect_business_truth` and `stage_claim_resolutions`.
- Published Passport discovery: exactly `get_business_passport`, `search_current_offerings`, and `prepare_business_inquiry`.
- Exact human approval added `submit_approved_inquiry`; edit/reload removed it.
- Six invalid proposal cases were rejected: extra key, invented MOQ, unsupported certification value, unknown source, source/field mismatch, and duplicate field.
- Literal direct registration calls and AbortController lifecycle remain visible in source.

See [`eval-results.md`](eval-results.md) for the executed-versus-not-executed evaluation boundary.

## Performance sanity boundary

The live Data Footprint panel observed 20 transferred resources and 13 KB for one deployment-specific Passport visit; this is a visit-specific Resource Timing observation, not a benchmark. Production routes loaded successfully, the browser console had no warnings or errors, and Vercel showed no grouped runtime errors.

A Lighthouse/Core Web Vitals trace was **NOT RUN — environment limitation** because the required Chrome DevTools performance-trace MCP service was not configured. No Lighthouse score or Core Web Vitals number is claimed.

## Dependency and asset sanity review

- Direct runtime dependencies (`next`, `react`, `react-dom`) and direct development dependencies report permissive MIT or Apache-2.0 licenses.
- Lockfile review found expected transitive license families, including optional Sharp/libvips LGPL packages, Lightning CSS/axe-core MPL packages, `caniuse-lite` CC-BY-4.0, and other permissive metadata. No copied dependency source or vendored third-party binary is committed by this repository.
- Tracked visual assets are StillHere's own SVG mark and screenshots of the fictional app. The inherited starter favicon was removed and replaced with the StillHere icon.
- The submission-blocker search found no TODO/FIXME/HACK markers, secrets, API keys, real buyer data, private credential files, or unresolved public-video placeholders. Remaining `localhost`, `private`, `secret`, and `.example` matches are legitimate instructions, security tests/controls, or type names.
- This is a focused submission-risk review, not legal advice; the entrant must still make the official ownership and authorization representations.

## Final gate

Executed on 27 August 2026 with all submission documents and final screenshots present:

| Command | Result |
| --- | --- |
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run test` | **PASS** — 14 files, 86 tests |
| `npm run build` | **PASS** — Next.js 16.3.3, 10 routes generated/registered |
| `npm run check` | **PASS** — lint, typecheck, 14/86 tests, and production build repeated successfully |

The first parallel lint process stopped yielding after its normal output and was terminated; a clean standalone `npm run lint` immediately completed with exit code 0, and the aggregate `npm run check` then repeated lint successfully. No lint result is inferred from the stalled process.
