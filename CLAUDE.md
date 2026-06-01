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

Linear issue contradicts this file? The issue wins. When the issue's
Scope conflicts with the design handoff, resolve by the **kind** of
conflict, not by pausing reflexively:

- **Value conflict** — same component and treatment, but a different
  pixel, colour, size, gap, radius, or copy detail. The handoff (the
  pixel-perfect source) wins: apply it and note the divergence in the PR
  description. **Don't stop for this.** (e.g. DEV-60's grid gaps and
  DEV-61's load-more button style were value conflicts — both should be
  resolved silently with a PR note.)
- **Kind conflict** — a different component, the opposite treatment, or a
  semantically different element. Stop and ask in a Linear comment before
  building. (e.g. DEV-53's pivot/values question was correctly
  kind-different.)

Genuinely ambiguous after reading issue + overview + handoff? Treat it as
a kind conflict — stop and ask.

**Replacement copy passes.** The handoff prototype can be revised
mid-project — `hifi-about.jsx` carried a dated "Replacement copy pass"
that rewrote the body, the closing pair, and a designed moment. When the
prototype's most-recent state postdates the issue prose, the prototype
wins even for kind-level copy rewrites, because the issue is then the
stale artifact. Epic 9 confirmed this precedent: `/about` followed the
revised `hifi-about` over the DEV-64/65/66 prose, divergences noted in
each PR. Flag the choice once; don't re-litigate every paragraph.

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
  10 (flat config) with `eslint-plugin-better-tailwindcss` reading classes
  from `src/styles/global.css`'s `@theme`, Prettier, Husky + lint-staged,
  commitlint — all live.
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
  `eslint-plugin-better-tailwindcss` enforces this at commit + CI time
  via `no-unknown-classes`; a class that doesn't resolve through the
  `@theme` block fails lint.
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
│   ├── components/           # Astro chrome + primitives — see README inside
│   │   ├── about/            # page-scoped (MovementStats — the count-up stat cards)
│   │   └── home/             # page-scoped compositions (VoiceCounterCard, StartingEleven, WhyThisBand)
│   ├── islands/
│   │   ├── ui/               # Radix wrappers — see README inside
│   │   ├── _demo/            # demo-only fixtures, coverage-excluded
│   │   ├── CountUp.tsx          # count-up-on-scroll stat number (about; client:idle)
│   │   ├── LanguageSwitcher.tsx
│   │   ├── PortraitImage.tsx
│   │   ├── RotatingEleven.tsx   # home starting-eleven rotation (client:idle)
│   │   ├── RotationTile.tsx     # shared React tile (home rotation + squad grid)
│   │   ├── LetterRail.tsx       # letter signature rail
│   │   ├── SquadFilters.tsx     # squad filter bar (theme/country/language/age) + URL
│   │   ├── SquadGrid.tsx        # squad responsive grid: skeleton, load-more, empty state
│   │   └── SquadEmptyState.tsx  # zero-match empty state (React, inside SquadGrid)
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro       # the home page (Epic 5) — hero, counter, eleven, why-this
│   │   ├── letter.astro      # the open letter (Epic 7)
│   │   ├── squad.astro       # the full squad (Epic 8) — filter bar + grid island
│   │   ├── about.astro       # the about page (Epic 9) — hero, Q&A, body, stats
│   │   └── demo/             # dev verification surfaces (no underscore)
│   ├── styles/global.css     # tokens + @theme + reduced-motion guard
│   └── lib/                  # pure helpers (variant resolvers, data, formatters)
├── content/                  # voices.json (pipeline-generated) + letter/*.md (hand-edited)
├── schemas/                  # Zod content boundary — voice.ts, letter.ts
├── scripts/                  # fetch-voices.ts pipeline + pipeline/ helpers
├── public/                   # static assets (logo SVG, favicons)
├── .env.example              # PUBLIC_* env var template (DEV-26+)
├── docs/
│   ├── contributing.md       # commit conventions, local loop, --no-verify
│   ├── ci.md                 # workflow per-job docs, branch protection
│   └── ops/                  # sheet schema, campaign-team guide, letter editing, pipeline runbook
├── tests/
│   ├── README.md             # Vitest conventions
│   ├── setup.ts              # jest-dom matchers + afterEach(cleanup)
│   ├── fixtures/             # shared sample data (voices.ts — 16 sample voices; not pipeline-touched)
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

