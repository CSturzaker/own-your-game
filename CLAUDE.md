# CLAUDE.md

Project context for Claude Code sessions. Read this first on every start.
Keep it lean — under ~200 lines. Add to it as conventions emerge; don't let it
rot.

## What this is

**Own Your Game** is a UNICEF youth-led campaign site anchored on the 2026
FIFA World Cup. Around 350 young people (~42 countries, ages 15–25) record
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
- **Fonts:** self-hosted + subset via `@fontsource-variable` (Space Grotesk
  display, Noto Sans body), imported in `global.css` (DEV-75) — no Google
  Fonts CDN. Noto Sans Arabic is injected per-locale (inline `@font-face`
  in `BaseLayout`, RTL only).
- **Interactive primitives:** Radix UI (`@radix-ui/react-*`) only — never a
  styled component library. Wrappers in `src/islands/ui/` are the styling
  layer; feature code never imports from `@radix-ui/*` directly.
- **Validation:** Zod — **pipeline/build-time only; must never reach the
  client bundle.** Import theme tokens from the Zod-free `~/lib/themes`,
  never from a module that constructs schemas (DEV-76).
- **Testing:** Vitest `^4.1.7` + React Testing Library (unit + component,
  jsdom). Playwright `^1.60` + `@axe-core/playwright` (e2e + a11y).
  Lighthouse CI (perf budgets, in CI).
- **Tooling:** pnpm `10.15.1` pinned via `packageManager` + corepack. Node
  22 LTS, minimum 22.12.0 (Astro 6 floor); `.nvmrc` pins major `22`. ESLint
  10 (flat config) with `eslint-plugin-better-tailwindcss` reading classes
  from `src/styles/global.css`'s `@theme`, Prettier, Husky + lint-staged,
  commitlint — all live.
