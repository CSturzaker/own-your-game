import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

test.describe("tile demo", () => {
	test("each tile is a link with the expected href and accessible name", async ({ page }) => {
		await page.goto("/demo/tile");
		// Amara at position 01 appears in three sections (Starting eleven,
		// Size variants md, Size variants sm). The first is the one
		// rendered in the Starting eleven grid.
		const amara = page.getByRole("link", { name: "Amara, Nigeria, position 01" }).first();
		await expect(amara).toBeVisible();
		await expect(amara).toHaveAttribute("href", "/voice/amara-ng-001");

		const yusuf = page.getByRole("link", { name: "Yusuf, Egypt, position 02" });
		await expect(yusuf).toHaveAttribute("href", "/voice/yusuf-eg-002");
	});

	test("position numbers pad correctly across grid placements", async ({ page }) => {
		await page.goto("/demo/tile");
		// The 'Squad numbering' section renders Amara at position 247.
		const big = page.getByRole("link", { name: "Amara, Nigeria, position 247" });
		await expect(big).toBeVisible();
	});

	test("skeleton tiles render no link and carry aria-hidden", async ({ page }) => {
		await page.goto("/demo/tile");
		const skeletons = page.locator("[data-skeleton]");
		await expect(skeletons.first()).toBeVisible();
		const count = await skeletons.count();
		expect(count).toBeGreaterThanOrEqual(4);
		for (const sk of await skeletons.all()) {
			await expect(sk).toHaveAttribute("aria-hidden", "true");
			// Skeletons must not be focusable — they aren't links.
			const tag = await sk.evaluate((el) => el.tagName.toLowerCase());
			expect(tag).toBe("div");
		}
	});

	test("flash variant emits the data-flash attribute", async ({ page }) => {
		await page.goto("/demo/tile");
		const flashed = page.locator("a[data-flash]");
		await expect(flashed).toHaveCount(1);
	});

	test("Tab traverses tiles and Enter activates the link", async ({ page, browserName }) => {
		test.skip(
			browserName === "webkit",
			"WebKit needs OS-level Full Keyboard Access to traverse links on Tab.",
		);
		await page.goto("/demo/tile");

		const amara = page.getByRole("link", { name: "Amara, Nigeria, position 01" }).first();
		await amara.focus();
		await expect(amara).toBeFocused();

		await page.keyboard.press("Tab");
		await expect(page.getByRole("link", { name: "Yusuf, Egypt, position 02" })).toBeFocused();

		// Enter follows the link (we end up at /voice/yusuf-eg-002 even
		// though it's a 404 in this build — only the URL transition
		// matters).
		await page.keyboard.press("Enter");
		await expect(page).toHaveURL(/\/voice\/yusuf-eg-002$/);
	});

	test("unknown country code falls back to a non-empty gradient", async ({ page }) => {
		await page.goto("/demo/tile");
		// The TV demo voice has no flag or display-name mapping; the
		// label falls back to the bare code and the swatch to the
		// neutral grey gradient.
		const tv = page.getByRole("link", { name: /Demo, TV/ });
		await expect(tv).toBeVisible();
		const swatch = tv.locator("span[style*='background']").first();
		await expect(swatch).toHaveAttribute("style", /linear-gradient/);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/tile");
		await runAxe(page);
	});
});
