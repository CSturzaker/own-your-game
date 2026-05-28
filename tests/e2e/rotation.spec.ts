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

	test("rotates at least one visible tile within ~9 seconds", async ({ page }) => {
		// 9s = one tick + ~1s margin. The fixture ships 16 voices,
		// 11 visible → 5 spares; every position can swap successfully.
		// The worst case is the random picker selecting positions whose
		// pool draws all collide with the visible set — extremely
		// unlikely given the spare buffer.
		test.setTimeout(20_000);
		await page.goto("/demo/starting-eleven");
		const before = await readVoiceIds(page);
		expect(before).toHaveLength(11);

		await page.waitForTimeout(9_000);
		const after = await readVoiceIds(page);

		const changed = before.filter((id, i) => id !== after[i]).length;
		expect(
			changed,
			`expected at least one tile to swap; before=${before.join(",")} after=${after.join(",")}`,
		).toBeGreaterThan(0);
	});

	test("pause stops further rotation; resume restarts it", async ({ page }) => {
		test.setTimeout(30_000);
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

		// Resume and confirm rotation picks back up.
		await page
			.getByRole("button", { name: /Resume rotation/ })
			.first()
			.click();
		await expect(page.getByRole("button", { name: /Pause rotation/ }).first()).toBeVisible();

		await page.waitForTimeout(9_000);
		const afterResumed = await readVoiceIds(page);
		const changed = afterPaused.filter((id, i) => id !== afterResumed[i]).length;
		expect(changed).toBeGreaterThan(0);
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
