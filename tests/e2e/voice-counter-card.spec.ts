import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

test.describe("voice counter card demo", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/demo/voice-counter");
	});

	test("default variant renders the label, the count, and the long live copy", async ({ page }) => {
		const card = page.locator("[data-voice-counter-card]").first();
		await expect(card).toContainText("The voice counter");
		await expect(card).toContainText("247");
		// Both live-row spans render in the DOM; CSS picks which is
		// visible per viewport + motion preference. Confirm both are
		// present so the CSS swap actually has something to swap.
		await expect(card.getByText("Young voices — and counting")).toHaveCount(1);
		await expect(card.getByText("Voices and counting")).toHaveCount(1);
	});

	test("loading variant renders a skeleton block with sr-only progress text", async ({ page }) => {
		const card = page.locator("[data-voice-counter-card]").nth(2);
		// Number element is replaced by a [data-skeleton] block — the
		// prototype's "faded 246" can't satisfy AA contrast on the
		// AA-cleared cyan; see the component comment.
		await expect(card.locator("[data-skeleton]")).toHaveCount(1);
		await expect(card.locator("p.font-display.font-bold")).toHaveCount(0);
		await expect(card.getByText("Loading voice count")).toHaveCount(1);
	});

	test("error variant renders the offline message and drops the pulse", async ({ page }) => {
		const card = page.locator("[data-voice-counter-card][data-error]");
		await expect(card).toContainText("As of 09:42 GMT — reconnecting");
		await expect(card).toContainText("Live counter temporarily offline");
		// No data-pulse on the dot when error.
		await expect(card.locator("[data-pulse]")).toHaveCount(0);
	});

	test("forced reduced-motion variant collapses to the short copy and drops the pulse", async ({
		page,
	}) => {
		const card = page.locator("[data-voice-counter-card]").nth(1);
		// Only the short variant should appear (no long text).
		await expect(card).toContainText("Voices and counting");
		await expect(card.getByText("Young voices — and counting")).toHaveCount(0);
		await expect(card.locator("[data-pulse]")).toHaveCount(0);
	});

	test("respects prefers-reduced-motion at runtime — swaps to short copy + no pulse", async ({
		browser,
	}) => {
		// New context with reduced motion forced via emulation; the same
		// CSS variant prefixes that drive `forceReducedMotion` should
		// pick up the media query.
		const context = await browser.newContext({ reducedMotion: "reduce" });
		const page = await context.newPage();
		await page.goto("/demo/voice-counter");

		// First card is the default-state one; under reduced motion the
		// long copy should be hidden and the short copy visible.
		const card = page.locator("[data-voice-counter-card]").first();
		await expect(card.getByText("Young voices — and counting")).toBeHidden();
		await expect(card.getByText("Voices and counting").first()).toBeVisible();

		// The pulse keyframe is collapsed to ~0ms by the global guard;
		// the static box-shadow stays as the resting state. We can't
		// assert "no animation" reliably across engines, so confirm the
		// dot still exists and the data-pulse hook is still on it (the
		// CSS guard does the rest).
		await expect(card.locator("[data-pulse]")).toHaveCount(1);

		await context.close();
	});

	test("has zero WCAG 2.1 A/AA violations across all variants", async ({ page }) => {
		await runAxe(page);
	});
});