- **Hosting:** Cloudflare Pages, Cloudflare Stream (video), Cloudflare
  Images (portraits) — provisioned (DEV-95).

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
│   │   ├── home/             # page-scoped compositions (VoiceCounterCard, StartingEleven, WhyThisBand)
│   │   └── pages/            # full-page bodies shared by `/` and `/[lang]/` (Home/Letter/Squad/About)
│   ├── islands/
│   │   ├── ui/               # Radix wrappers — see README inside
│   │   ├── _demo/            # demo-only fixtures, coverage-excluded
│   │   ├── CountUp.tsx          # count-up-on-scroll stat number (about; client:idle)
│   │   ├── LanguageSwitcher.tsx
│   │   ├── MobileNav.tsx        # mobile header hamburger + nav drawer (Drawer side sheet; client:idle; DEV-103)
│   │   ├── PortraitImage.tsx
│   │   ├── RotatingEleven.tsx   # home starting-eleven rotation (client:idle)
│   │   ├── RotationTile.tsx     # shared React tile (home rotation + squad grid)
│   │   ├── LetterRail.tsx       # letter signature rail
│   │   ├── SquadFilters.tsx     # squad filter bar (theme/country/language/age) + URL
│   │   ├── SquadGrid.tsx        # squad responsive grid: skeleton, load-more, empty state
│   │   ├── SquadEmptyState.tsx  # zero-match empty state (React, inside SquadGrid)
│   │   ├── PlayerCard.tsx       # shared two-column card body; video=children, chips slot (SSR on page + client in modal)
│   │   ├── PlayerCardModal.tsx  # controlled desktop modal shell (Radix Dialog; Epic 6 DEV-44)
│   │   ├── PlayerCardOverlay.tsx # intercepted-route opener (mounted in BaseLayout; desktop only ≥lg)
│   │   ├── PlayerControls.tsx   # standalone-page footer enhancer: active-set prev/next, dots, swipe, keyboard, close (Epic 6 DEV-45/48)
│   │   ├── StreamPlayer.tsx     # Cloudflare Stream iframe player — lazy mount, poster/playing/error (Epic 6 DEV-46)
│   │   └── PlayerChips.tsx      # caption / transcript / share chip row (Epic 6 DEV-47)
│   ├── i18n/                 # locale config, localiseUrl, t()/dictionaries (Epic 10) — see docs/ops/i18n.md
│   ├── layouts/BaseLayout.astro
│   ├── pages/                # thin route files render src/components/pages/* bodies
│   │   ├── index.astro       # `/` (en) — home (Epic 5)
│   │   ├── letter.astro      # `/letter` (en) — open letter (Epic 7)
│   │   ├── squad.astro       # `/squad` (en) — full squad (Epic 8)
│   │   ├── about.astro       # `/about` (en) — about (Epic 9)
│   │   ├── voice/[id].astro  # `/voice/:id` (en) — player card direct visit (Epic 6)
│   │   ├── voices-index.json.ts   # static lazy-load index (DEV-107)
│   │   ├── voice-data/[id].json.ts # static per-voice heavy data + transcript (DEV-107)
│   │   ├── [lang]/           # /es,/fr,/ar,/pt localised routes (incl. voice/[id]) — Epic 10
│   │   └── demo/             # dev verification surfaces (no underscore)
│   ├── styles/global.css     # tokens + @theme + reduced-motion guard
│   └── lib/                  # pure helpers (variant resolvers, data, formatters)
├── content/                  # voices.json (pipeline-generated) + letter/*.md + transcripts/*.md (hand-edited)
├── schemas/                  # Zod content boundary — voice.ts, letter.ts; themes.ts (Zod-FREE — THEMES/Theme, client-safe, DEV-76)
├── scripts/                  # fetch-voices.ts pipeline + pipeline/ helpers
│   └── ingest/               # DEV-104 standalone intake→Cloudflare→CSV ingest tool (run by hand; not CI) — see README inside
├── public/                   # static assets (logo SVG, favicons)
├── .env.example              # PUBLIC_* env var template (DEV-26+)
├── docs/
│   ├── contributing.md       # commit conventions, local loop, --no-verify
│   ├── ci.md                 # workflow per-job docs, branch protection
│   ├── a11y/                 # audit-2026-06.md — WCAG 2.1 AA audit (DEV-77)
│   ├── audit/                # bundle-2026-06.md + treemap — JS bundle audit (DEV-76)
│   └── ops/                  # sheet schema, campaign-team guide, letter editing, pipeline + i18n + stream + portraits runbooks, performance.md (Lighthouse budgets), secrets.md (env-var index)
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
   `pnpm install && pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`
   (each becomes available from the issue that adds it). `format:check`
   is a separate CI gate from `lint` — skipping it locally is how an
   unformatted file slips through to fail CI.
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
- **`scripts/ingest/README.md`** — the DEV-104 standalone ingest tool
  (intake `.xlsx` → Cloudflare Stream/Images → reviewed campaign CSV).
  Run by hand with creds; never CI. Safeguarding gates, the idempotency
  manifest, the layer map, and the three open-question defaults. Intake
  `*.xlsx` + `files/` are gitignored (youth PII); the import CSV is
  gitignored; only `upload-manifest.json` (PII-free) is tracked.

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
- **Focus-trap test for Radix Dialog** — landed in DEV-44 as
  `tests/e2e/dialog-focus-trap.spec.ts` (driven through the player-card
  modal demo): open-focuses-close, Tab/Shift+Tab trap, Escape closes +
  returns focus to the trigger, scrim-click closes, axe-clean. Was the
  debt deferred from DEV-15.
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
  size (DEV-37) — flagged to the agency, pending review. **DEV-75 added
  three more entries** for the `--font-*` tokens (self-hosted
  `@fontsource` family names + Arabic fallback; JetBrains Mono dropped).
- **`text-ink-3` on a `bg-paper-2` fill is 4.45:1 — below AA.** Use
  `text-ink-2` for small text on paper-2 surfaces (hit on the voice
  counter error label, the DEV-36 stubs, and the why-this kicker).
- **White on Process Cyan #00AEEF never clears AA** (≈2.5:1 even at
  124px). The "Deep" brand-fill role uses the darker AA-safe companions
  instead — never white-on-#00AEEF for real content.
- **Mobile nav drawer — done (DEV-103).** The header hamburger
  (`lg:hidden`) opens a Radix Dialog **side sheet** — the `Drawer`
  primitive (`src/islands/ui/Drawer.tsx`, a Dialog variant pinned to the
  inline-end edge) driven by the `MobileNav` island
  (`src/islands/MobileNav.tsx`, `client:idle`). It carries the four nav
  links (active-highlighted) + a language list; focus-trapped, RTL-aware
  (the slide flips via the `[data-drawer-panel]` hooks in `global.css`,
  collapsed by the reduced-motion guard). It's the only in-header
  cross-page nav below `lg`. The trigger keeps a **stable** accessible
  name + `aria-expanded` (disclosure pattern), not a label swap. The
  desktop **Share CTA is itself a no-op placeholder** — deliberately not
  replicated in the drawer (a known dead control; wire/track separately).
  Guard: `tests/e2e/mobile-nav.spec.ts`.
