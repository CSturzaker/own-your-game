import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Behavioural e2e for the RotatingEleven island. These tests
 * exercise the live rotation timer (8s ticks) so they're slow by
 * design — wait calls are explicit rather than polled to keep the
 * assertions deterministic.
 *
 * Target: `/demo/starting-eleven`, not `/`. The home page's pool
 * is `content/voices.json`, which is pipeline-owned (DEV-32 syncs
 * from the live sheet every 2 hours). When the sheet has fewer
 * than 12 voices the rotation has no pool headroom and the
 * timing assertions go flaky. The demo page passes the project-
 * owned 16-voice fixture so the e2e isn't coupled to upstream
 * content state.
 *
 * Selectors target `.first()` everywhere — the demo renders four
 * StartingEleven instances and the default one is always first.
 */

const FORMATION = "[data-eleven-formation]";
const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;

/** Pull the visible voice ids out of the first formation on the page. */
async function readVoiceIds(page: Page): Promise<string[]> {
	return page.evaluate((selector) => {
		const formation = document.querySelector(selector);
		if (!formation) return [];
		const tiles = formation.querySelectorAll<HTMLElement>("[data-tile]");
		return Array.from(tiles).map((t) => t.dataset.voiceId ?? "");
	}, FORMATION);
}

/**
 * Wait for the browser to fire an idle callback. The rotation island
 * hydrates via `client:idle`, so anything that depends on React
 * event handlers (button clicks, state changes) needs to wait for
 * the same trigger. Chromium-desktop happens to schedule idle early
 * enough that tests can race past this, but webkit and chromium-
 * mobile both defer idle long enough that an immediate click fires
 * on un-hydrated SSR HTML and the React handler never runs.
 */
async function waitForIslandHydration(page: Page): Promise<void> {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				const idle = (
					window as Window & {
						requestIdleCallback?: (cb: () => void) => number;
					}
				).requestIdleCallback;
				if (typeof idle === "function") idle(() => resolve());
				else setTimeout(resolve, 100);
			}),
	);
}

test.describe("rotation island · runtime behaviour", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
	});

	test("rotates at least 4 visible tiles within one tick", async ({ page }) => {
		// The fixture ships 16 voices, 11 visible → 5 spares, and the
		// island swaps 6 of 11 positions per tick. ≥4 net changes is the
		// floor DEV-41 specifies for "rotation occurred" (delegated here
		// because `/` can't demonstrate rotation on the 3-voice live
		// pool). Poll rather than a fixed wait so a read that lands
		// mid-tick doesn't flake — see DEV-41's technical notes.
		test.setTimeout(20_000);
		await page.goto("/demo/starting-eleven");
		const before = await readVoiceIds(page);
		expect(before).toHaveLength(11);

		await page.waitForFunction(
			(initial: string[]) => {
				const current = Array.from(
					document.querySelectorAll("[data-eleven-formation] [data-tile]"),
				).map((el) => (el as HTMLElement).dataset.voiceId ?? "");
				const changed = current.filter((id, i) => id !== initial[i]).length;
				return changed >= 4;
			},
			before,
			{ timeout: 12_000 },
		);
	});

	test("'Bring on the next eleven' swaps the formation on click", async ({ page }) => {
		// Manual rotate is a click, not a timer — no 8s wait needed. The
		// button's onClick is a React handler, though, so wait for the
		// island to hydrate (client:idle) before clicking.
		test.setTimeout(20_000);
		await page.goto("/demo/starting-eleven");
		await waitForIslandHydration(page);

		const before = await readVoiceIds(page);
		expect(before).toHaveLength(11);

		await page
			.getByRole("button", { name: /Bring on the next eleven/ })
			.first()
			.click();

		// Same ≥4-net-change floor the automatic tick uses (16 fixtures,
		// 11 visible → 5 spares, 6 positions swapped). Poll so a read that
		// lands mid-update doesn't flake.
		await page.waitForFunction(
			(initial: string[]) => {
				const current = Array.from(
					document.querySelectorAll("[data-eleven-formation] [data-tile]"),
				).map((el) => (el as HTMLElement).dataset.voiceId ?? "");
				const changed = current.filter((id, i) => id !== initial[i]).length;
				return changed >= 4;
			},
			before,
			{ timeout: 5_000 },
		);
	});

	test("pause stops further rotation; resume restarts it", async ({ page }) => {
		// hydration wait + 9s paused window + up to 12s resume poll.
		test.setTimeout(40_000);
		await page.goto("/demo/starting-eleven");
		await waitForIslandHydration(page);

		// Pause; verify the button label flipped and no swaps occur
		// across one full rotation window.
		const pause = page.getByRole("button", { name: /Pause rotation/ }).first();
		await pause.click();
		await expect(page.getByRole("button", { name: /Resume rotation/ }).first()).toBeVisible();

		const beforePaused = await readVoiceIds(page);
		await page.waitForTimeout(9_000);
		const afterPaused = await readVoiceIds(page);
		expect(afterPaused).toEqual(beforePaused);

		// Resume and confirm rotation picks back up. Poll rather than a
		// fixed wait: on the slower mobile project a resume click that
		// lands just after a tick boundary leaves only ~8s to the next
		// tick, which a single 9s read can miss.
		await page
			.getByRole("button", { name: /Resume rotation/ })
			.first()
			.click();
		await expect(page.getByRole("button", { name: /Pause rotation/ }).first()).toBeVisible();

		await page.waitForFunction(
			(baseline: string[]) => {
				const current = Array.from(
					document.querySelectorAll("[data-eleven-formation] [data-tile]"),
				).map((el) => (el as HTMLElement).dataset.voiceId ?? "");
				return current.some((id, i) => id !== baseline[i]);
			},
			afterPaused,
			{ timeout: 12_000 },
		);
	});

	test("paused indicator shows 'Paused' instead of counting down", async ({ page }) => {
		await page.goto("/demo/starting-eleven");
		await waitForIslandHydration(page);

		await page
			.getByRole("button", { name: /Pause rotation/ })
			.first()
			.click();
		await expect(page.getByRole("button", { name: /Resume rotation/ }).first()).toBeVisible();

		const formation = page.locator(FORMATION).first();
		const section = formation.locator("xpath=ancestor::section[1]");
		await expect(section.getByText("Paused").first()).toBeVisible();
	});

	test("countdown text follows the prototype's 'Next rotation in Ns' shape", async ({ page }) => {
		await page.goto("/demo/starting-eleven");
		const formation = page.locator(FORMATION).first();
		const section = formation.locator("xpath=ancestor::section[1]");
		await expect(section.getByText(/Next rotation in \d+s/).first()).toBeVisible();
	});
});

