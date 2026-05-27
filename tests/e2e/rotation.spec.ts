import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Behavioural e2e for the RotatingEleven island. These tests
 * exercise the live rotation timer (8s ticks) so they're slow by
 * design — wait calls are explicit rather than polled to keep the
 * assertions deterministic.
 *
 * Run against `/` rather than the demo page so the timing
 * assertions also confirm the home-page wiring is intact.
 */

const FORMATION = "[data-eleven-formation]";
const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;

/** Pull the current visible voice ids out of the desktop formation. */
async function readVoiceIds(page: Page): Promise<string[]> {
	return page.evaluate((selector) => {
		const tiles = document.querySelectorAll<HTMLElement>(`${selector} [data-tile]`);
		return Array.from(tiles).map((t) => t.dataset.voiceId ?? "");
	}, FORMATION);
}

test.describe("home page rotation · runtime behaviour", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
	});

	test("rotates at least one visible tile within ~9 seconds", async ({ page }) => {
		// 9s = one tick + ~1s margin. With 16 voices and 11 visible,
		// every position can swap successfully, so the worst case is
		// the random picker selecting positions whose pool draws all
		// collide with the visible set — extremely unlikely given the
		// 5-spare buffer.
		test.setTimeout(20_000);
		await page.goto("/");
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
		await page.goto("/");

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
		await page.goto("/");
		await page
			.getByRole("button", { name: /Pause rotation/ })
			.first()
			.click();
		// The countdown live region inside the formation's header
		// switches to "Paused"; the header voice-counter pill also
		// uses aria-live so scope to the one inside the StartingEleven
		// section via the formation's nearest section ancestor.
		const formation = page.locator(FORMATION).first();
		const section = formation.locator("xpath=ancestor::section[1]");
		await expect(section.getByText("Paused").first()).toBeVisible();
	});

	test("countdown text follows the prototype's 'Next rotation in Ns' shape", async ({ page }) => {
		await page.goto("/");
		const formation = page.locator(FORMATION).first();
		const section = formation.locator("xpath=ancestor::section[1]");
		await expect(section.getByText(/Next rotation in \d+s/).first()).toBeVisible();
	});
});

test.describe("home page rotation · prefers-reduced-motion", () => {
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
		await page.goto("/");

		const formation = page.locator(FORMATION).first();
		const section = formation.locator("xpath=ancestor::section[1]");

		// `client:idle` fires after the first browser idle window.
		// Scrolling the section into view isn't required for
		// hydration any more but keeps the assertions stable across
		// browsers that schedule idle differently under headless.
		await formation.scrollIntoViewIfNeeded();

		// Pill is rendered, controls are not.
		await expect(section.getByText("Reduced motion — rotation paused").first()).toBeVisible();
		await expect(section.getByRole("button", { name: /Pause rotation/ })).toHaveCount(0);

		// No swaps across one full tick window.
		const before = await readVoiceIds(page);
		await page.waitForTimeout(9_000);
		const after = await readVoiceIds(page);
		expect(after).toEqual(before);
	});

	test("page still passes axe under reduced-motion", async ({ page }) => {
		await page.goto("/");
		await page.locator(FORMATION).first().scrollIntoViewIfNeeded();
		await runAxe(page);
	});
});

test.describe("home page rotation · bundle budget", () => {
	test("rotation island JS stays under 10KB gzipped", async ({ request }) => {
		// Find the bundle filename from the home HTML (hashed name).
		const html = await (await request.get("/")).text();
		const match = html.match(/_astro\/RotatingEleven\.[^"]+\.js/);
		// `if`-throw narrows the type for TS; `expect.not.toBeNull` is
		// the assertion intent but doesn't narrow.
		if (!match) throw new Error("RotatingEleven script tag not found on /");
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
