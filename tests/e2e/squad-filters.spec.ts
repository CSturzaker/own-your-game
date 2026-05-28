import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";
import { openFilter } from "./helpers/squad";

/**
 * Squad filter bar (DEV-58).
 *
 * Theme and Age options are independent of the live voice count (six
 * fixed themes, ages 11–18), so these specs are stable regardless of how
 * many voices are currently published. `openFilter` (shared helper) gates
 * on `client:idle` hydration.
 */
test.describe("squad filters", () => {
	test("opens a filter, selects a value, and the chip updates", async ({ page }) => {
		await page.goto("/squad");

		const popover = await openFilter(page, "Theme: All");
		await expect(popover.getByRole("button", { name: "Friendship" })).toBeVisible();

		await popover.getByRole("button", { name: "Friendship" }).click();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect(
			page.getByRole("button", { name: "Theme: Friendship", exact: true }),
		).toBeVisible();
	});

	test("reset appears once a filter is active and clears it", async ({ page }) => {
		await page.goto("/squad");

		await expect(page.getByRole("button", { name: "Reset filters", exact: true })).toHaveCount(0);

		const popover = await openFilter(page, "Age: All");
		await popover.getByRole("button", { name: "14", exact: true }).click();
		await expect(page.getByRole("button", { name: "Age: 14", exact: true })).toBeVisible();

		const reset = page.getByRole("button", { name: "Reset filters", exact: true });
		await expect(reset).toBeVisible();
		await reset.click();
		await expect(page.getByRole("button", { name: "Age: All", exact: true })).toBeVisible();
		await expect(page.getByRole("button", { name: "Reset filters", exact: true })).toHaveCount(0);
	});

	test("arrow keys move focus between options, Escape closes", async ({ page }) => {
		await page.goto("/squad");

		// Trigger open + Radix Escape/focus-return are covered by the Dialog
		// wrapper spec; here we exercise the custom arrow-key roving handler.
		const popover = await openFilter(page, "Theme: All");
		const allThemes = popover.getByRole("button", { name: "All themes" });
		await allThemes.focus();

		await page.keyboard.press("ArrowDown");
		await expect(popover.getByRole("button", { name: "Fairness", exact: true })).toBeFocused();
		await page.keyboard.press("ArrowUp");
		await expect(allThemes).toBeFocused();
		await page.keyboard.press("End");
		await expect(popover.getByRole("button", { name: "Community", exact: true })).toBeFocused();

		// Escape from a settled, focused popover reliably dismisses it.
		await page.keyboard.press("Escape");
		await expect(page.getByRole("dialog")).toHaveCount(0);
	});

	test("has zero WCAG 2.1 A/AA violations (closed and open)", async ({ page }) => {
		await page.goto("/squad");

		// Open then close to gate on hydration before the closed-state scan.
		await openFilter(page, "Country: All");
		await page.keyboard.press("Escape");
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await runAxe(page);

		await openFilter(page, "Country: All");
		await runAxe(page);
	});
});
