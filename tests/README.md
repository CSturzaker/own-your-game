# tests/

Unit, component, and E2E test homes. The runner choice depends on the
target:

- **Unit + component:** Vitest + React Testing Library + jsdom
- **End-to-end (whole-page flows, real browser, accessibility):**
  Playwright (lands in DEV-17)

This README covers the Vitest side. Playwright conventions will be
added alongside its setup.

## Where specs live

| Location                        | Use for                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/**/*.test.{ts,tsx}` | Cross-cutting specs: schemas, content transforms, design-token drift, utility modules — anything not anchored to a single source file. |
| `src/**/*.test.{ts,tsx}`        | Component-co-located specs. Best when the test and the unit under test are read together (e.g. a React island and its behaviour).      |
| `tests/e2e/`                    | Playwright (DEV-17). Whole-page flows, axe-core a11y. Not a Vitest path.                                                               |

Both Vitest paths are configured in `vitest.config.ts`'s `include`.
Anything outside them is invisible to the runner — don't drop ad-hoc
test files under `scripts/`, `content/`, or page directories.

## Naming

- File extension: `.test.ts` for pure-TS specs, `.test.tsx` whenever
  JSX is needed (component tests, React Testing Library renders).
- `describe(...)` blocks read as a noun phrase describing the unit
  (`describe("voiceSchema")`, `describe("RotatingEleven")`). The
  outer block should match the symbol or feature under test 1:1.
- `it(...)` reads as a behaviour assertion sentence
  (`it("rejects voices missing a country code")`).

## Vitest or Testing Library?

- **Reach for Testing Library** whenever the unit under test renders
  DOM and the test cares about what a user would see or do — text
  content, role lookups, keyboard interactions, focus. `render`,
  `screen.getByRole`, `userEvent.click`, and the `toBeInTheDocument`
  matcher are the everyday vocabulary.
- **Reach for Vitest directly** for everything else — pure functions,
  schema validation, parsers, content transforms, anything without a
  DOM. No `render` calls. Plain `expect(value).toBe(...)` style.

If a spec mixes both (component test that also exercises a pure helper),
fine — Testing Library and Vitest share the same `expect`.

## Setup that's already in place

`tests/setup.ts` runs before every spec file. It:

- Loads `@testing-library/jest-dom/vitest`, registering the
  `toBeInTheDocument`, `toHaveTextContent`, `toBeVisible`, etc.
  matchers globally.
- Registers `afterEach(cleanup)` so React state and DOM nodes from
  one spec never leak into the next.

You shouldn't need to import jest-dom or call `cleanup()` from
individual specs.

## Coverage and the 80% floor

`vitest.config.ts` enforces an 80% threshold on statements, branches,
functions, and lines via the v8 provider. Two things to know:

1. **80% is a guide, not a religion.** If a single file is genuinely
   hard to test (a thin Astro wrapper, a one-off integration glue),
   exclude it explicitly in `vitest.config.ts`'s `coverage.exclude`
   rather than dropping the project-wide threshold.
2. **`.astro` files are already excluded.** Astro components can't be
   unit-tested via Vitest. For Astro-specific logic, extract pure TS
   into `src/lib/` and unit-test that, or rely on Playwright for the
   whole-page behaviour.

CI (DEV-19) runs `pnpm test:coverage` and fails the build on
threshold violations.

## Scripts

| Command              | What it does                          |
| -------------------- | ------------------------------------- |
| `pnpm test`          | Run all specs once and exit           |
| `pnpm test:watch`    | Re-run on file changes (interactive)  |
| `pnpm test:ui`       | Vitest browser UI for spelunking      |
| `pnpm test:coverage` | Run once + write a v8 coverage report |

## Adding a new spec — checklist

1. Pick the location: cross-cutting → `tests/unit/<area>/`; per-island
   → next to the source file as `<Island>.test.tsx`.
2. Name the file after the symbol or feature under test.
3. Use Testing Library if there's a DOM; plain Vitest otherwise.
4. Run `pnpm test:watch` while writing, `pnpm test:coverage` before
   pushing if you added new source files.
