# Official submission requirements

Verified on **27 August 2026** against the current [challenge overview](https://webmcp.devpost.com/), [Official Rules](https://webmcp.devpost.com/rules), [Resources and FAQ](https://webmcp.devpost.com/resources), and [schedule](https://webmcp.devpost.com/details/dates). The Official Rules control if another challenge page conflicts.

## Deadline and freeze

- Submission closes **3 September 2026 at 1:00 PM PDT**, which is **3 September 2026 at 11:00 PM EAT**.
- Judging is scheduled from 4 September at 10:00 AM PDT through 21 September at 5:00 PM PDT.
- Winners are expected on or around 23 September at 2:00 PM PDT.
- The FAQ says not to change the submitted Devpost entry, repository, or live site after the deadline until winners are actually announced. Continued development should use a separate copy, branch, and deployment that are not the judged artifacts.

## Compliance matrix

| Official requirement | Current status | StillHere evidence | Remaining human action |
| --- | --- | --- | --- |
| Build a WebMCP-powered web app for meaningful human-agent interaction | **PASS** | Six direct, route-scoped tools support Recover → Reconcile → Approve → Publish → Transact. See [`webmcp.md`](webmcp.md). | None. |
| Working live URL accessible in ChatGPT's in-app browser or Chrome 149+ with WebMCP enabled | **PASS** | [Production](https://stillhere-azure.vercel.app) is public, requires no login, and was exercised in the in-app browser after the final video-link commit. | None. |
| Project runs consistently and matches its description/video | **PASS** | Production flow, offline shell, responsive states, and deterministic tests are recorded in [`final-verification.md`](final-verification.md); the [public video](https://youtu.be/3PZHm2X10PE) shows the same bounded demo journey. | None. |
| Public source repository containing source, assets, and run instructions | **PASS** | [Public GitHub repository](https://github.com/wagaba26/stillhere), root README, lockfile, source, and screenshots are present. | None. |
| Detectable open-source license | **PASS** | Root [`LICENSE`](../LICENSE) is MIT and GitHub publicly detects it as an MIT license. | None. |
| Genuine WebMCP implementation visible in source | **PASS** | Literal `document.modelContext.registerTool(...)` calls are in [`use-continuity-webmcp.ts`](../src/hooks/use-continuity-webmcp.ts) and [`use-webmcp.ts`](../src/hooks/use-webmcp.ts). | None. |
| Text explains WebMCP fit, better UX, new human-agent collaboration, and implementation | **PASS** | The copy in [`devpost-submission.md`](devpost-submission.md) is published in the [Devpost entry](https://devpost.com/software/stillhere-guxdjz). | None. |
| Public YouTube demo, with audio, clearly showing the working project and WebMCP | **PASS** | [Public YouTube video](https://youtu.be/3PZHm2X10PE) shows the working app, the bounded WebMCP inspection/proposal flow, human review, Passport publication, and the changed agent answer. | Custom thumbnail remains optional pending one-time YouTube phone verification. |
| Video is strictly under three minutes | **PASS** | The processed public video is 2:46. | None. |
| Video avoids unauthorized trademarks, music, and copyrighted material | **PASS** | The final recording uses the StillHere UI, original narration, fictional data, and no background music. | Entrant retains responsibility for the official authorization representation. |
| English submission materials, or English translations | **PASS** | Repository, submission package, narration, and the published corrected caption track are in English. | YouTube notes that remapped caption timing may continue processing after publication. |
| Project is original, entrant-owned, and third-party materials are authorized | **ENTRANT ATTESTED** | Repository assets are the StillHere UI/screenshots; dependency and obvious asset review found no copied proprietary product assets. The entrant explicitly confirmed eligibility and agreement to the Official Rules and Devpost Terms before submission. | Legal responsibility remains with the entrant. |
| Existing projects must be meaningfully extended with WebMCP during the submission period and document what is new | **PASS** | Focused dated commit history and [`preexisting-vs-pivot.md`](preexisting-vs-pivot.md) distinguish the original build from the continuity pivot and WebMCP work. | None unless Devpost asks for more provenance. |
| Register on Devpost and complete every required submission-form field before the deadline | **PASS** | Devpost confirmed “Project submitted!” and published the [StillHere entry](https://devpost.com/software/stillhere-guxdjz) on 27 August 2026. | None before the deadline unless a factual correction is required. |
| Keep the project free and available without testing restrictions through judging | **PASS / FROZEN** | No account or credentials are required; the submitted deployment and repository are recorded in [`release-freeze.md`](release-freeze.md). | Keep the submitted deployment online through judging. |

## Official judging criteria

Stage One is pass/fail for baseline viability and WebMCP fit. Stage Two weights these four criteria equally:

1. **WebMCP Leverage** — genuine, working, non-trivial WebMCP use.
2. **Execution** — a complete, coherent, working product rather than only a proof of concept.
3. **Potential Impact** — a credible, specific problem and audience addressed by the demonstration.
4. **Creativity & Ambition** — novelty and differentiation from existing concepts.

Tie-breaking follows the criteria in that order.

## Clarifications and safe interpretations

- One FAQ sentence incorrectly says “there's no video,” but the Rules, Overview, and another FAQ answer require a video. Treat the public YouTube video as mandatory.
- The official wording is “publicly visible” and “public YouTube video.” Because it does not explicitly approve Unlisted visibility, use **Public**.
- The Rules show `document.modelContext.registerTool(...)` as an implementation example. StillHere exposes actual direct registrations with project-specific tools; it does not copy the illustrative `search_products` tool.
- Public pages do not expose every logged-in submission-form field. Complete any additional field Devpost marks required.
- Wait for the actual winner announcement before unfreezing; the published announcement date is approximate.