- **Tile route shape** (`/voice/:id`) is now the real Player Card (Epic 6),
  no longer a placeholder. (The footer was trimmed to three
  columns — The Letter / The Squad / Project — dropping the Partners/
  Press/Contact stubs and the UNICEF column; Project now links About +
  the external Fix My Food campaign. Only the Privacy/Terms/Accessibility
  meta row still carries `data-todo` markers, for DEV-82.)
- **Design-system gaps from Epic 9 — both done.** DEV-90: the display
  scale now carries semantic names — `text-question` (120px) and
  `text-stat` (96px) joined `text-answer` (88), `text-dropcap` (96,
  drop caps only), and `text-hero-about` (104) in
  `src/styles/global.css`'s `@theme`; `/about` no longer uses
  `text-[120px]` or reuses `text-dropcap` for the stat numbers. DEV-91:
  `<Tagline>` gained `color` (ink·deep-cyan) and polymorphic `as`
  (p·blockquote·div) props (`taglineClasses()` resolver in
  `~/lib/primitives`); the About Q&A now uses `<Tagline>` instead of
  hand-classing the motif. Per-placement tracking overrides go through
  an inline `style` (the About Q&A's `-0.015em`), matching the handoff
  and dodging `no-conflicting-classes`. The Letter's `tagline-question`
  directive stays hand-rolled (it emits HTML strings, not components).
- **lhci results are surfaced on the PR (DEV-89).** The `lighthouse`
  job posts/updates a PR comment with a per-URL table (median perf,
  FCP, LCP, TBT, CLS + the per-run spread, ⚠️ on a non-median CLS
  breach), parsed from the raw `lhr-*.json` and run `if: always()` so
  it posts on green and red alike. It covers `/`, `/letter`, `/squad`,
  `/about`, `/voice/:id`. `temporaryPublicStorage` stays **off** — the
  public LHCI report screenshots capture children's names/portraits,
  which must not leave the repo (safeguarding); the comment + artifact
  cover it. **DEV-78 made the budgets per-page** (`assertMatrix`); the
  table + rationale live in `docs/ops/performance.md`.

## Current state

**Epics 3, 4, 5, 6, 7, 8, 9, 10 (i18n), and 11 (perf + a11y) complete.**
Cloudflare is provisioned (Pages/Stream/Images;
`PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` + `PUBLIC_CF_IMAGES_ACCOUNT_HASH` in CI

- deploy env). Portraits are on **Cloudflare Images**, not R2 (DEV-95
  superseded the R2 + Image-Resizing plan). Epic 12 (launch readiness) is
  next.

* **Epic 3 (design system, DEV-20 → DEV-27):** primitives live, demoed
  at `/demo/<name>`. Inventory in `src/components/README.md`.
* **Epic 4 (content pipeline, DEV-28 → DEV-34):** Zod schema, sheet docs,
  letter markdown, typed loaders, the fetch script, and the every-2-hours
  scheduled sync — merged and self-sustaining.
* **Epic 5 (home page, DEV-36 → DEV-41):** `/` — hero + CTAs, the
  Process-Cyan voice counter card, the rotating 1-4-3-3 starting eleven,
  the "why this letter" band, the canonical home E2E suite.
* **Epic 7 (the letter):** `/letter` — the open letter body, the
  signature rail (`LetterRail`), share section, sign-off, and language
  switching.
* **Epic 8 (the full squad, DEV-57 → DEV-62):** `/squad` — page shell +
  header count, the four-dimension filter bar with URL state, the
  responsive grid with skeleton + 24-at-a-time load-more, and the
  zero-match empty state. Canonical guard: `tests/e2e/squad.spec.ts`.
* **Epic 9 (about page, DEV-64 → DEV-67):** `/about` — the explainer.
  Hero, the asymmetric question/answer designed moment ("Whose game is it
  anyway?" / "It's ours."), the body prose + closing pair, and the
  "movement in numbers" stat cards that count up on scroll-in from the
  live loader counts. Followed the revised `hifi-about` prototype over the
  issue prose (see the replacement-copy-pass rule above). Canonical guard:
  `tests/e2e/about.spec.ts`.
* **Epic 11 (perf + a11y hardening, DEV-95, DEV-74 → DEV-78):**
  - **DEV-95 portraits → Cloudflare Images.** Schema field is
    `portraitImageId` (optional CF Images ID, not a filename);
    `portraitUrl(imageId, size)`/`portraitSrcset` in
    `src/lib/portrait-url.ts` build flexible-variant delivery URLs
    (`imagedelivery.net/{hash}/{id}/{transform}`) with `gravity=face`;
    account hash in `PUBLIC_CF_IMAGES_ACCOUNT_HASH`. Upload runbook:
    `docs/ops/portraits.md`. Card crop is 800×800 square (designer-confirmed).
  - **DEV-74 images.** Real portraits are wired into the grid tiles
    (`Tile.astro` + `RotationTile` over the silhouette via `PortraitImage`);
    1×/2× DPR `srcset` (dpr in the transform path); demo fixtures stay
    silhouette-only (no `portraitImageId`) so the grids don't 404 in CI.
  - **DEV-75 fonts self-hosted.** Google Fonts CDN is gone — Space Grotesk
    - Noto Sans via `@fontsource-variable` (subset, `font-display: swap`),
      imported in `global.css`; the display Latin subset is preloaded in
      `BaseLayout`. Family names carry the `Variable` suffix. **Noto Sans
      Arabic is injected per-locale** (inline `@font-face` in `BaseLayout`,
      RTL pages only) so the footer's Arabic switcher endonym doesn't pull
      it onto Latin pages. `inlineStylesheets: "auto"` (shared bundle stays
      external + cacheable). Guard: `tests/e2e/fonts.spec.ts`.
      **DEV-105: metric-matched fallback faces** (`Space Grotesk Fallback`
      / `Noto Sans Fallback` in `global.css`, `size-adjust` + ascent/descent
      overrides from `@capsizecss/unpack`, slotted into `--font-*` before
      `system-ui`) make the `swap` fallback→webfont swap layout-neutral —
      it was the entire `/squad` CLS variance (heading + filter-bar reflow
      dragging the grid; the portraits, absolute in a reserved `aspect-4/5`
      box, never shifted). If you change the bundled font files, recompute
      the overrides against the new metrics.
  - **DEV-76 bundle.** **Zod must not reach the client** — `THEMES`/`Theme`
    live in Zod-free `schemas/themes.ts` (re-exported by `schemas/voice.ts`
    - `~/lib/voice`); client code imports them from `~/lib/themes`, never a
      module that builds `z.object(...)`. The player modal is lazy-loaded in
      `PlayerCardOverlay` (`React.lazy` + Suspense) — desktop-only, off
      mobile/idle. `pnpm analyze` → `dist/stats.html` treemap; report in
      `docs/audit/bundle-2026-06.md`.
  - **DEV-77 a11y.** Full WCAG 2.1 AA audit in `docs/a11y/audit-2026-06.md`
    (0 blockers; footer headings `h5→h2` for gap-free order). Manual
    follow-ups: DEV-99 (GUI screen readers), DEV-100 (forced-colors).
  - **DEV-78 perf budgets.** Per-page Lighthouse budgets via `assertMatrix`
    in `.lighthouserc.json` (Perf ≥0.95, ≥0.90 voice — squad rejoined the
    ≥0.95 / CLS ≤0.05 default in DEV-105 once font-swap CLS was fixed;
    A11y = 1.00;
    BP/SEO ≥0.95 — voice SEO raised from 0.90 to 0.95 once DEV-101 made the
    disabled boundary prev/next a `<button>` not an hrefless `<a>`;
    FCP/LCP/TBT/CLS tightened). Rationale + table: `docs/ops/performance.md`.

Conventions worth carrying forward:

- **Every page has exactly one `<h1>` (DEV-86).** It's the primary
  heading-order landmark for screen readers; the hierarchy must descend
  `h1 → h2 → h3` with no skipped levels. Letter/Squad/About each have a
  visible `<h1>`; the home hero is a wordmark image + tagline (`<p>`)
  with no natural heading, so home carries a **visually-hidden**
  `<h1 class="sr-only">` (`home.srHeading`) as the first element in
  `<main>`. New page issues must include their `h1` from the start —
  prefer a visible one; reach for `sr-only` only when the design hero
  genuinely has no heading element.
- **i18n routing (Epic 10, DEV-69).** Locales live in
  `src/i18n/config.ts` — the single source of truth; `astro.config.mjs`
  imports `LOCALES`/`DEFAULT_LOCALE` from it so they can't drift.
  English is unprefixed (`/letter`); other locales are prefixed
  (`/es/letter`) via explicit `src/pages/[lang]/*.astro` routes
  (`getStaticPaths` over `NON_DEFAULT_LOCALES`) that render shared bodies
  in `src/components/pages/`. The bodies read `Astro.currentLocale`.
  Internal links (Wordmark, Header nav, Footer, CTAs) go through
  `localiseUrl(path, locale)` (preserves query + hash; leaves external
  links alone). **Astro's `i18n.fallback` is deliberately unused** — in a
  static build it shadows the `[lang]` routes with empty files; English
  fallback is handled per-string (dictionary, DEV-70) and per-letter (md
  stubs). `BaseLayout` defaults `lang` to the current locale; RTL `dir`
  is DEV-71 (`RTL_LOCALES`/`isRtl` already in config). See
  `docs/ops/i18n.md`.
- **UI string translation (Epic 10, DEV-70).** All user-facing strings
  live in per-locale dictionaries `src/i18n/dictionaries/{locale}.json`
  (`en` is the source of truth). Astro components resolve them with
  `const { t, tList } = makeT(Astro.currentLocale)` → `t("about.title")`;
  the page-scoped copy libs (`home.ts`, `about.ts`, `*_COPY` constants)
  were deleted and their strings moved into the dictionary. A non-English
  `"TODO: translate"` value satisfies the CI key-parity guard
  (`tests/unit/i18n/dictionaries.test.ts`) but **resolves to English at
  runtime** — half-translated locales show English, never the marker.
  **React islands can't import `t` (it bundles every dictionary)** — their
  Astro host resolves the strings/`{var}` templates and passes them as a
  `strings` prop; islands interpolate counts client-side with the pure
  `interpolate()` from `~/i18n/interpolate` (see `squad-strings.ts` for the
  shared squad bundles). Client-side scripts read strings from `data-*`
  attributes. Only the home starting-eleven, tagline, About prose, and
  letter prose are translated (es/fr/ar) so far; everything else is
  English fallback, pt is fully stubbed. Known English-only bits (squad
  spelled-out headline, the letter `::values` motif) are listed in
  `docs/ops/i18n.md`.
- **RTL layout (Epic 10, DEV-71).** `BaseLayout` sets `<html dir="rtl">`
  when `isRtl(lang)` (Arabic). `dir` cascades, so flex/grid containers
  reverse automatically (header nav, footer, filter chips) — no code. For
  horizontal direction **use logical utilities, not physical**: `ps-/pe-`,
  `ms-/me-`, `inset-s-/inset-e-`, `start-/end-`, `border-s/e`,
  `text-start/end`, `float-start/end`, `ms-auto` (`lint:fix`
  canonicalises, e.g. `start-2`→`inset-s-2`); symmetric utilities (`px-`,
  `mx-`, `inset-x-`, `gap-`) stay. Directional arrows flip with
  `rtl:-scale-x-100`; vertical/diagonal/refresh icons + the wordmark do
  not. User-content names get `dir="auto"`. The Epic 6 player-card swipe
  is a noted follow-up in `docs/ops/i18n.md`. Guarded by
  `tests/e2e/rtl.spec.ts`.
- **Language switcher (Epic 10, DEV-72).** The footer switcher
  (`LanguageSwitcher.tsx`, a Radix Popover) navigates on select via
  `window.location.assign(localiseUrl(window-path, code))` — preserving
  query + hash, dropping the prefix for English. `Footer.astro` resolves
  the native-name options from the dictionary (`languages.{code}`) and
  threads them + the current path + dir in (the island can't call `t()`).
  RTL: Radix Popover has no dir context, so the switcher + squad filter
  popovers flip `Popover.Content` `align` to `end` under RTL. Guarded by
  `tests/e2e/i18n.spec.ts`. Switcher/squad e2e clicks must
  `waitForIslandHydration` first (`client:idle` defers on webkit/mobile).
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
- **The player card is an intercepted route (Epic 6, DEV-43).** `/voice/:id`
  is a real Astro page (`src/components/pages/Player.astro`, en +
  `[lang]/voice/[id]`) for direct visits, shares, and crawlers — its body
  is the React `PlayerCard` rendered _without_ a `client:*` directive
  (Astro SSRs it to static HTML, no JS). The same `PlayerCard` renders
  client-side inside `PlayerCardOverlay`, a single island mounted in
  `BaseLayout` (`client:idle`) that intercepts primary clicks on any
  `a[data-voice-id]` tile, `pushState`s the canonical URL, and opens the
  card as a modal in place; `popstate` drives Back-closes / Forward-reopens,
  and closing calls `history.back()` so both paths converge. Pure helpers
  (`voicePosition`, `voiceNeighbours`, SEO title/OG) in `src/lib/player.ts`;
  strings via `buildPlayerStrings` (`src/i18n/player-strings.ts`). **The
  card no longer surfaces the voice's theme** (DEV-111 stripped the meta-panel
  theme tag + the theme word from the position indicator; `theme` stays on the
  record + the colour tokens, themes show only on The Letter). **The overlay
  no longer inlines the
  voice set — it lazy-loads a lightweight index + per-voice data on demand
  (DEV-107, see the lazy-load convention below).** Demo pages seeded from
  fixtures still don't intercept (the fixture ids aren't in the live index),
  so the modal e2e runs against real pages.
- **The modal shell is `PlayerCardModal` (Epic 6, DEV-44).** A _controlled_
  Radix Dialog (`open`/`onClose`) composing `~/islands/ui/Dialog` (not
  rewrapping it) that frames `PlayerCard` as the prototype's centred
  1240px **two-column** card (video panel left, meta panel right) over the
  ink scrim. `PlayerCardOverlay` renders it for the intercepted flow; the
  standalone page renders `PlayerCard` _inline_ (no scrim/close) — that
  split is the issue's "inline vs modal" `inline` prop. `PlayerCard` owns
  the two-column grid (single column < `lg`); the close button is the
  first focusable child (Radix autofocuses it). **Focus restoration**:
  Radix only restores to a `Dialog.Trigger`, which the controlled modal
  lacks, so `PlayerCardModal` captures the opener on the open edge and
  restores it via `onCloseAutoFocus`; the overlay (which _unmounts_ on
  close rather than toggling `open`) refocuses the originating tile itself.
  **`@radix-ui/react-direction`** is a direct dep: `PlayerCardModal` wraps
  the tree in `<DirectionProvider>` so DEV-47's caption dropdown / share
  popover inherit RTL alignment without per-popover `align` workarounds.
  Demo + focus-trap coverage: `src/pages/demo/player-card.astro` (via
  `src/islands/_demo/PlayerCardModalDemo.tsx`) and
  `tests/e2e/dialog-focus-trap.spec.ts` (the DEV-15 debt, landed here).
  The video pane (`StreamPlayer`, DEV-46) and chip row (`PlayerChips`,
  DEV-47) are now real — the modal builds both from the active voice and
  drops them into `PlayerCard`'s `children` / `chips` slots (see the
  Epic-6-complete notes under Current state). Active-set prev/next + dots +
  keyboard landed in DEV-48.
