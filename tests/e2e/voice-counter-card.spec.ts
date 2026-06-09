import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * The country counter band (`/demo/voice-counter`). Restyled from the
 * hero counter card to the full-width band in DEV-124 — static
 * treatment (no live-pulse row), `auto 1fr` layout, the description
 * visible at every viewport. The home-page integration (placement
 * below the hero, the live count, the AA fill) is asserted in
 * `home.spec.ts`; this guards the component's own variants.
 */
test.describe("country counter band demo", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/demo/voice-counter");
	});

	test("default variant renders the label, the count, and the description", async ({ page }) => {
		const band = page.locator("[data-voice-counter-card]").first();
		await expect(band).toContainText("The country counter");
		await expect(band).toContainText("247");
		await expect(band.getByText(/Each one is a country/)).toBeVisible();
		// Static treatment — the live-pulse row is gone with the band
		// restyle (the country count grows in steps, not ticks).
		await expect(band.locator("[data-pulse]")).toHaveCount(0);
	});

	test("desktop band lays out as two columns, number left", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		const band = page.locator("[data-voice-counter-card]").first();
		const cols = await band.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		expect(cols.split(" ").filter(Boolean)).toHaveLength(2);
	});

	test("loading variant renders a skeleton block with sr-only progress text", async ({ page }) => {
		const band = page.locator("[data-voice-counter-card]").nth(1);
		// Number element is replaced by a [data-skeleton] block — a faded
		// last-known value can't satisfy AA contrast on the AA-cleared
		// cyan; see the component comment.
		await expect(band.locator("[data-skeleton]")).toHaveCount(1);
		await expect(band.locator("p.font-display.font-bold")).toHaveCount(0);
		await expect(band.getByText("Loading country count")).toHaveCount(1);
	});

	test("error variant renders the offline message on the paper fallback", async ({ page }) => {
		const band = page.locator("[data-voice-counter-card][data-error]");
		await expect(band).toContainText("Live counter temporarily offline");
		// Paper/ink treatment, not the brand cyan.
		const bg = await band.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(bg).not.toBe("rgb(0, 122, 177)");
	});

	test("has zero WCAG 2.1 A/AA violations across all variants", async ({ page }) => {
		await runAxe(page);
	});
});
