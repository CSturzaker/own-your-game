import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

/**
 * Active-set prev/next in the desktop modal (DEV-48): open from the squad,
 * traverse with the buttons + arrow keys, and confirm the boundaries
 * disable. Derives the newest-first order (the squad's order, and the
 * unfiltered active set) from the live `content/voices.json` so it adapts
 * to whatever voices ship; needs at least two to traverse.
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

test.describe("player card prev/next — desktop modal", () => {
	test.skip(({ viewport }) => !viewport || viewport.width < 1024, "Desktop modal only.");
	test.skip(ordered.length < 2, "Needs at least two voices to traverse.");

	test("traverses the active set via buttons and arrow keys", async ({ page }) => {
		const total = ordered.length;
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

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText(ordered[0]!.firstName);
		await expect(dialog).toContainText(`1 of ${total}`);

		// At the start: Previous is disabled, Next enabled.
		await expect(dialog.getByRole("button", { name: /Previous voice/ })).toBeDisabled();

		// Next button → second voice, URL + indicator update in place.
		await dialog.getByRole("button", { name: /Next voice/ }).click();
		await expect(dialog).toContainText(ordered[1]!.firstName);
		await expect(dialog).toContainText(`2 of ${total}`);
		await expect(page).toHaveURL(new RegExp(`/voice/${ordered[1]!.id}`));

		if (total >= 3) {
			// ArrowRight advances; at the end Next disables.
			await page.keyboard.press("ArrowRight");
			await expect(dialog).toContainText(ordered[2]!.firstName);
			await expect(dialog).toContainText(`3 of ${total}`);
		}
		if (total === 3) {
			await expect(dialog.getByRole("button", { name: /Next voice/ })).toBeDisabled();
		}

		// ArrowLeft steps back.
		await page.keyboard.press("ArrowLeft");
		await expect(dialog).toContainText(ordered[total >= 3 ? 1 : 0]!.firstName);
	});
});
