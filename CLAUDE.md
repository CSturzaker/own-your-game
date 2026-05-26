# CLAUDE.md

Project context for Claude Code sessions. Read this first on every start.
Keep it lean — under ~200 lines. Add to it as conventions emerge; don't let it
rot.

## What this is

**Own Your Game** is a UNICEF youth-led campaign site anchored on the 2026
FIFA World Cup. Around 350 young people (~42 countries, ages 11–18) record
30–60s videos on what sport means to them, signing an open letter to FIFA.
One sentence: _350 young people are writing a letter to FIFA. Meet the team._

Multilingual, mobile-first, low-bandwidth. Donor lands → understands the
campaign in five seconds. Young person lands → wants to tap a face.

**Anchor date:** 2026 FIFA World Cup. Project target date: 2026-06-05.

## Sources of truth (in order)

1. **Linear issues** — each issue's Goal, Scope, Acceptance Criteria, and
   Technical Notes are authoritative for its work. Comments on the issue may
   layer on additions. Project: <https://linear.app/own-your-game/project/own-your-game-9288cd457ba3>.
2. **Project overview document** in Linear — "Project overview — read this
   first" (attached to the project). Conventions, brand rules, safeguarding,
   data model.
3. **Design handoff** at `design/handoff/` — pixel-perfect source of truth.
   Key files: `hifi-tokens.css`, `hifi-appendix.jsx`, `hifi-shared.jsx`,
   one `hifi-{page}.jsx` per page. See `design/README.md` for orientation.
4. **This file** — pointers and conventions only; never duplicate the above.

Linear issue contradicts this file? The issue wins. Genuinely ambiguous
after reading issue + overview + handoff? Stop and ask in a Linear comment.

## Tech stack (locked, with what actually shipped)

- **Framework:** Astro `^6.3.8` with React 18 (`^18.3.1`) islands.
- **Language:** TypeScript `strict: true`, `noUncheckedIndexedAccess: true`,
  `~/*` path alias → `./src/*`.
- **Styling:** Tailwind `^4.3.0` via `@tailwindcss/vite`. Configuration is
  **CSS-first** via the `@theme` block in `src/styles/global.css` — there is
  no `tailwind.config.ts`. The `:root` block mirrors the handoff's
  `hifi-tokens.css`; `@theme` translates each `--c-*` variable into a
  Tailwind utility via `var()` references so a `:root` swap flows through
  every utility.
- **Interactive primitives:** Radix UI (`@radix-ui/react-*`) only — never a
  styled component library. Wrappers in `src/islands/ui/` are the styling
  layer; feature code never imports from `@radix-ui/*` directly.
- **Validation:** Zod (pipeline epic).
- **Testing:** Vitest `^4.1.7` + React Testing Library (unit + component,
  jsdom). Playwright `^1.60` + `@axe-core/playwright` (e2e + a11y).
  Lighthouse CI (perf budgets, in CI).
- **Tooling:** pnpm `10.15.1` pinned via `packageManager` + corepack. Node
  22 LTS, minimum 22.12.0 (Astro 6 floor); `.nvmrc` pins major `22`. ESLint
  10 (flat config), Prettier, Husky + lint-staged, commitlint — all live.
- **Hosting:** Cloudflare Pages, Cloudflare Stream (video), Cloudflare R2
  (portraits) — **not provisioned yet**.

Non-obvious pins: `@vitejs/plugin-react ^5` (v6 needs Vite 8; Tailwind 4
ships Vite 7), and coverage needs `@vitest/coverage-v8` alongside `vitest`.

Locked decisions — don't drift. Justify every new dep in the PR.

## Hard rules

- **pnpm only.** No `package-lock.json`, no `yarn.lock`.
- **TS strict + `noUncheckedIndexedAccess` from day one.** Don't relax.
- **No Cloudflare credentials yet.** Anything needing real CF creds is
  blocked until the agency creates the account.
- **No secrets in the repo.** Only `.env.example` with placeholder names.
- **Safeguarding (permanent, non-negotiable):**
  - First names only in public UI. Schema must not allow surnames.
  - No public submission form. No comments. No DMs. No accounts.
  - Video comments disabled at the Cloudflare Stream level.
  - Portrait images are static stills supplied separately; no upload path.
    If a future issue asks for something that violates these, refuse and flag
    it on the issue.
