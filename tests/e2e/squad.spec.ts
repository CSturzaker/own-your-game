import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";
import { openFilter } from "./helpers/squad";

/**
 * Canonical Squad E2E suite (DEV-62) — the regression guard for the
 * whole squad page: grid, pagination, filtering, URL state, the empty
 * state, tile links, a11y, and responsive layout.
 *
 * Two surfaces:
 *  - `/squad` is the real page, but the live pipeline currently
 *    publishes only a handful of voices, so its data-shape assertions
 *    derive counts from the `#squad-data` block rather than hard-coding.
 *  - `/demo/squad-load-more` wires the grid + filter bar to a fixed
 *    56-voice set so pagination and filter intersections are
 *    deterministic regardless of upstream content.
 *
 * Subsumes the former squad-grid / squad-load-more specs; the focused
 * filter-bar (squad-filters) and URL-edge (squad-url) suites remain.
 */

const TILE = "[data-tile]";
const VOICE = "[data-voice-id]";
const MORE = "[data-squad-more]";
const POPULATED = "/demo/squad-load-more";

async function waitForGrid(page: Page): Promise<void> {
	await expect(page.locator(TILE).first()).toBeVisible();
}

/** Voices baked into the page's #squad-data block (live count on /squad). */
async function dataVoiceCount(page: Page): Promise<number> {
	return page.evaluate(() => {
		const el = document.getElementById("squad-data");
		if (!el?.textContent) return 0;
		return ((JSON.parse(el.textContent) as { voices?: unknown[] }).voices ?? []).length;
	});
}

async function columnCount(page: Page): Promise<number> {
	return page
		.locator("[data-squad-grid]")
		.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
}

// --------------------------------------------------------------------
// The live page — structural and a11y guarantees against real content.
// --------------------------------------------------------------------
test.describe("squad page (live)", () => {
	test("loads with the header title and live voice count", async ({ page }) => {
		await page.goto("/squad");
		await expect(page).toHaveTitle(/The Squad/);
		const count = await dataVoiceCount(page);
		await expect(page.getByText(new RegExp(`${count}\\s+voices`)).first()).toBeVisible();
	});

	test("server HTML paints the cold-load skeleton", async ({ request }) => {
		const res = await request.get("/squad");
		expect(res.ok()).toBeTruthy();
		expect(await res.text()).toContain("data-skeleton");
	});

	test("hydrates the grid from #squad-data", async ({ page }) => {
		await page.goto("/squad");
		await waitForGrid(page);
		await expect(page.locator("[data-skeleton-grid]")).toHaveCount(0);
		const expected = Math.min(await dataVoiceCount(page), 24);
		await expect(page.locator(VOICE)).toHaveCount(expected);
	});

	test("tiles link to the player card tagged from=squad", async ({ page }) => {
		await page.goto("/squad");
		await waitForGrid(page);
		const href = await page.locator(TILE).first().getAttribute("href");
		expect(href).toMatch(/^\/voice\/[a-z0-9-]+\?from=squad/);
	});

	test("filters and tiles are keyboard focusable", async ({ page }) => {
		await page.goto("/squad");
		await waitForGrid(page);

		const countryChip = page.getByRole("button", { name: "Country: All", exact: true });
		await countryChip.focus();
		await expect(countryChip).toBeFocused();

		await page.locator(TILE).first().focus();
		await expect(page.locator(TILE).first()).toBeFocused();
	});

	test("renders 3 columns on a phone", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto("/squad");
		await waitForGrid(page);
		expect(await columnCount(page)).toBe(3);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/squad");
		await waitForGrid(page);
		await runAxe(page);
	});
});

