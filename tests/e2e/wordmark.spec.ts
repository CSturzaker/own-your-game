import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Whole-page assertions for `src/components/Wordmark.astro`. The
 * variant resolution logic is unit-tested via Vitest; this spec
 * pins the DOM shape and a11y posture on a real render.
 */
test.describe("wordmark demo", () => {
	test("header and footer variants render as links to / with an accessible name", async ({
		page,
	}) => {
		await page.goto("/demo/wordmark");
		const homeLinks = page.getByRole("link", { name: "Own Your Game — home" });
		await expect(homeLinks).toHaveCount(2);
		for (const link of await homeLinks.all()) {
			await expect(link).toHaveAttribute("href", "/");
		}
	});

	test("hero variant is a plain image — no enclosing anchor", async ({ page }) => {
		await page.goto("/demo/wordmark");
		const heroDefault = page.locator("#wm-hero-default + div img");
		const heroMobile = page.locator("#wm-hero-mobile + div img");
		await expect(heroDefault).toHaveCount(1);
		await expect(heroMobile).toHaveCount(1);

		// Confirm the hero <img> isn't wrapped in any anchor (the
		// "no link" rule from the design contract).
		for (const img of [heroDefault, heroMobile]) {
			const wrappedInLink = await img.evaluate((el) => el.closest("a") !== null);
			expect(wrappedInLink).toBe(false);
		}

		// Default hero is 200px tall; mobile-overridden one is 120.
		await expect(heroDefault).toHaveAttribute("style", /height:\s*200px/);
		await expect(heroMobile).toHaveAttribute("style", /height:\s*120px/);
	});

	test("every variant exposes the campaign alt text", async ({ page }) => {
		await page.goto("/demo/wordmark");
		const marks = page.getByAltText("Own Your Game");
		// header link img + footer link img + hero default img + hero 120 img = 4
		await expect(marks).toHaveCount(4);
	});

	test("logo SVG is served and reachable", async ({ page }) => {
		const response = await page.goto("/assets/own-your-game-logo.svg");
		expect(response?.status()).toBe(200);
		expect(response?.headers()["content-type"]).toMatch(/svg/i);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/wordmark");
		await runAxe(page);
	});
});
