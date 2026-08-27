# Submission checklist

Checked items have current evidence. Unchecked items still require a final deployment recheck, user action, or the public video URL.

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
- [x] Low Data persistence checked
- [x] Reduced motion checked independently of Low Data
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
- [ ] README video placeholder replaced with final public YouTube URL
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
- [ ] Public YouTube URL supplied
- [x] Screenshot set and captions prepared
- [x] Concise testing instructions prepared
- [ ] Logged-in form-only fields reviewed
- [ ] Entrant eligibility, ownership, and third-party authorization confirmed by entrant
- [ ] Devpost submission reviewed and submitted before 3 September 2026 at 1:00 PM PDT / 11:00 PM EAT

## Video

- [x] Script targets approximately 2:45 with safety margin
- [x] Exact prompts, clicks, narration, recording, and YouTube metadata prepared
- [ ] Final video recorded
- [ ] Final runtime strictly under 3:00
- [ ] Audio clearly covers product and WebMCP implementation
- [ ] Working software and WebMCP visibly demonstrated
- [ ] Only fictional data visible
- [ ] No copyrighted music or unauthorized third-party material
- [ ] English captions checked
- [ ] Uploaded to YouTube with visibility **Public**
- [ ] Public URL inserted consistently in README, Devpost package, video document, and freeze record

## Freeze

- [ ] Final submission commit recorded
- [ ] Exact production deployment recorded
- [ ] Public YouTube URL recorded
- [ ] Devpost submitted before deadline
- [ ] Submitted repository branch, production deployment, and Devpost entry frozen
- [ ] Separate branch/fork/deployment chosen for any post-submission work