- **Mobile is a full-page card, not a modal (Epic 6, DEV-45).** Per the
  issue, below `lg` the card is the full-screen standalone page, not a
  Dialog: `PlayerCardOverlay`'s click handler returns early when
  `matchMedia("(max-width: 1023px)")` matches, so a mobile tile click
  navigates to `/voice/:id` instead of opening the modal. `Player.astro`
  is full-bleed on mobile (framed card only at `lg+`) and passes
  `showMobileChrome` to `PlayerCard`, which then renders the video chrome
  (position label, close button, decorative play affordance, swipe hint) —
  all `lg:hidden`, gated by the prop so the desktop modal never gets a
  second close. **Swipe**: the pure `resolveSwipe` is in `~/lib/swipe`
  (unit-tested both directions); the DOM `attachSwipe` binder is in
  `~/lib/swipe-bind` (e2e-tested, coverage-excluded like the other
  gesture/DOM islands); the `PlayerControls` island (`client:idle` on the
  standalone page) binds swipe to `[data-player-card]` **only on mobile
  viewports** (touch-only in practice, drivable by a synthetic pointer in
  tests) and wires `[data-player-close]` → same-origin `history.back()`
  else the `from=`-derived fallback (read client-side — a static page has
  no query at build). **In-set traversal on the standalone page uses
  `location.replace`, not `assign` (DEV-107):** swipe, arrow keys, and the
  prev/next anchor taps all replace the history entry, mirroring the desktop
  modal's `replaceState` (DEV-98). Otherwise each swipe pushed an entry, so
  Close (`history.back()`) unwound one card at a time instead of returning
  to the squad in one step. No-JS keeps the plain prev/next links (which
  stack, the accepted fallback). RTL: `resolveSwipe` flips (swipe-right =
  next); reduced motion drops the rubberband + slide. Guard:
  `tests/e2e/player-mobile.spec.ts` (mobile project, derives order from
  `content/voices.json`) — incl. the close-after-swipe-returns-to-origin
  regression.
