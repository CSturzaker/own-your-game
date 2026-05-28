import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Open a squad filter popover robustly.
 *
 * The filter island hydrates `client:idle`, and a `requestIdleCallback`
 * wait can resolve before Astro finishes the island's dynamic import — so
 * a single click can land on un-hydrated SSR HTML and be lost. This polls:
 * it clicks only while the chip is collapsed and retries until the popover
 * actually opens, which doubles as the hydration gate.
 *
 * `exact` matters — Playwright's `name` is substring-based, so "Age: All"
 * would otherwise also match "Language: All".
 */
export async function openFilter(page: Page, chipName: string): Promise<Locator> {
	const chip = page.getByRole("button", { name: chipName, exact: true });
	await expect(async () => {
		if ((await chip.getAttribute("aria-expanded")) !== "true") {
			await chip.click();
		}
		await expect(page.getByRole("dialog")).toBeVisible({ timeout: 500 });
	}).toPass({ timeout: 10_000 });
	return page.getByRole("dialog");
}

/** Wait for the filter island to hydrate by gating on a real open/close. */
export async function waitForFiltersHydrated(page: Page): Promise<void> {
	await openFilter(page, "Theme: All");
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog")).toHaveCount(0);
}
