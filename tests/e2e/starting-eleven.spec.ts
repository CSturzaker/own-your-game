import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 720 } as const;

/**
 * The demo page renders four StartingEleven instances. We index
 * them by position (default = 0, reduced-motion = 1, loading = 2,
 * sparse = 3) and query containers via aria-label attribute
 * selectors — the formation / mobile-grid containers are plain
 * divs (no landmark role) so getByRole("region") won't find them.
 */
const FORMATION = "[data-eleven-formation]";
const MOBILE_GRID = "[data-eleven-mobile]";

test.describe("starting eleven demo · desktop", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/demo/starting-eleven");
	});

	test("renders the section header — kicker, h2, supporting paragraph", async ({ page }) => {
		await expect(page.getByText("Today's starting eleven").first()).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "New Players. New Stories. Same Question." }).first(),
		).toBeVisible();
		await expect(page.getByText(/Every twelve seconds/).first()).toBeVisible();
	});

	test("renders 11 tiles in the desktop formation", async ({ page }) => {
		const formation = page.locator(FORMATION).first();
		await expect(formation.locator("[data-tile]")).toHaveCount(11);
	});

	test("tile position numbers run keeper → forwards as 01 through 11", async ({ page }) => {
		const formation = page.locator(FORMATION).first();
		const tiles = formation.locator("[data-tile]");
		for (let i = 0; i < 11; i++) {
			const padded = String(i + 1).padStart(2, "0");
			await expect(tiles.nth(i)).toContainText(padded);
		}
	});

	test("shows the pause stub + countdown indicator in the desktop header", async ({ page }) => {
		// All four instances ship the pause + countdown; assert the
		// first one has them visible (the others are below the fold
		// on the demo page).
		const buttons = page.getByRole("button", { name: /Pause rotation/ });
		await expect(buttons.first()).toBeVisible();
		await expect(page.getByText("Next rotation in 8s").first()).toBeVisible();
	});

	test("forced reduced-motion variant swaps controls for the static pill", async ({ page }) => {
		// The second StartingEleven instance is the forceReducedMotion one;
		// scope to its formation parent.
		const formation = page.locator(FORMATION).nth(1);
		const section = formation.locator("xpath=ancestor::section[1]");
		await expect(section.getByText("Reduced motion — rotation paused").first()).toBeVisible();
		await expect(section.getByRole("button", { name: /Pause rotation/ })).toHaveCount(0);
		await expect(section.getByText("Next rotation in 8s")).toHaveCount(0);
	});

	test("loading variant renders 11 skeleton tiles in the formation", async ({ page }) => {
		const formation = page.locator(FORMATION).nth(2);
		await expect(formation.locator("[data-skeleton]")).toHaveCount(11);
		await expect(formation.locator("[data-tile]")).toHaveCount(0);
	});

	test("sparse variant collapses later rows — 7 voices = no forwards row", async ({ page }) => {
		const formation = page.locator(FORMATION).nth(3);
		await expect(formation.locator("[data-tile]")).toHaveCount(7);
		await expect(formation.locator("[data-tile]").last()).toContainText("07");
	});
});

test.describe("starting eleven demo · mobile", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(MOBILE_VIEWPORT);
		await page.goto("/demo/starting-eleven");
	});

	test("default variant shows 8 tiles in a 2-col grid", async ({ page }) => {
		const grid = page.locator(MOBILE_GRID).first();
		await expect(grid.locator("[data-tile]")).toHaveCount(8);
		const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		expect(cols.split(" ").filter(Boolean)).toHaveLength(2);
	});

	test("formation container is hidden at mobile width", async ({ page }) => {
		await expect(page.locator(FORMATION).first()).toBeHidden();
	});

	test("forced reduced-motion variant shows the pill below the grid", async ({ page }) => {
		// Two pills render per reduced-motion section (one in the
		// desktop header, one in the mobile control row); at mobile
		// width the desktop one is `lg:flex` → hidden. Filter to the
		// visible pill so the assertion runs against the right node.
		const grid = page.locator(MOBILE_GRID).nth(1);
		const section = grid.locator("xpath=ancestor::section[1]");
		const visiblePill = section
			.getByText("Reduced motion — rotation paused")
			.locator("visible=true");
		await expect(visiblePill).toBeVisible();
	});
});

test.describe("starting eleven demo · shared", () => {
	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/starting-eleven");
		await runAxe(page);
	});
});
