# tests/e2e/

Playwright + axe-core. Whole-page user journeys, keyboard nav, mobile
swipe, reduced-motion behaviour, and the project's authoritative a11y
gate (zero WCAG 2.1 A/AA violations per page).

Unit and component specs live separately — see `tests/README.md`.

## Running locally

```bash
pnpm e2e             # all projects (chromium-desktop, webkit-desktop, chromium-mobile)
pnpm e2e:ui          # Playwright UI mode (best for writing/debugging)
pnpm e2e:headed      # show the browser windows
pnpm e2e:report      # open the last HTML report
```

The default config starts its own server by running
`pnpm build && pnpm preview` — first run takes a few seconds longer
while the build completes. If a dev or preview server is already on
port 4321, Playwright will reuse it (`reuseExistingServer: true`
locally, `false` on CI).

To target a deployed URL instead of the local server:

```bash
BASE_URL=https://owngame-pages.dev pnpm e2e
```

Setting `BASE_URL` skips the webServer entirely. CI runs against the
Cloudflare Pages preview URL this way.

## Browser projects

| Project          | Viewport   | Device                       | What it covers              |
| ---------------- | ---------- | ---------------------------- | --------------------------- |
| chromium-desktop | 1440 × 900 | Desktop Chrome               | Default desktop reference   |
| webkit-desktop   | 1440 × 900 | Desktop Safari (WebKit)      | Safari/iOS rendering quirks |
| chromium-mobile  | 390 × 844  | iPhone 13 (mobile UA, touch) | Mobile layout + touch flows |

Firefox is installed but not configured as a project. Add one if a
Firefox-specific regression appears.

## Writing a new spec

Place specs in `tests/e2e/<area>.spec.ts`. They run in every project
unless filtered via `test.skip(condition, ...)` or by tagging the
test name and using `pnpm e2e --grep <pattern>`.

```ts
import { expect, test } from "@playwright/test";
import { runAxe } from "./helpers/axe";

test("home renders and is accessible", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await runAxe(page);
});
```

Touch-specific journeys (player card swipe, sticky filter bar) use
the mobile project's `page.touchscreen` and `locator.dragTo()`.

## The `runAxe` helper

`tests/e2e/helpers/axe.ts` exports `runAxe(page, options?)`. It runs
the full axe-core engine against the live DOM and asserts zero
violations across WCAG 2.1 A and AA rules. **This is the project's
a11y gate** — call it on every page-level spec.

Options:

- `include: string[]` — narrow the scan to one region (e.g. an open
  modal over an inert background).
- `exclude: string[]` — drop a region from the scan.
- `disableRules: string[]` — last-resort escape hatch. Use sparingly,
  comment the call site with the reason, and prefer fixing the
  violation instead.

Best-practice and ARIA-experimental rules are deliberately not
enforced — the spec is the actionable gate, and broader rules add
noise.

## What CI does

DEV-19 wires GitHub Actions to:

1. Run `pnpm e2e` against the Cloudflare Pages preview URL (via
   `BASE_URL`) on every PR.
2. Upload the HTML report as a workflow artefact.
3. Fail the build on any axe violation or failed assertion.

The HTML report ends up at `playwright-report/` either way — `pnpm
e2e:report` opens it locally.
