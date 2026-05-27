# Content pipeline — operations

The voices pipeline pulls the campaign team's Google Sheet through a
validation step and writes the result into `content/voices.json`. A
push to that file triggers a Cloudflare Pages rebuild, and within
a few minutes the new voices are live.

This document covers the operational side. The technical schema lives
in [`sheet-schema.md`](./sheet-schema.md); the campaign-team-facing
guide is in
[`sheet-guide-for-campaign-team.md`](./sheet-guide-for-campaign-team.md).

## How the pipeline runs

```
campaign team's Google Sheet         ← editorial source of truth
        │
        │  CSV export (public link)
        ▼
.github/workflows/sync-voices.yml    ← scheduled every 2 hours
        │
        │  pnpm sync:voices
        ▼
scripts/fetch-voices.ts              ← validate + sort + write
        │
        ▼
content/voices.json                  ← committed on change only
        │
        │  push to main
        ▼
Cloudflare Pages build               ← rebuilt automatically
        │
        ▼
production site                      ← new voices live
```

## Cadence

- **Scheduled:** every 2 hours on the hour (UTC). Twelve runs per day.
  GitHub's scheduler can drift by several minutes under load — the SLA
  is "live within ~2 hours of a sheet edit," not "on the hour to the
  second."
- **Manual:** any time, via the GitHub Actions UI. Triggers an
  immediate sync — useful when an event launches mid-window or the
  campaign team needs a new voice live now.
- **Concurrency:** at most one sync runs at a time. If a manual run
  fires during a scheduled one, the manual run queues until the first
  finishes.

## Outcomes by scenario

| Sheet state                                           | Pipeline behaviour                                                                                                     | Visible result                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Unchanged** since last run                          | Re-validates the sheet, writes a byte-identical `voices.json`, diff check skips the commit                             | Silent run, no commit, no rebuild                                                    |
| **One or more new valid rows**                        | Validates everything, writes updated file with fresh `generatedAt`, commits + pushes                                   | Commit `chore(content): sync voices from sheet` on `main`, Cloudflare Pages rebuilds |
| **One or more invalid rows**                          | Validates everything, posts a Slack message naming the row(s) and the field-level errors, exits with code 2, no commit | Slack notification, no commit, the previous `voices.json` stays live                 |
| **Sheet header mismatch** (missing/duplicate columns) | Exits with code 1, posts a Slack message naming the problem columns                                                    | Slack notification, no commit, the previous `voices.json` stays live                 |
| **Network or env-var failure**                        | Exits with code 3                                                                                                      | GitHub Actions marks the run failed; next scheduled run retries                      |

## How to trigger a sync manually

1. Open the repo on GitHub → **Actions** tab
2. Pick **Sync voices** from the workflow list on the left
3. Click **Run workflow** (top right of the run list)
4. Branch: **main**, then **Run workflow**

A typical run takes 30–60 seconds. The Actions UI streams logs live.

When to use:

- You added a row that needs to go live immediately
- You suspect the last scheduled run failed and want to retry without
  waiting for the next slot
- You want to confirm the pipeline is healthy after a sheet edit

## Slack notifications

Validation errors and header mismatches post to the
**#own-your-game-pipeline** channel via an incoming webhook stored in
the `SLACK_PIPELINE_WEBHOOK_URL` GitHub Actions secret.

Successful runs are silent — no Slack noise. The signal of health is
"no message arrived." If you want active confirmation, the Actions UI
shows every run.

## Secrets and access

Two GitHub Actions secrets are required:

| Secret                       | What it does                                                                          | Where it lives                    |
| ---------------------------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| `VOICES_SHEET_CSV_URL`       | Published CSV export URL for the voices sheet (set to "Anyone with the link, Viewer") | Repo settings → Secrets → Actions |
| `SLACK_PIPELINE_WEBHOOK_URL` | Slack incoming webhook for pipeline rejection notifications                           | Repo settings → Secrets → Actions |

Rotating either is a no-downtime operation: update the secret value in
GitHub, the next scheduled run picks up the new value.

## Bot identity and branch protection

The workflow's default `GITHUB_TOKEN` commits as **OYG Pipeline Bot**
(`pipeline@ownyourgame.org`). When branch protection is enabled on
`main` (DEV-19), this bot needs explicit permission to push directly.

Configure either:

- **Allow `github-actions[bot]` to bypass branch protection** for
  `content/voices.json` only (Settings → Branches → main → Bypass
  list). Simpler, narrower blast radius.
- **Open-PR-then-auto-merge** workflow. More auditable, more moving
  parts. Documented as a fallback if org policy forbids bot pushes
  to protected branches.

Recommendation: the bypass route. The pipeline only ever touches
`content/voices.json`; the rest of `main` stays protected against
everyone including the bot.

## Cost

GitHub Actions minutes: ~360 runs/month × ~60s each ≈ 6 hours/month.
Well inside the free tier on a personal or Pro account. The agency's
org account should also have plenty of headroom; no budget concern.

## When something goes wrong

**Slack message saying rows were rejected.** Look at the message body
for the row number and the field-level error. The fix is in the
sheet, not the code. See
[`sheet-guide-for-campaign-team.md`](./sheet-guide-for-campaign-team.md)
for what each error means.

**Slack message saying the sheet headers are wrong.** Someone renamed
or removed a column header. Restore the canonical headers (see
[`sheet-schema.md`](./sheet-schema.md)) or import a fresh copy from
[`sample-voices-sheet.csv`](./sample-voices-sheet.csv).

**GitHub Action shows a red ✗ but no Slack message.** Either the
fetch failed (sheet temporarily unreachable — wait for the next run)
or a non-pipeline error (env var missing, dependency install broke).
Open the failed run in the Actions tab; the step name shows where
it broke.

**The site shows old voices and the pipeline says "no changes" on
every run.** The script considers voices unchanged when the
`voices` array is structurally identical — `generatedAt` differences
don't matter. If you genuinely added a row in the sheet, the most
likely culprits are:

1. The row's `Video ID` is empty (the script silently skips drafts —
   add the Stream UID and re-run)
2. The row's `Published at` is in the future (the script defers it
   until the date passes)
3. The row failed validation on a previous run; check Slack for the
   rejection message

**A run is queued behind another.** The workflow's concurrency group
serialises runs. Wait for the in-flight one to finish; the queued
one starts immediately after.

## Local development

Run the pipeline locally against the real sheet:

```bash
# Read VOICES_SHEET_CSV_URL from .env.local (or export it)
pnpm sync:voices --dry-run --verbose    # don't write, log everything
pnpm sync:voices                        # write to content/voices.json
```

The `--dry-run` flag stops short of writing — useful when you want to
see how the script would react to a sheet edit without overwriting
the committed file. `--verbose` prints every row's outcome
(accepted/rejected/skipped/deferred). Without either flag the script
just prints a summary.

See [`.env.example`](../../.env.example) for the full list of pipeline
env vars.
