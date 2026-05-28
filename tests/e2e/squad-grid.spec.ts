import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";
import { openFilter } from "./helpers/squad";

/**
 * Squad grid (DEV-60).
 *
 * Interactive behaviour runs against `/demo/squad-grid`, which wires the
 * grid + filter bar to the 16-voice fixture so filter combinations are
 * deterministic regardless of how many voices the live pipeline has
 * published. The cold-load skeleton is asserted against `/squad`, the
 * real page, where the grid reads the `#squad-data` block — that's the
 * production path and the SSR output is stable.
 *
 * The fixture's friendship voices are exactly two — Liang (CN, newest)
 * and Yusuf (EG) — which makes "filter narrows the grid" a fixed target.
 */

const GRID = "[data-squad-grid]";
const TILE = "[data-tile]";

/** Wait for the grid island to swap its skeleton for real tiles. */
async function waitForGrid(page: Page): Promise<void> {
	await expect(page.locator(TILE).first()).toBeVisible();
}

test.describe("squad grid", () => {
	test("renders the cold-load skeleton in the server HTML", async ({ request }) => {
		const res = await request.get("/squad");
		expect(res.ok()).toBeTruthy();
		const html = await res.text();
		// The island SSRs with no voices (the #squad-data block isn't
		// reachable server-side), so the first paint is skeleton tiles.
		expect(html).toContain("data-skeleton-grid");
		expect(html).toContain("data-skeleton");
	});

	test("hydrates the live grid from the #squad-data block", async ({ page }) => {
		await page.goto("/squad");
		await waitForGrid(page);
		// Real tiles replaced the skeletons; the skeleton grid is gone.
		await expect(page.locator("[data-skeleton-grid]")).toHaveCount(0);
		const tiles = await page.locator(TILE).count();
		expect(tiles).toBeGreaterThan(0);
		expect(tiles).toBeLessThanOrEqual(24);
	});

	test("filtering narrows the grid and re-links the tiles", async ({ page }) => {
		await page.goto("/demo/squad-grid");
		await waitForGrid(page);
		expect(await page.locator(TILE).count()).toBe(16);

		const popover = await openFilter(page, "Theme: All");
		await popover.getByRole("button", { name: "Friendship" }).click();

		// Grid fades, swaps to the two friendship voices, newest first.
		await expect(page.locator(TILE)).toHaveCount(2);
		const firstHref = await page.locator(TILE).first().getAttribute("href");
		expect(firstHref).toBe("/voice/liang-cn-008?from=squad&theme=friendship");
	});

	test("empty filter combination renders no tiles", async ({ page }) => {
		await page.goto("/demo/squad-grid");
		await waitForGrid(page);

		// Friendship + Kenya: the fixture's only Kenyan voice is fairness.
		const themePopover = await openFilter(page, "Theme: All");
		await themePopover.getByRole("button", { name: "Friendship" }).click();
		await expect(page.locator(TILE)).toHaveCount(2);

		const countryPopover = await openFilter(page, "Country: All");
		await countryPopover.getByRole("button", { name: "Kenya" }).click();
		await expect(page.locator(TILE)).toHaveCount(0);
	});

	test("renders 3 / 6 / 8 columns at mobile / tablet / desktop", async ({ page }) => {
		await page.goto("/demo/squad-grid");
		await waitForGrid(page);

		const columnCount = (): Promise<number> =>
			page
				.locator(GRID)
				.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);

		await page.setViewportSize({ width: 390, height: 844 });
		expect(await columnCount()).toBe(3);

		await page.setViewportSize({ width: 800, height: 1000 });
		expect(await columnCount()).toBe(6);

		await page.setViewportSize({ width: 1440, height: 900 });
		expect(await columnCount()).toBe(8);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/squad-grid");
		await waitForGrid(page);
		await runAxe(page);
	});
});
