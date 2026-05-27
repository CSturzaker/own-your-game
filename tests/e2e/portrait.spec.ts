import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

test.describe("portrait demo", () => {
	test("every silhouette example carries an alt-text equivalent", async ({ page }) => {
		await page.goto("/demo/portrait");

		// Silhouette-only portraits render the alt as an sr-only span
		// (the figure itself is presentational). At least one example
		// of each variant is visible in the demo grid.
		const srOnlyAlts = page.locator(".sr-only");
		const count = await srOnlyAlts.count();
		expect(count).toBeGreaterThan(0);
	});

	test("the working real-image example renders the <img>", async ({ page }) => {
		await page.goto("/demo/portrait");
		const working = page.getByAltText("Working portrait example");
		// Scroll the real-image section into view so the `client:visible`
		// island hydrates and `loading="lazy"` releases the request.
		await working.scrollIntoViewIfNeeded();
		await expect(working).toBeVisible();
		await page.waitForFunction((sel) => {
			const img = document.querySelector<HTMLImageElement>(sel);
			return img !== null && img.complete && img.naturalWidth > 0;
		}, "img[alt='Working portrait example']");
	});

	test("the broken example hides the image so the silhouette shows", async ({ page }) => {
		await page.goto("/demo/portrait");
		// Scroll the broken example into view to trigger hydration.
		// The Astro shell SSRs the <img>, the native load fails, and
		// the island's useEffect unmounts the img on hydration.
		await page.getByText("Broken src → fallback").scrollIntoViewIfNeeded();
		const broken = page.getByAltText(/Broken portrait example/);
		await expect(broken).toHaveCount(0, { timeout: 10_000 });
	});

	test("renders the 7 silhouette demo tiles deterministically across reloads", async ({ page }) => {
		await page.goto("/demo/portrait");
		const firstLoadSeeds = await page.locator("p.font-mono").allInnerTexts();
		await page.reload();
		const secondLoadSeeds = await page.locator("p.font-mono").allInnerTexts();
		expect(secondLoadSeeds).toEqual(firstLoadSeeds);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/portrait");
		await runAxe(page);
	});
});
