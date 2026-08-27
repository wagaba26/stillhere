# Release freeze record

The judged artifact is **submitted and frozen**. Devpost confirmed the project submission on 27 August 2026, before the challenge deadline. Continue any later development only on a separate branch, fork, and non-submitted deployment.

```text
Submitted application commit:
ef9ef913a09c6b787eb371d0c5a538cf1a5c4c86

Production deployment:
GitHub deployment 6116528284 — success
https://stillhere-3ss6tvy8y-wagabas-projects.vercel.app

Live URL:
https://stillhere-azure.vercel.app

YouTube:
https://youtu.be/3PZHm2X10PE

Devpost:
https://devpost.com/software/stillhere-guxdjz

Freeze date:
2026-08-27 07:48:55 +03:00
```

The submission-record update made after Devpost finalization changes documentation only. The application commit and successful deployment above are the exact artifacts that were live when Devpost returned “Project submitted!”.

## Freeze procedure

Completed before final submission:

1. Confirm the final **public** YouTube URL remains `https://youtu.be/3PZHm2X10PE` everywhere it is referenced.
2. Search for `add final video`, `WAITING FOR FINAL`, `youtube`, `TODO`, and `PLACEHOLDER`; review every match.
3. Run `npm ci` if dependencies changed, then `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run check`.
4. Commit only the final video-link/checklist updates and push `main`.
5. Wait for Vercel; verify the custom production URL serves the exact pushed commit and the WebMCP demo still works.
6. Complete and review the Devpost form and submit before **3 September 2026 at 1:00 PM PDT / 11:00 PM EAT**.
7. Record the exact submission commit, Vercel deployment ID/URL, public YouTube URL, Devpost project URL, and freeze timestamp above.

## Judging-period hold

The official FAQ currently says not to change the submitted Devpost entry, repository, or live site after the deadline until winners are actually announced. The winner date is approximate, so wait for the announcement rather than unfreezing at a guessed time.

During the hold, do not change:

- the submitted Devpost entry;
- the submitted repository branch/commit;
- the production alias or deployment used by judges.

If development must continue, use a separate fork or branch and a separate non-submitted deployment. Do not repoint the submitted live URL.

## Short final pass after the video arrives

- confirm the public URL is consistent;
- verify the YouTube page is publicly accessible without sign-in;
- compare the video flow with the live app;
- rerun the final checks and production smoke test;
- commit, push, deploy, submit, and fill this record;
- the judged artifact is now frozen; do not change it during the hold.
