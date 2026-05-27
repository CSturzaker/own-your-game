# src/components/

Astro components for shared page chrome and design-system primitives.
Each entry below lists the import path, the variant surface, and where
the demo / specs live. Add a new entry as each Epic 3 component lands.

| Component        | Import                            | Variants                                                              | Demo               | Spec(s)                                                                                                |
| ---------------- | --------------------------------- | --------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| Wordmark         | `~/components/Wordmark.astro`     | `header`, `footer`, `hero`                                            | `/demo/wordmark`   | `tests/unit/lib/wordmark.test.ts`, `tests/e2e/wordmark.spec.ts`                                        |
| Header           | `~/components/Header.astro`       | desktop / mobile responsive; `sticky` opt                             | `/demo/header`     | `tests/unit/lib/header.test.ts`, `tests/e2e/header.spec.ts`                                            |
| VoiceCounter     | `~/components/VoiceCounter.astro` | desktop / mobile responsive                                           | `/demo/header`     | exercised via Header (a11y, count, live-region attrs)                                                  |
| Footer           | `~/components/Footer.astro`       | 5-col desktop, stacked mobile                                         | `/demo/footer`     | `tests/unit/lib/footer.test.ts`, `tests/e2e/footer.spec.ts`                                            |
| LanguageSwitcher | `~/islands/LanguageSwitcher.tsx`  | popover trigger pill + language list                                  | `/demo/footer`     | `tests/unit/islands/LanguageSwitcher.test.tsx`, footer e2e keyboard test                               |
| Button           | `~/components/Button.astro`       | `primary`/`ghost`/`amber`/`deep` × sm/md/lg, optional `href` ⇒ `<a>`  | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Chip             | `~/components/Chip.astro`         | `default`/`active`, optional chevron or close marker                  | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Tag              | `~/components/Tag.astro`          | filled / outline × six theme colours                                  | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Kicker           | `~/components/Kicker.astro`       | top-bordered uppercase eyebrow                                        | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Tagline          | `~/components/Tagline.astro`      | display-italic balanced wrap, consumer-set font-size                  | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Portrait         | `~/components/Portrait.astro`     | deterministic silhouette + tone fallback; optional real image overlay | `/demo/portrait`   | `tests/unit/lib/portrait.test.ts`, `tests/unit/lib/portrait-url.test.ts`, `tests/e2e/portrait.spec.ts` |
| PortraitImage    | `~/islands/PortraitImage.tsx`     | image-with-fallback island used by Portrait when `src` is supplied    | `/demo/portrait`   | exercised via Portrait (broken-image fallback)                                                         |

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
