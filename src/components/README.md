# src/components/

Astro components for shared page chrome and design-system primitives.
Each entry below lists the import path, the variant surface, and where
the demo / specs live. Add a new entry as each Epic 3 component lands.

| Component        | Import                            | Variants                                                                                                           | Demo               | Spec(s)                                                                                                |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------ |
| Wordmark         | `~/components/Wordmark.astro`     | `header`, `footer`, `hero`                                                                                         | `/demo/wordmark`   | `tests/unit/lib/wordmark.test.ts`, `tests/e2e/wordmark.spec.ts`                                        |
| Header           | `~/components/Header.astro`       | desktop / mobile responsive; `sticky` opt                                                                          | `/demo/header`     | `tests/unit/lib/header.test.ts`, `tests/e2e/header.spec.ts`                                            |
| VoiceCounter     | `~/components/VoiceCounter.astro` | desktop / mobile responsive                                                                                        | `/demo/header`     | exercised via Header (a11y, count, live-region attrs)                                                  |
| Footer           | `~/components/Footer.astro`       | 4-col desktop (brand + 3 links), stacked mobile                                                                    | `/demo/footer`     | `tests/unit/lib/footer.test.ts`, `tests/e2e/footer.spec.ts`                                            |
| LanguageSwitcher | `~/islands/LanguageSwitcher.tsx`  | popover trigger pill + language list                                                                               | `/demo/footer`     | `tests/unit/islands/LanguageSwitcher.test.tsx`, footer e2e keyboard test                               |
| Button           | `~/components/Button.astro`       | `primary`/`ghost`/`amber`/`deep` × sm/md/lg, optional `href` ⇒ `<a>`                                               | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Chip             | `~/components/Chip.astro`         | `default`/`active`, optional chevron or close marker                                                               | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Tag              | `~/components/Tag.astro`          | filled / outline × six theme colours                                                                               | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Kicker           | `~/components/Kicker.astro`       | top-bordered uppercase eyebrow                                                                                     | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Tagline          | `~/components/Tagline.astro`      | display-italic balanced wrap; `color` (ink·deep-cyan), polymorphic `as` (p·blockquote·div), consumer-set font-size | `/demo/primitives` | `tests/unit/lib/primitives.test.ts`, `tests/e2e/primitives.spec.ts`                                    |
| Portrait         | `~/components/Portrait.astro`     | deterministic silhouette + tone fallback; optional real image overlay                                              | `/demo/portrait`   | `tests/unit/lib/portrait.test.ts`, `tests/unit/lib/portrait-url.test.ts`, `tests/e2e/portrait.spec.ts` |
| PortraitImage    | `~/islands/PortraitImage.tsx`     | image-with-fallback island used by Portrait when `src` is supplied                                                 | `/demo/portrait`   | exercised via Portrait (broken-image fallback)                                                         |
| Tile             | `~/components/Tile.astro`         | `md`/`sm` sizes; default, `flash`, `skeleton`; hover + focus rings                                                 | `/demo/tile`       | `tests/unit/lib/tile.test.ts`, `tests/unit/lib/flags.test.ts`, `tests/e2e/tile.spec.ts`                |

### Page-scoped compositions

These compositions don't belong in the shared design system — they
only ship to one page — but they're large enough to deserve their
own file. They live in a per-page subfolder so the flat list above
stays the design-system inventory.

| Component        | Import                                     | Variants                                                                    | Demo                            | Spec(s)                                                                             |
| ---------------- | ------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| VoiceCounterCard | `~/components/home/VoiceCounterCard.astro` | default · loading (skeleton) · error (paper) · forceReducedMotion (demo)    | `/demo/voice-counter`           | `tests/unit/lib/voice-counter-card.test.ts`, `tests/e2e/voice-counter-card.spec.ts` |
| StartingEleven   | `~/components/home/StartingEleven.astro`   | desktop 1-4-3-3 / mobile 2×4 · default · loading · reducedMotion · sparse   | `/demo/starting-eleven`         | `tests/unit/lib/starting-eleven.test.ts`, `tests/e2e/starting-eleven.spec.ts`       |
| RotatingEleven   | `~/islands/RotatingEleven.tsx`             | React island driving the 8s rotation under StartingEleven (non-loading)     | `/` and `/demo/starting-eleven` | `tests/unit/lib/rotation.test.ts`, `tests/e2e/rotation.spec.ts`                     |
| WhyThisBand      | `~/components/home/WhyThisBand.astro`      | static paper-2 band · 2-col desktop / stacked mobile · count-templated copy | `/demo/why-this`                | `tests/unit/lib/why-this.test.ts`, `tests/e2e/why-this.spec.ts`                     |

### Tagline API

The recurring campaign motif (display face, medium, italic, balanced
wrap, `-0.01em` tracking). Three placement axes, all optional:

- **`color`** — `"ink"` (default) or `"deep-cyan"`. The motif colour.
- **`as`** — `"p"` (default), `"blockquote"`, or `"div"`. Use
  `blockquote` for designed quotations (the About Q&A).
- **`size`** — number (px) or CSS length, applied as an inline
  `font-size`. Prefer responsive `text-*` classes via `class` when a
  placement needs a breakpoint-dependent size (inline size would beat
  the `lg:` class).

A consumer `style` string is merged with the computed size — used for
per-placement tracking overrides (the About Q&A tightens to `-0.015em`
inline, matching the handoff, so it beats the motif's tracking class
without a `no-conflicting-classes` lint violation).

```astro
<Tagline size={40}>Whose game is it anyway?</Tagline>
<Tagline as="blockquote" color="deep-cyan" style="letter-spacing: -0.015em"> It's ours. </Tagline>
```

The class string comes from `taglineClasses(color)` in
`~/lib/primitives` (the `TAGLINE_CLASSES` constant is the default ink
motif, kept for back-compat). The Letter's `tagline-question`
directive (`~/lib/letter-render`) deliberately does **not** use this
component — it renders HTML strings, not Astro components, and bakes
its `-0.015em` tracking as a class; see that file.

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

## Loading content

Voices and letter content are loaded through typed helpers in
`src/lib/content.ts`. Import these from any Astro page or `.ts` file
that runs at build time — they're synchronous, fail loudly on bad
data, and memoise the parsed result so repeated calls are free.

```astro
---
import {
	getAllVoices,
	getVoiceCount,
	getCountryCount,
	getShuffledVoices,
	getLetter,
} from "~/lib/content";

const voices = getAllVoices();
const eleven = getShuffledVoices().slice(0, 11);
const totalSignatures = getVoiceCount();
const countries = getCountryCount();
const letter = getLetter("en"); // { frontmatter, body }
---
```

**Build-time only.** These helpers use `node:fs` synchronously and
will not run in a browser context. Don't import from
`src/lib/content` inside `src/islands/`. If an island needs voices
data, the host Astro page should load it via these helpers and pass
it down as a prop.

Failure modes are intentional: a missing or malformed
`content/voices.json` throws and aborts the build. We'd rather see a
red CI run than ship a page that quietly renders zero voices.

See `src/lib/content.ts` for the full accessor list (filters by
theme, by country, lookup by id, available letter languages, …).

## Adding a new component

1. Decide if any logic can be extracted to `src/lib/`. If yes, write
   the helper + Vitest spec first.
2. Add the `.astro` file under `src/components/`.
3. Add a demo page under `src/pages/demo/` rendering every variant.
4. Add a Playwright spec under `tests/e2e/` covering the rendered DOM,
   ARIA, and an `runAxe(page)` assertion.
5. Append a row to the table above with the new component's
   import path, variants, demo route, and spec paths.
