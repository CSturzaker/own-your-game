import { expect, test } from "@playwright/test";

/**
 * DEV-75 — self-hosted, subset fonts.
 *
 * Guards the two observable acceptance criteria: the Google Fonts CDN is
 * gone (no external fontfile requests anywhere), and the Arabic subset is
 * fetched only where Arabic glyphs appear (/ar) — not on Latin pages.
 * Everything is served same-origin from the bundled @font-face (DEV-75);
 * `unicode-range` gates which subset woff2 actually downloads.
 */
test.describe("fonts (DEV-75)", () => {
	test("home loads no external font requests and preloads the display face", async ({ page }) => {
		const external: string[] = [];
		const woff2: string[] = [];
		page.on("request", (r) => {
			const u = r.url();
			if (/fonts\.(googleapis|gstatic)\.com/.test(u)) external.push(u);
			if (u.endsWith(".woff2")) woff2.push(u);
		});

		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// No Google Fonts CDN traffic at all.
		expect(external).toEqual([]);

		// The above-the-fold display Latin subset is preloaded, same-origin.
		const preload = page.locator('link[rel="preload"][as="font"]');
		await expect(preload).toHaveCount(1);
		await expect(preload).toHaveAttribute(
			"href",
			/\/space-grotesk-latin-wght-normal\.[\w-]+\.woff2$/,
		);

		// The Arabic subset never downloads on a Latin page.
		expect(woff2.some((u) => /noto-sans-arabic/.test(u))).toBe(false);
	});

	test("metric-matched fallback faces are wired into the font stacks (DEV-105)", async ({
		page,
	}) => {
		// The `swap` fallback→webfont swap must be layout-neutral, or it
		// reflows the page (it was the entire /squad CLS). The adjusted
		// fallback faces carry that: they must sit in each `--font-*` stack
		// before the generic `system-ui`, so they — not the system font — are
		// what paints before the webfont arrives.
		await page.goto("/");
		const stacks = await page.evaluate(() => {
			const s = getComputedStyle(document.documentElement);
			return {
				display: s.getPropertyValue("--font-display").trim(),
				body: s.getPropertyValue("--font-body").trim(),
			};
		});
		expect(stacks.display).toContain("Space Grotesk Fallback");
		expect(stacks.body).toContain("Noto Sans Fallback");
		expect(stacks.display.indexOf("Space Grotesk Fallback")).toBeLessThan(
			stacks.display.indexOf("system-ui"),
		);
		expect(stacks.body.indexOf("Noto Sans Fallback")).toBeLessThan(
			stacks.body.indexOf("system-ui"),
		);

		// The faces are declared (registered in the document font set).
		const families = await page.evaluate(() => {
			const out: string[] = [];
			document.fonts.forEach((f) => out.push(f.family));
			return out;
		});
		expect(families).toContain("Space Grotesk Fallback");
		expect(families).toContain("Noto Sans Fallback");
	});

	test("the Arabic subset downloads on /ar (and the page is RTL)", async ({ page }) => {
		const arabicFont: string[] = [];
		page.on("request", (r) => {
			if (/noto-sans-arabic.*\.woff2$/.test(r.url())) arabicFont.push(r.url());
		});

		await page.goto("/ar/");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
		expect(arabicFont.length).toBeGreaterThan(0);
	});
});
