# src/components/

Astro components for shared page chrome and design-system primitives.
Each entry below lists the import path, the variant surface, and where
the demo / specs live. Add a new entry as each Epic 3 component lands.

| Component    | Import                            | Variants                                  | Demo             | Spec(s)                                                         |
| ------------ | --------------------------------- | ----------------------------------------- | ---------------- | --------------------------------------------------------------- |
| Wordmark     | `~/components/Wordmark.astro`     | `header`, `footer`, `hero`                | `/demo/wordmark` | `tests/unit/lib/wordmark.test.ts`, `tests/e2e/wordmark.spec.ts` |
| Header       | `~/components/Header.astro`       | desktop / mobile responsive; `sticky` opt | `/demo/header`   | `tests/unit/lib/header.test.ts`, `tests/e2e/header.spec.ts`     |
| VoiceCounter | `~/components/VoiceCounter.astro` | desktop / mobile responsive               | `/demo/header`   | exercised via Header (a11y, count, live-region attrs)           |

## Conventions

- **Astro for chrome, React islands for interaction.** Anything that
  needs client JS lives in `src/islands/` (with a Radix primitive in
  `src/islands/ui/` if it's an interactive primitive). Pure markup with
  no client behaviour stays in `src/components/`.
- **Variant logic in `src/lib/`.** The component's prop-to-shape mapping
  is a pure function in `src/lib/<name>.ts` so Vitest can pin the
  contract. The `.astro` file then becomes a thin render shell — Astro
  components are excluded from Vitest coverage, so the logic must live
  somewhere reachable.
- **Demo pages live in `src/pages/demo/<name>.astro`.** They render
  every variant side by side and pass `noIndex` to `BaseLayout`. They
  ship to prod (gated by the `Disallow: /demo/` line that lands in
  DEV-81) so visual regressions can be caught against the deployed
  preview.
- **Specs split by domain.** Pure logic → Vitest under
  `tests/unit/lib/`. DOM + a11y + cross-browser → Playwright under
  `tests/e2e/`. Each component should land both kinds of coverage.

## Adding a new component

1. Decide if any logic can be extracted to `src/lib/`. If yes, write
   the helper + Vitest spec first.
2. Add the `.astro` file under `src/components/`.
3. Add a demo page under `src/pages/demo/` rendering every variant.
4. Add a Playwright spec under `tests/e2e/` covering the rendered DOM,
   ARIA, and an `runAxe(page)` assertion.
5. Append a row to the table above with the new component's
   import path, variants, demo route, and spec paths.
