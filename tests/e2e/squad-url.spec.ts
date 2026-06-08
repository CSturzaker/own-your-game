import { expect, test } from "@playwright/test";

import { openFilter, waitForFiltersHydrated } from "./helpers/squad";

/**
 * Squad filter ⇄ URL sync (DEV-59; theme + age dimensions removed in
 * DEV-110).
 *
 * Country and Language options are data-derived, so these select the
 * first real option by position and assert the observable URL + chip +
 * count state rather than a fixed value.
 */
test.describe("squad filter URL state", () => {
	test("selecting a filter writes it to the URL", async ({ page }) => {
		await page.goto("/squad");

		const popover = await openFilter(page, "Country: All");
		await popover.locator("[data-option]").nth(1).click();

		await expect(page).toHaveURL(/[?&]country=[A-Z]{2}\b/);
	});

	test("a direct link applies the filter on load", async ({ page }) => {
		// Discover a real country code from the live options, then deep-link.
		await page.goto("/squad");
		const popover = await openFilter(page, "Country: All");
		await popover.locator("[data-option]").nth(1).click();
		await expect(page).toHaveURL(/[?&]country=[A-Z]{2}\b/);
		const code = new URL(page.url()).searchParams.get("country")!;

		// A fresh load of the deep link seeds the chip from the URL — the
		// country chip is no longer "All".
		await page.goto(`/squad?country=${code}`);
		await expect(page.getByRole("button", { name: "Country: All", exact: true })).toHaveCount(0);
		await expect(page.getByRole("button", { name: /^Country: / })).toBeVisible();
	});

	test("reloading preserves the filter state", async ({ page }) => {
		await page.goto("/squad");
		const popover = await openFilter(page, "Language: All");
		await popover.locator("[data-option]").nth(1).click();
		await expect(page).toHaveURL(/[?&]language=/);

		await page.reload();
		await expect(page.getByRole("button", { name: "Language: All", exact: true })).toHaveCount(0);
	});

	test("combined filters intersect in the URL and the count", async ({ page }) => {
		await page.goto("/squad");

		await (await openFilter(page, "Country: All")).locator("[data-option]").nth(1).click();
		await (await openFilter(page, "Language: All")).locator("[data-option]").nth(1).click();

		await expect(page).toHaveURL(/country=/);
		await expect(page).toHaveURL(/language=/);
		// The count switches to the "Showing X of Y" form once narrowed
		// (the intersection may be empty — 0 is valid here).
		await expect(page.getByText(/Showing \d+ of \d+ voices/)).toBeVisible();
	});

	test("back and forward navigate between filter states", async ({ page }) => {
		await page.goto("/squad");
		await waitForFiltersHydrated(page);

		const popover = await openFilter(page, "Country: All");
		await popover.locator("[data-option]").nth(1).click();
		await expect(page.getByRole("button", { name: "Country: All", exact: true })).toHaveCount(0);

		await page.goBack();
		await expect(page.getByRole("button", { name: "Country: All", exact: true })).toBeVisible();

		await page.goForward();
		await expect(page.getByRole("button", { name: "Country: All", exact: true })).toHaveCount(0);
	});

	test("an invalid or dropped param leaves filters unapplied and the page renders", async ({
		page,
	}) => {
		// Malformed country/language are dropped; the old theme/age params are
		// no longer filter dimensions and are simply ignored (DEV-110).
		await page.goto("/squad?country=KENYA&language=@@@&theme=friendship&age=99");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByRole("button", { name: "Country: All", exact: true })).toBeVisible();
		await expect(page.getByRole("button", { name: "Language: All", exact: true })).toBeVisible();
	});
});
