# CI

GitHub Actions workflow at `.github/workflows/ci.yml`. Runs on every
`pull_request` into `main` and every `push` to `main`. Concurrency
group cancels in-flight runs on the same branch when a new push lands.

Target wall-clock time for a cold full pipeline: under 8 minutes.
With caches warm, ~3 minutes.

## Jobs

| Job          | What it does                                                   | Depends on |
| ------------ | -------------------------------------------------------------- | ---------- |
| `lint`       | `pnpm lint` + `pnpm format:check`                              | —          |
| `typecheck`  | `pnpm typecheck` (= `astro check && tsc --noEmit`)             | —          |
| `unit-test`  | `pnpm test:coverage`. Uploads `coverage/` as an artefact (14d) | —          |
| `build`      | `pnpm build`. Uploads `dist/` as an artefact (1d)              | —          |
| `e2e`        | Downloads `dist/`, spins up `astro preview`, runs `pnpm e2e`   | `build`    |
| `lighthouse` | Downloads `dist/`, runs `lhci autorun`, comments scores on PRs | `build`    |

`lint`, `typecheck`, `unit-test`, and `build` run in parallel. `e2e`
and `lighthouse` run after `build` so they can consume its artefact
without rebuilding.

Every job runs `.github/actions/setup` first — a composite action
that checks out, installs pnpm (version from `packageManager` in
`package.json`), installs Node 22 (from `.nvmrc`), and runs
`pnpm install --frozen-lockfile`. pnpm's store is cached automatically
by `actions/setup-node@v4`.

## Where the e2e + Lighthouse target runs

The issue spec wants e2e and Lighthouse to run against the **Cloudflare
Pages preview deployment** for the PR. That's blocked on DEV-8 (the
agency creating the Cloudflare account and wiring Pages → repo).

Until then both jobs run against an **in-CI preview server**:

- `e2e` starts `astro preview` directly and uses `BASE_URL=http://localhost:4321` so Playwright's webServer doesn't redundantly rebuild.
- `lighthouse` uses `lhci`'s `startServerCommand: pnpm exec astro preview`.

When DEV-8 lands, both jobs switch to the Pages preview URL: set
`BASE_URL` to the preview URL for `e2e`, change `lhci.collect.url`
to the preview URL list, and remove `startServerCommand`. Document
the wait-for-preview-deployment mechanism here at that point.

## Lighthouse budgets

`.lighthouserc.json` asserts (level: error):

- Performance score ≥ 0.85
- First Contentful Paint < 1500 ms
- Largest Contentful Paint < 2500 ms
- Total Blocking Time < 200 ms
- Cumulative Layout Shift < 0.1

The `url` array covers `/`, `/letter`, `/squad`, and `/about` — every
real page shipped so far. New pages get added as their epics land.
Each URL runs three times (`numberOfRuns: 3`) and the assertions use
`aggregationMethod: median-run`, so a one-off spike on a shared runner
doesn't fail the gate while a genuine regression still does.

Targets are deliberately the floor (0.85), not the ceiling (the
project budget aims for 0.95 on the home page). The floor catches
real regressions without flaking on small variations.

### Results on the PR