- **Design tokens only.** No ad-hoc colour, spacing, or radius values that
  bypass the tokens declared in `src/styles/global.css` (mirror of
  `design/handoff/project/hifi-tokens.css`) and surfaced as Tailwind
  utilities via the `@theme` block. Tailwind 4 is JIT, so utilities only
  emit when referenced — don't pre-list them.
- **Performance & a11y budgets are enforced in CI:** <500KB initial home
  load on 3G, <3s TTI on simulated mid-range Android over 3G, zero
  axe-core WCAG 2.1 AA violations, no video loads until a card opens,
  reduced-motion respected globally, full keyboard navigation.

## Repo layout

Shape today (grows as epics land):

```
.
├── .github/
│   ├── actions/setup/        # composite checkout + pnpm + node + install
│   └── workflows/ci.yml      # lint / typecheck / test / build / e2e / lhci
├── .husky/                   # pre-commit (lint-staged), commit-msg (commitlint + forbidden trailers)
├── design/
│   ├── README.md             # project-side orientation for the handoff
│   └── handoff/              # read-only agency bundle — do not edit
├── src/
│   ├── components/           # Astro components (empty)
│   ├── islands/
│   │   ├── ui/               # Radix wrappers — see README inside
│   │   └── _demo/            # demo-only fixtures, coverage-excluded
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── demo/             # dev verification surfaces (no underscore)
│   ├── styles/global.css     # tokens + @theme + reduced-motion guard
│   └── lib/                  # empty
├── content/, schemas/, scripts/, public/   # placeholder dirs
├── docs/
│   ├── contributing.md       # commit conventions, local loop, --no-verify
│   └── ci.md                 # workflow per-job docs, branch protection
├── tests/
│   ├── README.md             # Vitest conventions
│   ├── setup.ts              # jest-dom matchers + afterEach(cleanup)
│   ├── unit/                 # cross-cutting specs; co-located OK too
│   └── e2e/                  # Playwright + axe — see README inside
├── astro.config.mjs          # React + @tailwindcss/vite
├── tsconfig.json             # extends astro/tsconfigs/strict, ~/* alias
├── vitest.config.ts          # jsdom, alias, 80% v8 coverage floor
├── playwright.config.ts      # 3 projects (chromium-desktop/webkit/mobile)
├── eslint.config.js          # flat config; ts/astro/react/a11y rules
├── .prettierrc.json, .prettierignore
├── commitlint.config.js
├── .lighthouserc.json        # performance budgets (CLS/FCP/LCP/TBT/perf)
├── .nvmrc, .gitattributes, .gitignore
└── package.json              # engines + packageManager + scripts
```

Notably absent yet: `tailwind.config.ts` (Tailwind 4 is CSS-first; the
DEV-85 swap will not bring this back), `schemas/voice.ts` and
`content/voices.json` (pipeline epic), `docs/ops/` (operational runbooks).

## Git: branches, commits, PRs

- **One branch per issue**, using the `gitBranchName` Linear suggests.
- **One PR per issue**, targeting `main`. Squash merge. CI must be green.
- **PR title:** `DEV-XX: <issue title>`. Body copies the issue's Goal and
  walks each acceptance criterion. Reference the issue ID so Linear links.
- **Conventional Commits.** Format: `<type>(<scope>): <imperative summary>`
  (lowercase, no trailing period, ≤72 chars). Types: `feat`, `fix`, `chore`,
  `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`.
- **Every commit body ends with `Part of DEV-XX`** on its own line (Linear
  watches for this exact phrase). Use `Part of DEV-X, DEV-Y` when a commit
  genuinely satisfies two issues (e.g. landing a deferred spec).
- **No issue ID in the summary line** — only in the `Part of` trailer.
- **No author trailers.** No `Co-authored-by`, no `Signed-off-by`, no
  "Generated with Claude Code" lines.
- **Group commits by intent**, not by file. One commit = one coherent
  change. A typical issue is 3–8 commits. No `wip`, no "fix typo" chase
  commits — rebase/amend before pushing.
- Commitlint + the `commit-msg` Husky hook enforce most of this at
  `git commit` time. See `docs/contributing.md` for the full rules.

## How to work an issue

1. Read the Linear issue in full (Goal, Scope, AC, Technical Notes,
   comments) and the project overview if it's been a while.