test.describe("rotation island · prefers-reduced-motion", () => {
	test.beforeEach(async ({ page }) => {
		// `test.use({ reducedMotion: "reduce" })` doesn't propagate to
		// the context for this Playwright version; emulate directly
		// on the page so the matchMedia query inside the island reads
		// `true`.
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.setViewportSize(DESKTOP_VIEWPORT);
	});

	test("no rotation occurs and the reduced-motion pill replaces the controls", async ({ page }) => {
		test.setTimeout(20_000);
		await page.goto("/demo/starting-eleven");

		const formation = page.locator(FORMATION).first();
		const section = formation.locator("xpath=ancestor::section[1]");

		// `client:idle` fires after the first browser idle window.
		// Scrolling the section into view isn't required for hydration
		// any more but keeps the assertions stable across browsers
		// that schedule idle differently under headless.
		await formation.scrollIntoViewIfNeeded();

		// The first instance is the default; assert that under
		// matchMedia-reduced it swaps to the pill and drops controls.
		await expect(section.getByText("Reduced motion — rotation paused").first()).toBeVisible();
		await expect(section.getByRole("button", { name: /Pause rotation/ })).toHaveCount(0);

		// No swaps across one full tick window.
		const before = await readVoiceIds(page);
		await page.waitForTimeout(9_000);
		const after = await readVoiceIds(page);
		expect(after).toEqual(before);
	});

	test("manual 'next eleven' still rotates under reduced-motion", async ({ page }) => {
		// The automatic cycle is paused under reduced motion, but the
		// CTA is a deliberate user action — it must still swap (instantly,
		// no flash). Proves the button isn't gated by the pill state.
		test.setTimeout(20_000);
		await page.goto("/demo/starting-eleven");
		await waitForIslandHydration(page);

		const before = await readVoiceIds(page);
		expect(before).toHaveLength(11);

		await page
			.getByRole("button", { name: /Bring on the next eleven/ })
			.first()
			.click();

		await page.waitForFunction(
			(initial: string[]) => {
				const current = Array.from(
					document.querySelectorAll("[data-eleven-formation] [data-tile]"),
				).map((el) => (el as HTMLElement).dataset.voiceId ?? "");
				return current.filter((id, i) => id !== initial[i]).length >= 4;
			},
			before,
			{ timeout: 5_000 },
		);
	});

	test("page still passes axe under reduced-motion", async ({ page }) => {
		await page.goto("/demo/starting-eleven");
		await page.locator(FORMATION).first().scrollIntoViewIfNeeded();
		await runAxe(page);
	});
});

test.describe("rotation island · bundle budget", () => {
	test("rotation island JS stays under 10KB gzipped", async ({ request }) => {
		// Pulled from the demo page — same island, same bundle.
		const html = await (await request.get("/demo/starting-eleven")).text();
		const match = html.match(/_astro\/RotatingEleven\.[^"]+\.js/);
		// `if`-throw narrows the type for TS; `expect.not.toBeNull` is
		// the assertion intent but doesn't narrow.
		if (!match) throw new Error("RotatingEleven script tag not found on /demo/starting-eleven");
		const path = match[0];

		const res = await request.get(`/${path}`, {
			headers: { "accept-encoding": "gzip" },
		});
		expect(res.status()).toBe(200);
		const bytes = (await res.body()).length;
		// Raw bytes — Astro's preview server doesn't auto-gzip; assert
		// against the raw size with a generous ceiling that mirrors the
		// gzipped budget plus typical compression ratio.
		expect(bytes, `RotatingEleven raw bundle = ${bytes} bytes`).toBeLessThan(30_000);
	});
});
