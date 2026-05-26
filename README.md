# Own Your Game

UNICEF youth-led campaign site for the 2026 FIFA World Cup. Around 350 young
people from ~42 countries record short videos on what sport means to them and
sign an open letter to FIFA.

- **Project board:** <https://linear.app/own-your-game/project/own-your-game-9288cd457ba3>
- **Project conventions:** see `CLAUDE.md` at the repo root for the locked
  stack, hard rules, and contribution flow.
- **How to contribute:** see `docs/contributing.md` for commit conventions
  and the local validation loop.
- **CI:** see `docs/ci.md` for the workflow per-job graph and branch
  protection rules.

## Stack

Astro 6 · React 18 islands · TypeScript (strict, `noUncheckedIndexedAccess`)
· Tailwind 4 (CSS-first via `@theme`) · Radix UI Primitives · Vitest + React
Testing Library · Playwright + axe-core · pnpm · Node 22 LTS.

Lint, format, hooks, and CI (lint / typecheck / unit-test / build / e2e /
Lighthouse) are all live and gate every PR.

## Quickstart

Requires Node 22 LTS (`.nvmrc` pins major `22`, minimum 22.12.0 — the
Astro 6 floor) and pnpm (managed via `corepack`, pinned in
`packageManager`).

```bash
nvm use            # picks up .nvmrc → Node 22
corepack enable    # makes the pinned pnpm available
pnpm install       # install deps AND wire Husky hooks (via `prepare`)
pnpm dev           # dev server on http://localhost:4321
```

After `pnpm install`, every `git commit` runs the pre-commit hook
(ESLint and Prettier on staged files) and the commit-msg hook (commitlint
plus a forbidden-trailers check). See `docs/contributing.md`.

## Scripts

| Command              | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Start the Astro dev server on `:4321`                          |
| `pnpm build`         | Production build into `dist/`                                  |
| `pnpm preview`       | Serve the built site locally                                   |
| `pnpm typecheck`     | `astro check && tsc --noEmit`                                  |
| `pnpm lint`          | `eslint . --max-warnings 0`                                    |
| `pnpm lint:fix`      | `eslint . --fix`                                               |
| `pnpm format`        | `prettier --write .`                                           |
| `pnpm format:check`  | `prettier --check .`                                           |
| `pnpm test`          | Vitest, run once                                               |
| `pnpm test:watch`    | Vitest, watch mode                                             |
| `pnpm test:ui`       | Vitest browser UI                                              |
| `pnpm test:coverage` | Vitest + v8 coverage report (80% threshold)                    |
| `pnpm e2e`           | Playwright across chromium-desktop, webkit-desktop, and mobile |
| `pnpm e2e:ui`        | Playwright UI mode (best for writing/debugging specs)          |
| `pnpm e2e:headed`    | Show the browser windows during the run                        |
| `pnpm e2e:report`    | Open the last HTML report                                      |

## Repo map

| Path                       | What lives there                                                   |
| -------------------------- | ------------------------------------------------------------------ |
| `src/`                     | App code (Astro + React islands + styles + helpers)                |
| `src/styles/global.css`    | Design tokens (`:root`) + Tailwind `@theme` + reduced-motion guard |
| `src/islands/ui/`          | Radix wrappers — see `src/islands/ui/README.md`                    |
| `design/handoff/`          | Read-only agency reference — see `design/README.md`                |
| `tests/unit/`              | Vitest specs — see `tests/README.md`                               |
| `tests/e2e/`               | Playwright + axe — see `tests/e2e/README.md`                       |
| `docs/contributing.md`     | Commit conventions, local loop, escape hatches                     |
| `docs/ci.md`               | Workflow per-job docs + branch protection                          |
| `.github/workflows/ci.yml` | The CI pipeline                                                    |
| `.lighthouserc.json`       | Lighthouse budgets                                                 |

## Hard rules (short)

- Design tokens only — no ad-hoc colour, spacing, or radius values.
- First names only in public UI; no public submission, no comments, no
  accounts (safeguarding — a youth-focused campaign).
- No Cloudflare credentials yet (account hasn't been created).
- No secrets in the repo. Only `.env.example` with placeholder names.

Full rationale in `CLAUDE.md`.