2. Read relevant `design/handoff/project/*.jsx` and the touched code paths.
3. Plan. If your plan diverges from the issue, flag it in the PR
   description or a Linear comment before implementing.
4. Implement, sticking tightly to scope. Run the local loop:
   `pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build`
   (each becomes available from the issue that adds it).
5. Verify every acceptance criterion. Open the PR. Stop and wait.

## Conventions and where they live

Each area has its own README; this list is the index. Add new pointers
here, not the conventions themselves.

- **`design/README.md`** — handoff orientation, isolation rules.
  `design/handoff/` is read-only — never edit.
- **`src/islands/ui/README.md`** — Radix wrapper conventions: when to wrap,
  file/naming, the `asChild` pattern, `client:*` directive choices, and a
  checklist for adding a primitive.
- **`tests/README.md`** — Vitest spec locations, Testing Library vs raw
  Vitest, coverage interpretation, script table.
- **`tests/e2e/README.md`** — Playwright runbook: BASE_URL workflow, the
  three browser projects, the `runAxe` a11y gate, writing a new spec.
- **`docs/contributing.md`** — setup, commit format, forbidden trailers,
  commit grouping, the local validation loop, the `--no-verify` escape.
- **`docs/ci.md`** — workflow per-job docs, the localhost-vs-Pages note,
  Lighthouse budgets, branch-protection rules + the `gh api` command.

## Local setup gotchas

- **Node ≥22.12.0** (Astro 6 floor). `.nvmrc` pins major `22`; `nvm use`
  picks the latest 22 LTS installed. `nvm install --lts && nvm use --lts`
  to bump.
- **pnpm via corepack** — no global install. If `corepack enable pnpm` hits
  a signature mismatch on older Node, run `npm install -g corepack@latest`.
- **Non-interactive shells may miss nvm.** If `node --version` is wrong,
  prefix: `export PATH="$HOME/.nvm/versions/node/v22.<x>/bin:$PATH"`.
- **Local rebase before push is fine** to tidy intra-PR history. Force-push
  of an already-pushed branch is not — discuss first.

## Live debts (cross-issue commitments)

- **`/demo/*` ships to prod for now.** DEV-81 adds `Disallow: /demo/` to
  `robots.txt` and a sitemap filter. Future demo pages: `src/pages/demo/`.
- **Tailwind ESLint plugin is missing** — DEV-85 will swap in a Tailwind-4-
  compatible alternative. Until then, unknown classes and arbitrary `[]`
  values pass lint silently; `prettier-plugin-tailwindcss` handles ordering.
- **CI runs against a localhost preview**, not the Cloudflare Pages preview.
  Blocked on DEV-8 (the agency creating the CF account). When that lands,
  `e2e` switches via `BASE_URL` and `lighthouse` via `.lighthouserc.json` —
  see `docs/ci.md`.
- **Branch protection rules need configuring in the GitHub UI** — exact
  required checks and a copy-pasteable `gh api PUT` command live in
  `docs/ci.md`.
- **Focus-trap test for Radix Dialog** is still owed — Playwright infra
  exists now, but the spec lands when the player card epic (DEV-42+)
  touches the wrapper.
- **Deferred-spec pattern.** When a spec needs tooling not yet installed,
  flag deferred in the PR and land later with
  `Part of DEV-<owning>, DEV-<deferred>` on the commit.

## Current state

**Epic 2 complete.** DEV-12 → DEV-19 all merged; the foundation is live
(scaffold, design tokens, Radix wrappers, Vitest, Playwright + axe,
ESLint/Prettier/Husky/commitlint, GitHub Actions CI with Lighthouse).
CI is the merge gate, with `docs/ci.md` documenting the per-job graph.

Next: **Epic 3 — Design system** (DEV-20 → DEV-27). Wait for the next
kickoff before starting; same "one issue at a time, stop after each
merged PR" workflow applies.

Outstanding follow-ups: see **Live debts** above. The biggest two are
DEV-85 (Tailwind ESLint plugin) and the manual branch-protection
configuration.

## Living document

Update this file in the same PR if, during any later issue, future Claude
sessions would benefit from extra context here. Keep it pointers and
decisions only — never secrets, never anything sensitive (it lives in git
history forever).

When something changes that this file no longer reflects — a stack
decision shifts, a new convention emerges, a path moves — update it then,
not later.
