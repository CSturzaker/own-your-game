import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Smoke E2E that proves the runner, the dev/preview server, and the
 * axe-core gate are all wired correctly. Real per-page journeys land
 * with their respective epics (home DEV-35+, player DEV-42+, etc.).
 *
 * Runs in three projects (chromium-desktop, webkit-desktop,
 * chromium-mobile) per playwright.config.ts — proves the multi-
 * project setup actually parallelises across browsers and viewports.
 */
test.describe("home placeholder", () => {
	test("renders the project name in an h1", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { level: 1, name: "Own Your Game" })).toBeVisible();
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/");
		await runAxe(page);
	});
});
