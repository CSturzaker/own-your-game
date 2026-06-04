import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Focus-trap coverage for the Radix Dialog — the assertion the DEV-15
 * Vitest spec deferred to "a Playwright spec where focus is real", owed
 * once the player card epic touched the wrapper (DEV-44). Driven through
 * the desktop player-card modal on its demo page, which mounts the shell
 * from a fixture voice with a real trigger button.
 *
 * Covers: focus moves into the dialog on open (onto the close button),
 * Tab and Shift+Tab cycle within the content, Escape closes and returns
 * focus to the trigger, and axe is clean with the dialog open.
 */
test.describe("player card modal — focus management", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/demo/player-card");
	});

	test("opens onto the close button and is axe-clean", async ({ page }) => {
		await page.getByRole("button", { name: "Open player card" }).click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		// Initial focus lands on the close button (escape orientation).
		await expect(page.getByRole("button", { name: "Close" })).toBeFocused();

		await runAxe(page);
	});

	test("traps Tab focus within the dialog", async ({ page, browserName }) => {
		test.skip(
			browserName === "webkit",
			"WebKit needs OS-level Full Keyboard Access to Tab between controls.",
		);
		await page.getByRole("button", { name: "Open player card" }).click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(page.getByRole("button", { name: "Close" })).toBeFocused();

		// Tab forward through the focusable controls and confirm focus never
		// escapes the dialog (it cycles back to the close button).
		const focusInDialog = async () => dialog.evaluate((el) => el.contains(document.activeElement));

		for (let i = 0; i < 8; i++) {
			await page.keyboard.press("Tab");
			expect(await focusInDialog()).toBe(true);
		}

		// Shift+Tab walks backwards, still trapped.
		for (let i = 0; i < 8; i++) {
			await page.keyboard.press("Shift+Tab");
			expect(await focusInDialog()).toBe(true);
		}
	});

	test("Escape closes and returns focus to the trigger", async ({ page }) => {
		const trigger = page.getByRole("button", { name: "Open player card" });
		// Open via the keyboard (focus + Enter) — the meaningful flow for
		// focus return. WebKit/Safari deliberately don't focus a <button> on
		// click, so a mouse-opened modal has nothing to return focus to there.
		await trigger.focus();
		await page.keyboard.press("Enter");
		await expect(page.getByRole("dialog")).toBeVisible();

		await page.keyboard.press("Escape");

		await expect(page.getByRole("dialog")).toBeHidden();
		await expect(trigger).toBeFocused();
	});

	test("clicking the scrim closes the modal", async ({ page }) => {
		await page.getByRole("button", { name: "Open player card" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();

		// Click the overlay (top-left corner, away from the centred card).
		await page.mouse.click(8, 8);

		await expect(page.getByRole("dialog")).toBeHidden();
	});
});