- **Prev/next traverse the active set (Epic 6, DEV-48).** The set is
  resolved from the URL the card was reached through (`?from=squad&theme=…`
  → the squad's filtered list; no params → all voices) — client-side, since
  a static page has no query at build. Pure logic in `~/lib/player-context`
  (`resolveActiveSet`, `buildDots` windowed to 8, `neighbourPath`),
  unit-tested. **Desktop modal**: `PlayerCardOverlay`
  resolves the set on each render and passes `onPrev`/`onNext` (swap in
  place via `replaceState` — so Back still closes in one step), a `dots`
  model, and `position`/`total` (the indicator is the plain
  `"{n} of {total}"` — DEV-111 dropped the theme word) to
  `PlayerCard`; arrow keys (← / → , reversed under RTL, ignored in form
  fields) swap too. **Standalone page**: `PlayerControls` enhances the SSR
  footer — rewrites the `[data-player-prev/next]` anchors' href (or
  disables), fills `[data-player-dots]`, updates `[data-player-indicator]`,
  and adds arrow-key nav; the SSR full-list prev/next is the no-JS baseline
  (already correct for a plain direct visit). `PlayerCard`'s `navMode`
  picks button (modal, swap) vs anchor (page, navigate). In link mode an
  **enabled** control is a real crawlable `<a href>` and a **disabled**
  boundary control is a `<button disabled>` — not an hrefless `<a>`, which
  Lighthouse's `crawlable-anchors` SEO audit flags (DEV-101, superseding the
  DEV-48 always-an-anchor tradeoff). `setNav` swaps the element type in
  place (preserving the arrow/label children + class string) when the
  client-resolved active set disagrees with the SSR full list. **No
  looping** at the boundaries. Guard: `tests/e2e/player-prevnext.spec.ts`
  (desktop). Value note: prev/next use
  `replaceState` in the modal (not the issue's `pushState`) so the × / Back
  close reliably in one step rather than stepping back through every viewed
  voice.
- **The desktop modal swap is animated (DEV-98).** The prev/next voice
  swap slides + paper-cross-fades the incoming card (the handoff's
  `variant === "transition"` overlay). `PlayerCard` restarts a one-shot CSS
  keyframe (`player-voice-in` + a `::before` paper veil in `global.css`)
  per swap by toggling `[data-voice-transition]` (remove → reflow → re-add)
  in a layout effect keyed on `position` — so the card's children (the
  Stream iframe, the Radix title) never remount. Direction comes from the
  position delta; the entering edge flips under RTL via the pure
  `slideOffset()` (`~/lib/player-transition`, unit-tested both directions),
  carried into CSS as the `--slide-from` custom property. The effect
  early-returns under `prefers-reduced-motion` (instant swap; the global
  guard collapses the keyframes too) and only runs in the modal
  (`navMode="button"`) — the SSR standalone page never animates. Value
  note: this is a single-phase slide-in of the incoming card (under the
  veil), not a literal two-panel out/in cross-fade — the handoff overlay is
  a conceptual mock, and a true overlap would double-mount the Stream
  iframe + dialog title. Guard: `tests/e2e/player-transition.spec.ts`
  (animation fires on swap; absent under reduced motion). Mobile keeps its
  existing `~/lib/swipe` rubberband/slide, unchanged.
