import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Behavioural e2e for the SignedBy row (DEV-54).
 *
 * Target: `/demo/signed-by` (16-voice fixture), not `/letter` — the
 * live sheet currently holds 3 voices, too few to exercise the 11-pill
 * sample or the "+N more" overflow. The demo's first row is the
 * 16-voice instance; the second is the 3-voice sparse case.
 *
 * The row hydrates `client:idle`, so wait for an idle callback before
 * driving the Radix tooltips.
 */

const FIRST_ROW = "section.border-t";

async function waitForIslandHydration(page: Page): Promise<void> {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
					.requestIdleCallback;
				if (typeof idle === "function") idle(() => resolve());
				else setTimeout(resolve, 100);
			}),
	);
}

test.describe("signed-by row", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/demo/signed-by");
		await waitForIslandHydration(page);
	});

	test("renders 11 name pills and a '+ 5 more' link to the squad", async ({ page }) => {
		const row = page.locator(FIRST_ROW).first();
		await expect(row.getByRole("button")).toHaveCount(11);
		// Deterministic alphabetical sample — first and last of the 11.
		await expect(row.getByRole("button", { name: "Aïsha" })).toBeVisible();
		await expect(row.getByRole("button", { name: "Mei" })).toBeVisible();

		const more = row.getByRole("link", { name: /\+ 5 more/ });
		await expect(more).toBeVisible();
		await expect(more).toHaveAttribute("href", "/squad");
	});

	test("a pill reveals the signer's age, city, and country on hover", async ({
		page,
	}, testInfo) => {
		// Chromium-desktop only: WebKit headless doesn't deliver the
		// pointer events Radix's hover open path needs (a harness quirk,
		// not a real-Safari bug), and touch has no hover. The open/close
		// logic itself is covered cross-engine by the Tooltip Vitest spec.
		test.skip(testInfo.project.name !== "chromium-desktop", "hover tooltip: chromium-desktop only");
		await page.locator(FIRST_ROW).first().getByRole("button", { name: "Aïsha" }).hover();
		const tip = page.getByRole("tooltip").first();
		await expect(tip).toBeVisible();
		await expect(tip).toContainText("Aïsha, 19");
		await expect(tip).toContainText("Dakar, Senegal");
	});

	test("the '+ N more' link navigates to the squad", async ({ page }) => {
		await page
			.locator(FIRST_ROW)
			.first()
			.getByRole("link", { name: /\+ 5 more/ })
			.click();
		await expect(page).toHaveURL(/\/squad$/);
	});

	test("the row is accessible", async ({ page }) => {
		await runAxe(page);
	});
});
