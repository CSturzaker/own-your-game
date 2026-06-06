import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

/**
 * Next/previous voice transition in the desktop modal (DEV-98): the swap
 * animates as a directional slide-in + paper cross-fade, and drops to an
 * instant swap under reduced motion. Derives the newest-first order from
 * the live `content/voices.json` (the same source as player-prevnext) so
 * it adapts to whatever voices ship; needs at least two to traverse.
 *
 * The animation is verified by probing for the `player-voice-in`
 * `animationstart` event rather than reading a transient attribute (the
 * card clears `data-voice-transition` on animationend, so a `toHaveAttribute`
 * assertion would race the ~320ms window).
 */

interface VoiceRow {
	id: string;
	firstName: string;
	publishedAt: string;
}

const ordered: VoiceRow[] = (() => {
	const file = JSON.parse(readFileSync("content/voices.json", "utf8")) as { voices: VoiceRow[] };
	return [...file.voices].sort(
		(a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id),
	);
})();

test.describe("player card transition — desktop modal (DEV-98)", () => {
	test.skip(({ viewport }) => !viewport || viewport.width < 1024, "Desktop modal only.");
	test.skip(ordered.length < 2, "Needs at least two voices to traverse.");

	async function openFirstTile(page: Page) {
		await page.goto("/squad");
		const firstTile = page.locator("main a[data-voice-id]").first();
		await firstTile.waitFor();
		// Wait for the overlay island (client:idle) to bind.
		await page.evaluate(
			() =>
				new Promise<void>((resolve) => {
					if ("requestIdleCallback" in window) requestIdleCallback(() => resolve());
					else setTimeout(resolve, 250);
				}),
		);
		await firstTile.click();
		await expect(page.getByRole("dialog")).toBeVisible();
	}

	// Count `player-voice-in` animation starts on the page (ignores the
	// tile-hover flash, skeleton pulse, and the veil keyframe).
	async function armAnimationProbe(page: Page) {
		await page.evaluate(() => {
			(window as unknown as { __voiceAnim: number }).__voiceAnim = 0;
			document.addEventListener("animationstart", (event) => {
				if (event.animationName === "player-voice-in") {
					(window as unknown as { __voiceAnim: number }).__voiceAnim++;
				}
			});
		});
	}

	const probeCount = (page: Page) =>
		page.evaluate(() => (window as unknown as { __voiceAnim: number }).__voiceAnim);

	test("animates the slide-in on a next swap", async ({ page }) => {
		await openFirstTile(page);
		await armAnimationProbe(page);

		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: /Next voice/ }).click();

		await expect(dialog).toContainText(ordered[1]!.firstName);
		await expect(page).toHaveURL(new RegExp(`/voice/${ordered[1]!.id}`));
		await expect.poll(() => probeCount(page)).toBeGreaterThan(0);
	});

	test("drops to an instant swap under reduced motion", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await openFirstTile(page);
		await armAnimationProbe(page);

		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: /Next voice/ }).click();

		// The swap still completes — content, URL and indicator all update.
		await expect(dialog).toContainText(ordered[1]!.firstName);
		await expect(page).toHaveURL(new RegExp(`/voice/${ordered[1]!.id}`));
		await expect(dialog).toContainText(`2 of ${ordered.length}`);

		// ...but no slide animation fired (the effect early-returns).
		await page.waitForTimeout(400);
		expect(await probeCount(page)).toBe(0);
	});

	test("the sliding card never shows a horizontal scrollbar on the modal", async ({ page }) => {
		await openFirstTile(page);

		// The card translates up to 24px during the slide; the modal's scroll
		// container clips the x-axis (`overflow-x-clip`, computed to `hidden`
		// since overflow-y is auto) so no horizontal scrollbar renders.
		const dialog = page.getByRole("dialog");
		const overflowX = await dialog.evaluate((el) => getComputedStyle(el).overflowX);
		expect(["hidden", "clip"]).toContain(overflowX);

		await dialog.getByRole("button", { name: /Next voice/ }).click();
		await expect(dialog).toContainText(ordered[1]!.firstName);

		// No rendered horizontal scrollbar at any point: the document doesn't
		// scroll and the modal's x-axis is clipped, not auto/scroll.
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
			),
		).toBe(true);
		const stillClipped = await dialog.evaluate((el) => {
			const o = getComputedStyle(el).overflowX;
			return o === "hidden" || o === "clip";
		});
		expect(stillClipped).toBe(true);
	});
});