Notably absent: `tailwind.config.ts` (Tailwind 4 is CSS-first — the
class linter reads `src/styles/global.css` via its `entryPoint` setting
instead). `src/lib/voice.ts` re-exports the Zod-derived `Voice` type
from `schemas/voice.ts` (the DEV-29 placeholder was replaced in Epic 4).

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
- **`src/components/README.md`** — design-system primitives index
  (Wordmark, Header, Footer, Button family, Portrait, Tile, …) plus a
  "Page-scoped compositions" table (`src/components/home/*`,
  `src/components/about/*`, `RotatingEleven`) for things that ship to one
  page rather than the
  shared system. Import paths, variants, demo routes, specs. Also the
  "variant logic lives in `src/lib/`" rule — Astro files stay thin
  shells over pure resolvers so Vitest can pin every variant.
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
- **Design-token divergences from the handoff.** Three landed in
  DEV-24/DEV-25 for white-on-fill WCAG AA failures (Amber button default,
  Deep button default, `--c-fairness` nudged). Tracked in
  `tests/unit/styles/design-tokens.test.ts`'s `INTENTIONAL_DIVERGENCES`
  allowlist — add new entries there or push back upstream. **Epic 5
  reused `--c-fairness` (#007AB1) as the voice counter card fill**
  because Process Cyan #00AEEF fails AA against white at every text
  size (DEV-37) — flagged to the agency, pending review.
- **`text-ink-3` on a `bg-paper-2` fill is 4.45:1 — below AA.** Use
  `text-ink-2` for small text on paper-2 surfaces (hit on the voice
  counter error label, the DEV-36 stubs, and the why-this kicker).
- **White on Process Cyan #00AEEF never clears AA** (≈2.5:1 even at
  124px). The "Deep" brand-fill role uses the darker AA-safe companions
  instead — never white-on-#00AEEF for real content.
- **Mobile nav drawer** and **Tile route shape** (`/voice/:id` is a
  placeholder until the Player Card epic) are deferred decisions —
  surface when those scopes firm up. (The footer was trimmed to three
  columns — The Letter / The Squad / Project — dropping the Partners/
  Press/Contact stubs and the UNICEF column; Project now links About +
  the external Fix My Food campaign. Only the Privacy/Terms/Accessibility
  meta row still carries `data-todo` markers, for DEV-82.)
