import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";
import { openFilter, waitForFiltersHydrated } from "./helpers/squad";

const isMobile = ({ viewport }: { viewport: { width: number; height: number } | null }) =>
	(viewport?.width ?? 0) < 1025;

/**
 * Squad filter bar (DEV-58; theme + age dimensions removed in DEV-110).
 *
 * Country and Language options are data-derived (only countries/languages
 * with a published voice appear), so these specs select the first real
 * option by position rather than a fixed name, keeping them stable across
 * whatever content ships. `openFilter` (shared helper) gates on
 * `client:idle` hydration.
 */
test.describe("squad filters", () => {
	test("opens a filter, selects a value, and the chip updates", async ({ page }) => {
		await page.goto("/squad");

		const popover = await openFilter(page, "Country: All");
		// nth(0) is the "All countries" reset option; nth(1) is the first
		// data-derived country.
		await popover.locator("[data-option]").nth(1).click();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		// The chip relabels off "All" and the reset link appears.
		await expect(page.getByRole("button", { name: "Country: All", exact: true })).toHaveCount(0);
		await expect(page.getByRole("button", { name: "Reset filters", exact: true })).toBeVisible();
	});

	test("reset appears once a filter is active and clears it", async ({ page }) => {
		await page.goto("/squad");

		await expect(page.getByRole("button", { name: "Reset filters", exact: true })).toHaveCount(0);

		const popover = await openFilter(page, "Language: All");
		await popover.locator("[data-option]").nth(1).click();
		await expect(page.getByRole("button", { name: "Language: All", exact: true })).toHaveCount(0);

		const reset = page.getByRole("button", { name: "Reset filters", exact: true });
		await expect(reset).toBeVisible();
		await reset.click();
		await expect(page.getByRole("button", { name: "Language: All", exact: true })).toBeVisible();
		await expect(page.getByRole("button", { name: "Reset filters", exact: true })).toHaveCount(0);
	});

	test("arrow keys move focus between options, Escape closes", async ({ page }) => {
		await page.goto("/squad");

		// Trigger open + Radix Escape/focus-return are covered by the Dialog
		// wrapper spec; here we exercise the custom arrow-key roving handler.
		const popover = await openFilter(page, "Country: All");
		const options = popover.locator("[data-option]");
		const allCountries = page.getByRole("button", { name: "All countries", exact: true });
		await allCountries.focus();

		await page.keyboard.press("ArrowDown");
		await expect(options.nth(1)).toBeFocused();
		await page.keyboard.press("ArrowUp");
		await expect(allCountries).toBeFocused();
		await page.keyboard.press("End");
		await expect(options.last()).toBeFocused();

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

/**
 * Sticky offset (DEV-93). On desktop the filter bar is `lg:sticky` and must
 * park flush under the locked 60px header (`lg:top-15`); a mismatched offset
 * leaves a transparent band where tiles show through as slivers. Must run
 * against `/squad` (not a demo surface) because only `/squad` renders the
 * locked `<Header sticky />`. Geometric assertions, not screenshots —
 * consistent with the other sticky/scroll-spy specs.
 */
test.describe("squad filters · sticky offset (desktop)", () => {
	test.skip(isMobile, "filter bar is sticky only at lg and above");

	test("parks flush under the locked header when scrolled (no sliver gap)", async ({ page }) => {
		// Use a short desktop viewport: keep the width ≥ lg (so the header
		// stays locked at 60px and the bar stays `lg:sticky`), but shrink the
		// height so the page can scroll the bar all the way to its parked
		// spot. With the live grid only a few voices tall, a full-height
		// viewport doesn't give enough scroll room to reach it; sticky
		// mechanics are width-gated, not height-gated, so this is faithful
		// and stays robust as the voice count changes.
		await page.setViewportSize({ width: 1440, height: 520 });
		await page.goto("/squad");
		await waitForFiltersHydrated(page);

		const header = page.locator("[data-sticky-trigger]");
		const filter = page.getByRole("region", { name: "Filter voices" });

		// Reset to the top first — opening/closing a popover during the
		// hydration gate can leave the page scrolled, which would throw off
		// the resting-position read below.
		await page.evaluate(() => window.scrollTo(0, 0));
		const restTop = (await filter.boundingBox())?.y ?? 0;

		// Scroll just past the bar's resting top so it pins under the header,
		// but not so far that <main> ends and the sticky bar releases (which
		// would scroll it up and hide the gap). The short viewport above
		// guarantees enough room to reach this parked window.
		await page.evaluate((y) => window.scrollTo(0, y), Math.ceil(restTop) + 24);

		// Poll the gap between the header bottom and the filter top (the poll
		// also rides out the header's 200ms compact-height transition). The
		// pre-fix bug (top-20 against a 60px header) leaves ~20px here.
		await expect(async () => {
			const h = await header.boundingBox();
			const f = await filter.boundingBox();
			expect(h, "header bounding box").not.toBeNull();
			expect(f, "filter bounding box").not.toBeNull();
			const gap = f!.y - (h!.y + h!.height);
			expect(gap).toBeLessThanOrEqual(1);
		}).toPass({ timeout: 5_000 });
	});
});

test.describe("squad filters · static on mobile", () => {
	test.skip(
		({ viewport }) => (viewport?.width ?? 0) >= 1025,
		"asserts the mobile, non-sticky layout",
	);

	test("filter bar is not sticky below the lg breakpoint", async ({ page }) => {
		await page.goto("/squad");
		const filter = page.getByRole("region", { name: "Filter voices" });
		const position = await filter.evaluate((el) => getComputedStyle(el).position);
		expect(position).not.toBe("sticky");
	});
});