// --------------------------------------------------------------------
// Populated browsing — deterministic 56-voice fixture surface.
// --------------------------------------------------------------------
test.describe("squad browsing (populated)", () => {
	test("renders one page of 24 tiles", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);
		await expect(page.locator(VOICE)).toHaveCount(24);
	});

	test("load-more reveals 24 more, then retires at the end", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		await page.getByRole("button", { name: /Load 24 more/ }).click();
		await expect(page.locator(VOICE)).toHaveCount(48);
		await expect(page.getByRole("button", { name: /Load/ })).toBeVisible();

		await page.getByRole("button", { name: /Load 8 more/ }).click();
		await expect(page.locator(VOICE)).toHaveCount(56);
		await expect(page.getByRole("button", { name: /Load/ })).toHaveCount(0);
		await expect(page.locator(MORE).getByText("All 56 voices shown")).toBeVisible();
	});

	test("moves focus to the first newly revealed tile", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);
		await page.getByRole("button", { name: /Load 24 more/ }).click();
		await expect(page.locator(TILE).nth(24)).toBeFocused();
	});

	test("a language filter narrows the grid to that language", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		const popover = await openFilter(page, "Language: All");
		await popover.getByRole("button", { name: "Arabic" }).click();

		// The fixture's Arabic voices are all Egypt (Yusuf) or Morocco (Idris).
		await expect(page.locator(VOICE)).toHaveCount(7);
		const ids = await page
			.locator(VOICE)
			.evaluateAll((els) => els.map((el) => el.getAttribute("data-voice-id") ?? ""));
		expect(ids.every((id) => /^(yusuf-eg-002|idris-ma-011)-/.test(id))).toBe(true);
	});

	test("a country filter narrows the intersection further", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		await (await openFilter(page, "Language: All")).getByRole("button", { name: "Arabic" }).click();
		await (await openFilter(page, "Country: All")).getByRole("button", { name: "Egypt" }).click();

		await expect(page.locator(VOICE)).toHaveCount(4);
		const ids = await page
			.locator(VOICE)
			.evaluateAll((els) => els.map((el) => el.getAttribute("data-voice-id") ?? ""));
		expect(ids.every((id) => id.startsWith("yusuf-eg-002-"))).toBe(true);
	});

	test("applying a filter writes it to the URL and survives reload", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		await (await openFilter(page, "Language: All")).getByRole("button", { name: "Arabic" }).click();
		await expect(page).toHaveURL(/language=ar/);

		await page.reload();
		await waitForGrid(page);
		await expect(page.getByRole("button", { name: "Language: Arabic", exact: true })).toBeVisible();
		await expect(page.locator(VOICE)).toHaveCount(7);
	});

	test("reset clears every filter and the query string", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		await (await openFilter(page, "Language: All")).getByRole("button", { name: "Arabic" }).click();
		await page.getByRole("button", { name: "Reset filters", exact: true }).click();

		await expect(page).toHaveURL(/\/demo\/squad-load-more$/);
		await expect(page.getByRole("button", { name: "Language: All", exact: true })).toBeVisible();
		await expect(page.locator(VOICE)).toHaveCount(24);
	});

	test("filtered tiles link with from=squad and the filter params", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		await (await openFilter(page, "Language: All")).getByRole("button", { name: "Arabic" }).click();
		await expect(page.locator(VOICE)).toHaveCount(7);

		const href = await page.locator(TILE).first().getAttribute("href");
		expect(href).toMatch(/^\/voice\/[a-z0-9-]+\?from=squad&language=ar$/);
	});

	test("an empty filter combination shows the empty state", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		// Arabic voices are Egypt/Morocco only — pairing with Kenya is empty.
		await (await openFilter(page, "Language: All")).getByRole("button", { name: "Arabic" }).click();
		await (await openFilter(page, "Country: All")).getByRole("button", { name: "Kenya" }).click();

		await expect(page.locator("[data-squad-empty]")).toBeVisible();
		await expect(page.locator(TILE)).toHaveCount(0);
		await expect(page.getByText("No voices match this filter combination yet.")).toBeVisible();
	});

	test("the empty-state reset CTA clears the filters", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		await (await openFilter(page, "Language: All")).getByRole("button", { name: "Arabic" }).click();
		await (await openFilter(page, "Country: All")).getByRole("button", { name: "Kenya" }).click();
		await expect(page.locator("[data-squad-empty]")).toBeVisible();

		await page.locator("[data-squad-empty]").getByRole("button", { name: "Reset filters" }).click();

		await expect(page.locator("[data-squad-empty]")).toHaveCount(0);
		await expect(page.getByRole("button", { name: "Language: All", exact: true })).toBeVisible();
		await expect(page.locator(VOICE)).toHaveCount(24);
	});

	test("renders 3 / 6 / 8 columns across breakpoints", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		await page.setViewportSize({ width: 390, height: 844 });
		expect(await columnCount(page)).toBe(3);
		await page.setViewportSize({ width: 800, height: 1000 });
		expect(await columnCount(page)).toBe(6);
		await page.setViewportSize({ width: 1440, height: 900 });
		expect(await columnCount(page)).toBe(8);
	});

	test("has zero WCAG 2.1 A/AA violations (including the empty state)", async ({ page }) => {
		await page.goto(POPULATED);
		await waitForGrid(page);

		// Empty state in view so axe scans it too.
		await (await openFilter(page, "Language: All")).getByRole("button", { name: "Arabic" }).click();
		await (await openFilter(page, "Country: All")).getByRole("button", { name: "Kenya" }).click();
		await expect(page.locator("[data-squad-empty]")).toBeVisible();
		await runAxe(page);
	});
});
