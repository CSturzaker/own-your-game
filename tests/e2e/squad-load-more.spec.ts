import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";
import { openFilter } from "./helpers/squad";

/**
 * Squad load-more (DEV-61).
 *
 * Runs against `/demo/squad-load-more`, which wires the grid to a
 * 40-voice set (the 16-voice fixture can't fill a second page). Page
 * size is 24, so the steady state is "24 of 40 shown, Load 16 more",
 * and a single click reveals the rest.
 */

const TILE = "[data-tile]";
const PAGE = "/demo/squad-load-more";
// Scope indicator text to the control region — the demo's intro prose
// quotes the same phrases, so a bare getByText would be ambiguous.
const INDICATOR = "[data-squad-more]";

async function waitForGrid(page: Page): Promise<void> {
	await expect(page.locator(TILE).first()).toBeVisible();
}

test.describe("squad load-more", () => {
	test("shows one page with the indicator and load-more button", async ({ page }) => {
		await page.goto(PAGE);
		await waitForGrid(page);

		await expect(page.locator(TILE)).toHaveCount(24);
		await expect(page.locator(INDICATOR).getByText("Showing 24 of 40 voices")).toBeVisible();
		await expect(page.getByRole("button", { name: /Load 16 more/ })).toBeVisible();
	});

	test("clicking load-more reveals the rest, then hides the button", async ({ page }) => {
		await page.goto(PAGE);
		await waitForGrid(page);

		await page.getByRole("button", { name: /Load 16 more/ }).click();

		await expect(page.locator(TILE)).toHaveCount(40);
		await expect(page.locator(INDICATOR).getByText("All 40 voices shown")).toBeVisible();
		await expect(page.getByRole("button", { name: /Load/ })).toHaveCount(0);
	});

	test("moves focus to the first newly revealed tile", async ({ page }) => {
		await page.goto(PAGE);
		await waitForGrid(page);

		await page.getByRole("button", { name: /Load 16 more/ }).click();
		await expect(page.locator(TILE)).toHaveCount(40);
		// The 25th tile (index 24) is the first of the new page.
		await expect(page.locator(TILE).nth(24)).toBeFocused();
	});

	test("the button is operable from the keyboard", async ({ page }) => {
		await page.goto(PAGE);
		await waitForGrid(page);

		const button = page.getByRole("button", { name: /Load 16 more/ });
		await button.focus();
		await page.keyboard.press("Enter");
		await expect(page.locator(TILE)).toHaveCount(40);
	});

	test("a filter change resets pagination to page one", async ({ page }) => {
		await page.goto(PAGE);
		await waitForGrid(page);

		// Grow to the full list...
		await page.getByRole("button", { name: /Load 16 more/ }).click();
		await expect(page.locator(TILE)).toHaveCount(40);

		// ...filter, then clear: both are filter changes, so the round
		// trip must land back on a single 24-tile page with the button.
		const popover = await openFilter(page, "Theme: All");
		await popover.getByRole("button", { name: "Belonging" }).click();
		await expect(page.getByRole("button", { name: "Reset filters", exact: true })).toBeVisible();
		await page.getByRole("button", { name: "Reset filters", exact: true }).click();

		await expect(page.locator(TILE)).toHaveCount(24);
		await expect(page.getByRole("button", { name: /Load 16 more/ })).toBeVisible();
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto(PAGE);
		await waitForGrid(page);
		await runAxe(page);
	});
});
