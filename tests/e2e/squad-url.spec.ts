import { expect, test } from "@playwright/test";

import { openFilter, waitForFiltersHydrated } from "./helpers/squad";

/**
 * Squad filter ⇄ URL sync (DEV-59).
 *
 * The grid (DEV-60) isn't built yet, so these assert the observable URL +
 * chip + count state rather than which tiles render. Theme/Age are
 * independent of the live voice count, so the specs are data-stable.
 */
test.describe("squad filter URL state", () => {
	test("selecting a filter writes it to the URL", async ({ page }) => {
		await page.goto("/squad");

		const popover = await openFilter(page, "Theme: All");
		await popover.getByRole("button", { name: "Friendship" }).click();

		await expect(page).toHaveURL(/[?&]theme=friendship\b/);
	});

	test("a direct link applies the filter on load", async ({ page }) => {
		await page.goto("/squad?theme=friendship");
		// Mount reads the URL and seeds the chip.
		await expect(
			page.getByRole("button", { name: "Theme: Friendship", exact: true }),
		).toBeVisible();
	});

	test("reloading preserves the filter state", async ({ page }) => {
		await page.goto("/squad");
		const popover = await openFilter(page, "Age: All");
		await popover.getByRole("button", { name: "14", exact: true }).click();
		await expect(page).toHaveURL(/[?&]age=14\b/);

		await page.reload();
		await expect(page.getByRole("button", { name: "Age: 14", exact: true })).toBeVisible();
	});

	test("combined filters intersect in the URL and the count", async ({ page }) => {
		await page.goto("/squad");

		const themePopover = await openFilter(page, "Theme: All");
		await themePopover.getByRole("button", { name: "Friendship" }).click();
		const countryPopover = await openFilter(page, "Country: All");
		// Pick whichever country is first in the (data-derived) list.
		const firstCountry = countryPopover.locator("[data-option]").nth(1);
		await firstCountry.click();

		await expect(page).toHaveURL(/theme=friendship/);
		await expect(page).toHaveURL(/country=/);
		// The count switches to the "Showing X of Y" form once narrowed.
		await expect(page.getByText(/Showing \d+ of \d+ voices/)).toBeVisible();
	});

	test("back and forward navigate between filter states", async ({ page }) => {
		await page.goto("/squad");
		await waitForFiltersHydrated(page);

		const popover = await openFilter(page, "Theme: All");
		await popover.getByRole("button", { name: "Friendship" }).click();
		await expect(
			page.getByRole("button", { name: "Theme: Friendship", exact: true }),
		).toBeVisible();

		await page.goBack();
		await expect(page.getByRole("button", { name: "Theme: All", exact: true })).toBeVisible();

		await page.goForward();
		await expect(
			page.getByRole("button", { name: "Theme: Friendship", exact: true }),
		).toBeVisible();
	});

	test("an invalid param is dropped and the page still renders", async ({ page }) => {
		await page.goto("/squad?theme=banter&age=99");
		// Header still renders, and the bad filters do not apply.
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByRole("button", { name: "Theme: All", exact: true })).toBeVisible();
		await expect(page.getByRole("button", { name: "Age: All", exact: true })).toBeVisible();
	});
});