- **The voice catalogue is lazy-loaded, never inlined (DEV-107).** The
  overlay mounts on every page, so inlining the full set as island props
  put the whole catalogue (~245KB projected at ~350 voices) on every page
  and blew the 100KB home-HTML budget. Instead: pages ship nothing
  voice-shaped (bar the home rotation's visible 11), and the client fetches
  two **static build artifacts** — `/voices-index.json` (the lightweight
  index: `id`/`firstName`/`age`/`countryCode`/`theme`/`language`/
  `publishedAt`/`portraitImageId` — enough to find/order/label/filter/render
  a tile; from `src/pages/voices-index.json.ts`) and `/voice-data/{id}.json`
  (one voice's heavy fields `pullQuote`/`city`/`videoId` + transcript;
  per-voice via `getStaticPaths`). The overlay fetches the index lazily
  (only on pages that have, or grow, `a[data-voice-id]` tiles — a
  `MutationObserver` catches the squad grid hydrating late) and the heavy
  data on open, prefetching prev/next neighbours so traversal stays
  instant. `PlayerControls` (standalone page) and `RotatingEleven`
  (home, `fetchPool`) read the same index; demos still pass a fixture pool
  by prop. Types/projection in `~/lib/voice-index.ts` (Zod-free, client-safe);
  memoised fetch wrappers in `~/lib/voice-index-client.ts`, which sets a
  `<html data-voice-index-ready>` marker on first resolve — the
  deterministic "interception is live" signal the player e2e suites wait on
  in place of racing an idle tick. `resolveActiveSet`/`applyFilters`/
  `sortByNewest`/`tile*` are generic over the index entry, so the squad
  (full `Voice`) and overlay (index) share them. The squad page still
  inlines its own grid data (`#squad-data`) — that's its content, not
  cross-page overlay bloat, and out of scope here.
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

- **Epic 10 (i18n, DEV-69 → DEV-72) — complete.** DEV-69 routing
  (per-language URL prefixes, shared page bodies in
  `src/components/pages/`, locale-aware links via `localiseUrl`,
  `html lang`). DEV-70 UI string translation (the dictionary +
  `t()`/`tList`/`makeT`, every component migrated off hard-coded copy,
  the island `strings`-prop pattern, the CI key-parity guard, the
  delivered es/fr/ar/pt translations). DEV-71 RTL for Arabic
  (`<html dir="rtl">`, physical→logical utilities, arrow flips,
  `dir="auto"`). DEV-72 the footer language switcher (navigates per
  locale preserving path/query/hash) + the i18n E2E. See the four i18n
  conventions above and `docs/ops/i18n.md`.

**Epic 6 — Player Card is complete (DEV-43 → DEV-49).** Part 1
(Cloudflare-free): routing + interception, the desktop modal shell, mobile
swipe, active-set prev/next. Part 2 (after CF was provisioned): **DEV-46**
the Cloudflare Stream iframe player, **DEV-47** the caption / transcript /
share chip row, **DEV-49** the integrated player-card E2E. Conventions
worth carrying forward:

- **The video pane and chip row are host-supplied (DEV-46/47).** `PlayerCard`
  renders the video player as `children` (`StreamPlayer`) and the chip row
  as a `chips` slot (`PlayerChips`). In the desktop modal both are React
  children of the modal island; on the SSR-static standalone page both are
  nested Astro `client:idle` islands (default slot for video, named `chips`
  slot — Astro maps it to the prop and hydrates it independently, so it
  never disturbs `PlayerControls`' DOM enhancement). The old
  `data-stub="video-player"` / `data-stub="caption-controls"` placeholders
  are gone.
- **`StreamPlayer` (DEV-46)** mounts no iframe until play (the lazy-load
  budget is real + e2e-asserted); poster / playing / error states; reads
  the subdomain only through `~/lib/stream` (`streamIframeUrl` builders +
  the env accessor); loads the external Stream embed SDK lazily for the
  `error`/`ended` events. See `docs/ops/stream.md`.
- **Captions cross the island boundary via a window event (DEV-47).** The
  captions chip dispatches `oyg:player-caption-change`
  (`~/lib/player-captions`); `StreamPlayer` listens and re-mounts the iframe
  with the new `defaultTextTrack`. MVP caption languages derive from
  `voice.language` (one → toggle; the dropdown path awaits richer metadata).
- **Transcripts are separate files (DEV-47):** `content/transcripts/{id}.md`,
  loaded by `getTranscript`/`getTranscripts` in `~/lib/content` — kept out
  of `voices.json` to avoid payload bloat. None exist yet, so the chip shows
  "not yet available"; the modal ships only voices that have one (zero today).
- **CI bakes `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` into the `build` job** (real
  secret, `demo-customer` fallback) so e2e/Lighthouse hit a working iframe
  URL. The `/voice/:id` lhci + player-chips targets are derived from the
  **first voice in `content/voices.json`** (the lighthouse job rewrites the
  URL; player-chips reads the file) — never a hard-coded id, because the
  pipeline-managed voices.json is overwritten every sync and a fixed id
  404s after a content change (bit DEV-96 and DEV-104). The iframe never
  plays in headless — specs assert the element mounts with the right `src`.
- **E2E coverage map:** `player-card.spec.ts` is the integrated suite (tile→
  modal, lazy player, chips, hybrid history, direct visit + filter set, RTL,
  axe); `dialog-focus-trap` owns the trap, `player-prevnext` the desktop
  prev/next, `player-mobile` the swipe, `stream-player` + `player-chips` the
  units. Real caption _display_ needs the Stream video to carry a track in
  the voice's `voice.language`.

**Epic 11 (perf + a11y) is complete** (see Current state). **Epic 12
(launch readiness)** is next; the per-voice OG image (`/og/voice/{id}.png`,
the share-as-image target) is still a DEV-81 placeholder.

## Living document

Update this file in the same PR if, during any later issue, future Claude
sessions would benefit from extra context here. Keep it pointers and
decisions only — never secrets, never anything sensitive (it lives in git
history forever).

When something changes that this file no longer reflects — a stack
decision shifts, a new convention emerges, a path moves — update it then,
not later.
