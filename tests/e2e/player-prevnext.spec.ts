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
		// Wait for the overlay island (client:idle) to bind, then for the
		// lazily-fetched voice index to resolve so interception is live (DEV-107).
		await page.evaluate(
			() =>
				new Promise<void>((resolve) => {
					if ("requestIdleCallback" in window) requestIdleCallback(() => resolve());
					else setTimeout(resolve, 250);
				}),
		);
		await page.waitForFunction(() =>
			document.documentElement.hasAttribute("data-voice-index-ready"),
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

	test("close returns to the squad in one step after traversing with the video playing (DEV-126)", async ({
		page,
	}) => {
		// Regression: with the Stream iframe mounted, each prev/next swap
		// mutated the iframe's src — a navigation that pushes a joint
		// session-history entry — so Close (history.back()) stepped back
		// through the viewed voices one click at a time instead of closing.
		// The iframe never plays in headless (and CI's demo-customer
		// subdomain 404s the embed); mounting it is enough to arm the bug.
		await page.goto("/squad");
		const firstTile = page.locator("main a[data-voice-id]").first();
		await firstTile.waitFor();
		await page.evaluate(
			() =>
				new Promise<void>((resolve) => {
					if ("requestIdleCallback" in window) requestIdleCallback(() => resolve());
					else setTimeout(resolve, 250);
				}),
		);
		await page.waitForFunction(() =>
			document.documentElement.hasAttribute("data-voice-index-ready"),
		);
		await firstTile.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		// Stub the Stream embed document. Two reasons: CI runners can't
		// reliably reach cloudflarestream.com (the frame never commits and
		// the load-wait below times out), and the bug only arms once the
		// iframe's document has *finished loading* — a src change on a
		// not-yet-loaded iframe replaces instead of pushing, which would
		// leave this test falsely green. A fulfilled stub commits + loads
		// instantly and deterministically in every environment, and the
		// navigation is real to the browser, so the buggy src mutation
		// still pushes its history entry. Scoped to the embed page only —
		// the lazily-loaded player SDK must not be swallowed.
		await page.route(/customer-[^/]+\.cloudflarestream\.com\/[^/]+\/iframe/, (route) =>
			route.fulfill({ contentType: "text/html", body: "<!doctype html><title>stub</title>" }),
		);

		// Mount the video pane and wait for the embed document to load.
		await dialog.getByRole("button", { name: "Play video" }).click();
		await expect(dialog.locator("iframe")).toHaveCount(1);
		await expect
			.poll(() => page.frames().some((f) => /cloudflarestream\.com/.test(f.url())))
			.toBe(true);
		await page
			.frames()
			.find((f) => /cloudflarestream\.com/.test(f.url()))!
			.waitForLoadState("load");
		const lengthBefore = await page.evaluate(() => history.length);

		await dialog.getByRole("button", { name: /Next voice/ }).click();
		await expect(dialog).toContainText(ordered[1]!.firstName);
		if (ordered.length >= 3) {
			await dialog.getByRole("button", { name: /Next voice/ }).click();
			await expect(dialog).toContainText(ordered[2]!.firstName);
		}

		// The swaps were history-neutral: replaceState only, no iframe entries.
		expect(await page.evaluate(() => history.length)).toBe(lengthBefore);

		// One close click unwinds the single pushed entry back to the squad.
		await dialog.getByRole("button", { name: "Close" }).click();
		await expect(page).toHaveURL(/\/squad\/?$/);
		await expect(dialog).toBeHidden();
	});
});
