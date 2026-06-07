# Performance budgets (Lighthouse CI)

The `lighthouse` CI job gates every PR against per-page Lighthouse budgets
in [`.lighthouserc.json`](../../.lighthouserc.json). DEV-78 tightened the
initial DEV-19 budgets after the Epic 11 optimisations (images DEV-74,
fonts + critical CSS DEV-75, bundle DEV-76).

## How to run locally

```bash
pnpm build
pnpm dlx @lhci/cli@latest autorun   # collect (3 runs/page) + assert
```

Results also surface as a PR comment (DEV-89), median of 3 with per-run
spread. Caveats: the run is **desktop preset** against the **localhost
`astro preview`** build, not the Cloudflare Pages preview (blocked on
DEV-8); scores are indicative. Lighthouse variance is real, so budgets
carry headroom and assert on the **median run** (`aggregationMethod:
median-run`).

## Budgets

| Page         | Perf  | A11y | Best-pr. | SEO   | FCP     | LCP     | TBT    | CLS   |
| ------------ | ----- | ---- | -------- | ----- | ------- | ------- | ------ | ----- |
| `/`          | ≥0.95 | 1.00 | ≥0.95    | ≥0.95 | ≤1000ms | ≤2000ms | ≤150ms | ≤0.05 |
| `/letter`    | ≥0.95 | 1.00 | ≥0.95    | ≥0.95 | ≤1000ms | ≤1800ms | ≤150ms | ≤0.05 |
| `/squad`     | ≥0.95 | 1.00 | ≥0.95    | ≥0.95 | ≤1000ms | ≤2000ms | ≤150ms | ≤0.05 |
| `/about`     | ≥0.95 | 1.00 | ≥0.95    | ≥0.95 | ≤1000ms | ≤2000ms | ≤150ms | ≤0.05 |
| `/voice/:id` | ≥0.90 | 1.00 | ≥0.95    | ≥0.90 | ≤1000ms | ≤2000ms | ≤150ms | ≤0.05 |

## Rationale

Budgets are set at **what the optimised site actually achieves on CI, plus
headroom for runner variance** — not aspirational round numbers. The
measured CI medians (desktop, median of 3, from the final Epic 11 build)
were:

| Page         | Perf | FCP    | LCP    | TBT  | CLS                |
| ------------ | ---- | ------ | ------ | ---- | ------------------ |
| `/`          | 1.00 | 312 ms | 429 ms | 0 ms | 0.004              |
| `/letter`    | 1.00 | 300 ms | 380 ms | 0 ms | 0.004              |
| `/squad`     | 1.00 | 303 ms | 383 ms | 0 ms | ~0.001 (was 0.062) |
| `/about`     | 1.00 | 382 ms | 510 ms | 0 ms | 0.005              |
| `/voice/:id` | 1.00 | 357 ms | 417 ms | 0 ms | 0.011              |

So FCP/LCP/TBT budgets sit ~2–4× above the medians (a real regression
trips them; runner noise doesn't), and Perf/A11y are gated near-perfect.

Deliberate per-page relaxations, all evidence-based:

- **`/squad` is back on the site default (Perf ≥0.95, CLS ≤0.05) as of
  DEV-105.** It used to carry Perf ≥0.90 + CLS ≤0.10 because its perf
  dipped to 0.88 and CLS to 0.230 on individual runs (the perf score was
  entirely CLS-driven). DEV-105 attributed that variance: it was 100%
  webfont-swap reflow — the `font-display: swap` fallback→webfont swap
  reflowed the heading + filter bar and dragged the grid down ~24px
  (blocking the webfonts dropped the page to CLS 0; the portrait images,
  absolutely positioned in a reserved `aspect-4/5` box, never shifted).
  Metric-matched fallback faces (`size-adjust` + ascent/descent overrides
  in `global.css`, computed from each webfont's metrics) make the swap
  layout-neutral — measured CLS fell from ~0.011 to ~0.0005 consistently —
  so the relaxation is no longer needed.
- **`/voice/:id` Perf ≥0.90, SEO ≥0.95.** The card is secondary to the
  landing pages, so Perf matches squad. SEO was held at ≥0.90 while a
  disabled prev/next control at a list boundary rendered an hrefless `<a>`
  (`crawlable-anchors` flagged it, dropping SEO to 0.91). **DEV-101** made
  the disabled boundary control a `<button>` (enabled controls stay real
  crawlable anchors), so SEO is back to ≥0.95.
- **A11y is a hard 1.00** everywhere — anything less is a real regression
  (the site is axe-clean, DEV-77).

## The gate is real

Verified by injecting a ~2.5s render-blocking script into `BaseLayout`
(throwaway): the Perf/FCP/LCP budgets failed and `lhci autorun` exited
non-zero across pages, then reverted. A genuine regression fails CI.
