# Own Your Game

UNICEF youth-led campaign site for the 2026 FIFA World Cup. Around 350 young
people from ~42 countries record short videos on what sport means to them and
sign an open letter to FIFA.

- **Project board:** <https://linear.app/own-your-game/project/own-your-game-9288cd457ba3>
- **Project conventions:** see `CLAUDE.md` at the repo root for stack, rules,
  and contribution flow.

## Stack

Astro 6 · React 18 islands · TypeScript (strict, `noUncheckedIndexedAccess`)
· pnpm · Node 22 LTS. Tailwind, Radix, Vitest, Playwright, ESLint, Husky,
Lighthouse CI, and CI all land in later issues (DEV-14 → DEV-19).

## Quickstart

Requires Node 22 LTS (`.nvmrc` pins major 22) and pnpm (managed via
`corepack`, pinned in `packageManager`).

```bash
nvm use            # picks up .nvmrc → Node 22
corepack enable    # makes the pinned pnpm available
pnpm install       # install dependencies
pnpm dev           # dev server on http://localhost:4321
```

## Scripts

| Command          | What it does                                   |
| ---------------- | ---------------------------------------------- |
| `pnpm dev`       | Start the Astro dev server on `:4321`          |
| `pnpm build`     | Production build into `dist/`                  |
| `pnpm preview`   | Serve the built site locally                   |
| `pnpm typecheck` | `astro check` — TypeScript + Astro diagnostics |

Lint, unit-test, e2e-test, and CI scripts arrive with DEV-16 → DEV-19.
