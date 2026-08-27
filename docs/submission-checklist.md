# Submission checklist

Checked items have current evidence. Unchecked application actions were deliberately not exercised against the fictional production workflow and are not challenge-submission blockers.

## Application

- [x] Production URL loads without authentication
- [x] Seeded assessment works
- [x] Arbitrary bounded assessment works on more than the demo URL
- [x] Continuity Ledger works
- [x] All 6 WebMCP tools discovered across their intended states
- [x] Agent proposals preserve human authority
- [x] Human accept/edit/exclusion and Passport publication work
- [x] Japan Instant Coffee remains `AVAILABLE_BY_INQUIRY`
- [x] Prepared inquiry is visible and cannot auto-approve
- [x] Exact approval registers submit; edit removes it
- [ ] Live production agent submission returns a visible `SH-...` receipt — action-time confirmation pending
- [x] Reset confirmation is two-step
- [ ] Production reset deletion executed — deliberately not run; automated scoped-reset tests pass
- [x] 360, 390, and 768 px layouts have no horizontal overflow
- [x] Cached Ledger and Passport routes work offline after an online visit
- [x] Simplified view persistence checked
- [x] Reduced motion checked independently of Simplified view
- [x] Skip-link focus-target defect fixed
- [x] Final production recheck of polished code commit `a6af4ca` and deployment `dpl_5VofBNFJyL21x8oDn4krSzsEmFtT`

## Repository

- [x] Public GitHub repository
- [x] MIT `LICENSE` present and detected by GitHub
- [x] Source, assets, lockfile, and run instructions present
- [x] Literal direct `document.modelContext.registerTool(...)` calls visible in source
- [x] Live URL present in README
- [x] Clean `npm ci` completed without private files or credentials
- [x] `npm run check` baseline passes: 14 files, 86 tests, lint/typecheck/build pass
- [x] Final `npm run check` after package/screenshots: 14 files, 86 tests, lint/typecheck/build pass
- [x] No committed secrets or private keys found
- [x] No TODO/FIXME/HACK markers found
- [x] Focused commit provenance preserved
- [x] Obvious dependency and asset license risks reviewed
- [x] README video placeholder replaced with final public YouTube URL
- [ ] GitHub About description/homepage/topics updated — optional, not a blocker

## Devpost

- [x] Project name prepared
- [x] Final tagline plus alternatives prepared
- [x] One-sentence pitch prepared
- [x] 100–150 word short description prepared
- [x] 500–800 word full description prepared
- [x] WebMCP fit explained
- [x] Human-agent collaboration explained
- [x] Implementation explanation prepared
- [x] Four judging-criteria answers prepared
- [x] Live URL prepared
- [x] Repository URL prepared
- [x] Public YouTube URL supplied
- [x] Screenshot set and captions prepared
- [x] Concise testing instructions prepared
- [x] Logged-in form-only fields reviewed and completed
- [x] Entrant confirmed eligibility and agreement to the Official Rules and Devpost Terms before registration and final submission
- [x] Devpost submission reviewed and submitted on 27 August 2026
- [x] Public Devpost entry verified at `https://devpost.com/software/stillhere-guxdjz`

## Video

- [x] Script targets approximately 2:45 with safety margin
- [x] Exact prompts, clicks, narration, recording, and YouTube metadata prepared
- [x] Final video recorded
- [x] Final runtime strictly under 3:00 — processed runtime is 2:46
- [x] Audio clearly covers product and WebMCP implementation
- [x] Working software and WebMCP visibly demonstrated
- [x] Only fictional data visible
- [x] No copyrighted music or unauthorized third-party material
- [x] English captions corrected and published; YouTube timing remap is processing
- [x] Uploaded to YouTube with visibility **Public**
- [x] Public URL inserted consistently in README, Devpost package, video document, and freeze record

## Freeze

- [x] Submitted application commit `ef9ef913a09c6b787eb371d0c5a538cf1a5c4c86` recorded
- [x] Exact successful production deployment `6116528284` recorded
- [x] Public YouTube URL recorded
- [x] Devpost submitted before deadline
- [x] Submitted repository branch, production deployment, and Devpost entry frozen
- [x] Any post-submission development is directed to a separate branch/fork/deployment by the freeze policy
