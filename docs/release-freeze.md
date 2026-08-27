# Release freeze record

The project is **not frozen yet**. The required public YouTube video has not been recorded/uploaded and the Devpost entry has not been finally submitted.

```text
Submission commit:
TBD

Production deployment:
TBD

Live URL:
https://stillhere-azure.vercel.app

YouTube:
TBD

Devpost:
TBD

Freeze date:
TBD
```

## Freeze procedure

Immediately before final submission:

1. Insert the final **public** YouTube URL everywhere marked `[WAITING FOR FINAL PUBLIC YOUTUBE URL]`.
2. Search for `add final video`, `WAITING FOR FINAL`, `youtube`, `TODO`, and `PLACEHOLDER`; review every match.
3. Run `npm ci` if dependencies changed, then `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run check`.
4. Commit only the final video-link/checklist updates and push `main`.
5. Wait for Vercel; verify the custom production URL serves the exact pushed commit and the WebMCP demo still works.
6. Complete and review the Devpost form, upload the final screenshots, and submit before **3 September 2026 at 1:00 PM PDT / 11:00 PM EAT**.
7. Record the exact submission commit, Vercel deployment ID/URL, public YouTube URL, Devpost project URL, and freeze timestamp above.

## Judging-period hold

The official FAQ currently says not to change the submitted Devpost entry, repository, or live site after the deadline until winners are actually announced. The winner date is approximate, so wait for the announcement rather than unfreezing at a guessed time.

During the hold, do not change:

- the submitted Devpost entry;
- the submitted repository branch/commit;
- the production alias or deployment used by judges.

If development must continue, use a separate fork or branch and a separate non-submitted deployment. Do not repoint the submitted live URL.

## Short final pass after the video arrives

- replace the placeholder consistently;
- verify the YouTube page is publicly accessible without sign-in;
- compare the video flow with the live app;
- rerun the final checks and production smoke test;
- commit, push, deploy, submit, and fill this record;
- do not create a release tag or mark the project frozen before those steps are complete.