- **Design-system gaps from Epic 9 (backlog, pre-launch).** DEV-90: add
  named font-size tokens for the 120px question and the 96px stat number,
  replacing the `text-[120px]` arbitrary value and the `--text-dropcap`
  reuse (96px coincides but it isn't a drop cap). DEV-91: extend
  `<Tagline>` with `color` and `as` props so consumers stop hand-classing
  around the fixed-ink `<p>` (the about Q&A had to). Neither blocks Epic 10.
- **lhci surfaces numbers only on failure.** It prints per-URL scores when
  an assertion fails but stays quiet on success, and the workflow doesn't
  upload the HTML report as an artifact on green runs — so exact passing
  scores aren't quotable. Future follow-up: upload the lhci HTML report as
  a PR artifact on success too.

## Current state

**Epics 3, 4, 5, 7, 8, and 9 complete.** Epic 6 (Player Card) is deferred —
see Next.

- **Epic 3 (design system, DEV-20 → DEV-27):** primitives live, demoed
  at `/demo/<name>`. Inventory in `src/components/README.md`.
- **Epic 4 (content pipeline, DEV-28 → DEV-34):** Zod schema, sheet docs,
  letter markdown, typed loaders, the fetch script, and the every-2-hours
  scheduled sync — merged and self-sustaining.
- **Epic 5 (home page, DEV-36 → DEV-41):** `/` — hero + CTAs, the
  Process-Cyan voice counter card, the rotating 1-4-3-3 starting eleven,
  the "why this letter" band, the canonical home E2E suite.
- **Epic 7 (the letter):** `/letter` — the open letter body, the
  signature rail (`LetterRail`), share section, sign-off, and language
  switching.
- **Epic 8 (the full squad, DEV-57 → DEV-62):** `/squad` — page shell +
  header count, the four-dimension filter bar with URL state, the
  responsive grid with skeleton + 24-at-a-time load-more, and the
  zero-match empty state. Canonical guard: `tests/e2e/squad.spec.ts`.
- **Epic 9 (about page, DEV-64 → DEV-67):** `/about` — the explainer.
  Hero, the asymmetric question/answer designed moment ("Whose game is it
  anyway?" / "It's ours."), the body prose + closing pair, and the
  "movement in numbers" stat cards that count up on scroll-in from the
  live loader counts. Followed the revised `hifi-about` prototype over the
  issue prose (see the replacement-copy-pass rule above). Canonical guard:
  `tests/e2e/about.spec.ts`.

Conventions worth carrying forward:

- **Variant logic in `src/lib/`.** Astro shells stay thin; pure resolvers
  in lib (e.g. `buttonClasses`, `pickPortraitVariant`, `flagGradient`,
  `formationRows`, `rotateOnce`) carry the prop-to-class / behaviour
  mapping so Vitest can pin every variant without rendering.
- **Attribute hooks** (`[data-pulse]`, `[data-flash]`, `[data-skeleton]`,
  `[data-tile]`, `[data-sticky-trigger]`, `[data-eleven-formation]`)
  drive animation + state + test selection from CSS/JS without inventing
  custom class names — keeps the better-tailwindcss `no-unknown-classes`
  rule quiet without an allowlist.
- **The pipeline owns `content/voices.json`.** The scheduled sync
  overwrites it (back to the live sheet) within 2h of any merge — never
  hand-seed it to make a feature or test work. Test data that needs more
  voices than the sheet currently has lives in `tests/fixtures/voices.ts`
  (16 sample voices, never pipeline-touched).
- **`/demo/*` + fixtures are the canonical way to exercise a grid/island
  at scale.** The live pool (`content/voices.json`) is too small and too
  volatile to drive pagination, rotation, or filtering deterministically,
  so the behaviour suites run against demo pages seeded from
  `tests/fixtures/voices.ts`: `/demo/starting-eleven` (16) for the home
  rotation, `/demo/squad-grid` (16) for filtering, `/demo/squad-load-more`
  (56) for pagination. The page's own spec (`home.spec.ts`, the `/squad`
  block of `squad.spec.ts`) then checks the real page at its live count —
  derive counts as `min(pageSize, count)` rather than hard-coding, so it
  passes at 0, 3, 11, or 350 voices.
- **The squad is three islands over one event bus.** `SquadFilters` (the
  bar) owns filter state and is the single source of truth: it writes the
  URL and broadcasts `squad:filters-changed`. `SquadGrid` listens, mirrors
  the state, and re-filters — it never owns filters. The empty-state CTA
  inside the grid clears by dispatching `squad:filters-reset`, which the
  bar listens for and applies — a sibling island resets filters without
  reaching into the bar's state. Both event names live in
  `src/lib/squad-url.ts`; pure grid logic (sort, links, page size,
  indicator copy) in `src/lib/squad-grid.ts`.
- **Below-the-fold islands hydrate `client:idle`, not `client:visible`.**
  Keeps React hydration out of the Lighthouse TBT window on a cold load
  (DEV-39: `client:visible` blew the 200ms TBT budget; `client:idle`
  brought it to 0). e2e that clicks into such an island must wait for an
  idle callback first — see `waitForIslandHydration` in `rotation.spec.ts`.
- **Count-up-on-scroll (`CountUp.tsx`).** SSR renders the final value, so
  no-JS visitors and the first paint see the real number and hydration
  matches; an IntersectionObserver resets to 0 and animates up once (then
  `unobserve`s) — invisible because the cards sit below the fold. The
  animated digits are `aria-hidden`; a visually-hidden span carries the
  value so a screen reader announces it once, not every tick (preferred
  over `aria-label` on a generic element, which isn't reliably announced).
  Reduced motion → no animation; the final value stays.
- **Lighthouse takes the median of 3 runs** (`.lighthouserc.json`:
  `numberOfRuns: 3` + per-assertion `aggregationMethod: median-run`). A
  single run made the home-page perf/FCP/TBT budget flaky on shared CI
  runners — identical code passed and failed across runs — so median-of-3
  absorbs a one-off spike while a genuine regression still fails.

Next: **Epic 10 — i18n (DEV-69 → DEV-72)**, still Cloudflare-free — a
cross-cutting change (routing, dictionaries, RTL, language-switcher
wiring) rather than a new page, so read the issues before starting.
**Epic 6 — Player Card (DEV-43 → DEV-49)** is deferred until Cloudflare
(DEV-8/9/10) lands: it's the first epic that needs Stream (the video
embed) and R2 (portraits). A `focus-trap test for the Radix Dialog` is
owed there too (see Live debts). The squad already links tiles to
`/voice/:id?from=squad&{filters}`, ready for that route to exist.

## Living document

Update this file in the same PR if, during any later issue, future Claude
sessions would benefit from extra context here. Keep it pointers and
decisions only — never secrets, never anything sensitive (it lives in git
history forever).

When something changes that this file no longer reflects — a stack
decision shifts, a new convention emerges, a path moves — update it then,
not later.