The `lighthouse` job posts (and updates) a single PR comment with a
per-URL table of the median perf score, FCP, LCP, TBT, and CLS, plus
the per-run spread — so reviewers see the numbers and the variance
inline, without opening the run or downloading the `.lighthouseci`
artefact. A ⚠️ next to a CLS value means a non-median run breached the
0.1 budget even though the median (the gate) passed. The comment step
parses the raw `lhr-*.json` and runs `if: always()`, so it still posts
when a budget assertion fails (that's when the numbers matter most).

`temporaryPublicStorage` is deliberately **off**: the LHCI public
report includes page screenshots that capture children's first names
and portraits from live content, which must not be uploaded to an
external public bucket (safeguarding). The in-repo PR comment and the
downloadable artefact cover the need instead.

## Branch protection

CI is the gate. After this workflow lands, configure `main` in
**Settings → Branches → Branch protection rules**:

- Require a pull request before merging (≥ 1 approval)
- Require status checks to pass before merging:
  - `Lint + format check`
  - `Typecheck`
  - `Unit tests + coverage`
  - `Build`
  - `E2E + axe`
  - `Lighthouse budgets`
- Require branches to be up to date before merging
- Do not allow force-pushes
- Do not allow deletions

The check names match the `name:` field on each job in `ci.yml`. If a
job is renamed, update this list and the branch protection settings
together.

You can also configure these via `gh`:

```bash
gh api -X PUT \
  "repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/branches/main/protection" \
  -F required_status_checks.strict=true \
  -F 'required_status_checks.contexts[]=Lint + format check' \
  -F 'required_status_checks.contexts[]=Typecheck' \
  -F 'required_status_checks.contexts[]=Unit tests + coverage' \
  -F 'required_status_checks.contexts[]=Build' \
  -F 'required_status_checks.contexts[]=E2E + axe' \
  -F 'required_status_checks.contexts[]=Lighthouse budgets' \
  -F enforce_admins=false \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F restrictions= \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

### Sync voices: pushing to a protected main

The scheduled **Sync voices** workflow commits `content/voices.json` and
pushes it straight to `main`. Branch protection blocks that for the
default `GITHUB_TOKEN`, so the push is authenticated as a dedicated
**GitHub App** that is a **bypass actor** on the ruleset (DEV-120). The
human "PR required" rule is unaffected — only the app may push directly.

One-time setup:

1. **Create the app.** Settings → Developer settings → GitHub Apps → New.
   Name it e.g. "OYG Pipeline". Repository permissions: **Contents:
   Read and write** (nothing else). No webhook needed.
2. **Generate a private key** (bottom of the app's settings) — downloads
   a `.pem`.
3. **Install** the app on this repository (Install App → choose the repo).
4. **Add it as a bypass actor** on the `main` ruleset:
   Settings → Rules → Rulesets → the `main` ruleset → Bypass list → Add →
   the app. (Classic branch-protection users: Settings → Branches → main
   → "Allow specified actors to bypass required pull requests" → add the
   app.)
5. **Store the secrets** (Settings → Secrets and variables → Actions):
   - `PIPELINE_APP_ID` — the app's App ID (from its settings page).
   - `PIPELINE_APP_PRIVATE_KEY` — the full contents of the `.pem`.

Until all five are done the workflow fails at its `Mint app token` step.
Verify end-to-end with **Actions → Sync voices → Run workflow**. Rotating
the key: generate a new one on the app, replace `PIPELINE_APP_PRIVATE_KEY`.

## Reading failures

- **`lint` failure** — open the job log, look for the rule id at the
  end. Same output as `pnpm lint` locally; reproduce there and use
  `pnpm lint:fix` if applicable.
- **`format:check` failure** — `pnpm format` fixes; commit the result.
- **`typecheck` failure** — open the offending file, fix or refine the
  type. Astro frontmatter errors point at the script block lines.
- **`unit-test` failure** — coverage artefact is downloadable; the
  full test output is in the job log. Reproduce with `pnpm test`.
- **`e2e` failure** — Playwright report uploads on failure as the
  `playwright-report` artefact. Open `index.html` from the download.
- **`lighthouse` failure** — `.lighthouseci/` uploaded as artefact;
  the report HTML names the failing audit. Reproduce locally with
  `pnpm exec lhci autorun`.

## Skipping a flaky test (last resort)

If a test is flaking and blocking unrelated work, mark it
`test.skip(condition, ...)` with a comment linking to the Linear
issue tracking the fix. Open the issue immediately — never leave a
skipped test without a ticket. Skipped tests appear in PR logs as
**SKIP** rows; CI doesn't fail on them but they're visible.

## Things deliberately not in this pipeline

- **Cloudflare Pages preview comments** — CF Pages posts these
  automatically via the GitHub integration. No `preview-comment.yml`
  needed.
- **Deployment** — handled by Cloudflare Pages on push to `main`.
- **Renovate / Dependabot** — out of MVP scope.
- **Release automation / changesets** — overkill for a single-app
  campaign site.
