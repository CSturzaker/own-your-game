import { expect, test, type Locator, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Mobile nav drawer (DEV-103).
 *
 * The header hides the inline nav below `lg`, so the hamburger is the only
 * cross-page navigation on mobile. Runs on the mobile project only — the
 * trigger is `lg:hidden`. The drawer is a `client:idle` island, so each test
 * waits for hydration before interacting.
 *
 * The trigger is located by its Radix role hook (`aria-haspopup="dialog"`)
 * rather than its accessible name, so the same locator works across locales
 * (the name is translated) and regardless of open/closed state.
 */

/** The hamburger — language-agnostic, state-agnostic. */
function trigger(page: Page): Locator {
	return page.locator('header button[aria-haspopup="dialog"]');
}

/** Resolve once the header's `client:idle` MobileNav island has hydrated. */
async function waitForHydration(page: Page): Promise<void> {
	await trigger(page).waitFor();
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
					.requestIdleCallback;
				if (typeof idle === "function") idle(() => resolve());
				else setTimeout(resolve, 150);
			}),
	);
}

test.describe("mobile nav drawer", () => {
	test.skip(({ viewport }) => !viewport || viewport.width >= 1024, "Mobile viewport only.");

	test("opens from the hamburger and exposes the nav links", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);

		const hamburger = trigger(page);
		await expect(hamburger).toHaveAttribute("aria-expanded", "false");
		await hamburger.click();

		const drawer = page.getByRole("dialog");
		await expect(drawer).toBeVisible();
		await expect(hamburger).toHaveAttribute("aria-expanded", "true");
		// aria-controls points at the panel.
		const controls = await hamburger.getAttribute("aria-controls");
		expect(controls).toBeTruthy();
		// Attribute selector, not `#id` — Radix ids contain colons.
		await expect(page.locator(`[id="${controls}"]`)).toBeVisible();

		const nav = drawer.getByRole("navigation");
		await expect(nav.getByRole("link", { name: "The Letter" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "The Squad" })).toBeVisible();
		await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
	});

	test("marks the current page as active", async ({ page }) => {
		await page.goto("/squad");
		await waitForHydration(page);
		await trigger(page).click();

		const squad = page.getByRole("dialog").getByRole("link", { name: "The Squad" });
		await expect(squad).toHaveAttribute("aria-current", "page");
	});

	test("a nav link navigates and the drawer is gone", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);
		await trigger(page).click();

		await page.getByRole("dialog").getByRole("link", { name: "The Letter" }).click();
		await page.waitForURL("**/letter");
		await expect(page.getByRole("dialog")).toHaveCount(0);
	});

	test("Escape closes and restores focus to the hamburger", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);
		const hamburger = trigger(page);
		await hamburger.click();
		await expect(page.getByRole("dialog")).toBeVisible();

		await page.keyboard.press("Escape");

		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect(hamburger).toBeFocused();
	});

	test("the close button dismisses the drawer", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);
		await trigger(page).click();

		await page.getByRole("dialog").getByRole("button", { name: "Close menu" }).click();
		await expect(page.getByRole("dialog")).toHaveCount(0);
	});

	test("the drawer Share control copies the canonical campaign URL", async ({ page }, testInfo) => {
		// Spy on writeText (chromium only — WebKit freezes the clipboard)
		// and remove navigator.share so the control takes the copy fallback.
		test.skip(!testInfo.project.name.startsWith("chromium"), "clipboard spy: chromium only");
		await page.addInitScript(() => {
			const w = window as unknown as { __copied: string[] };
			w.__copied = [];
			if (navigator.clipboard) {
				navigator.clipboard.writeText = (text: string) => {
					w.__copied.push(String(text));
					return Promise.resolve();
				};
			}
			Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
		});
		await page.goto("/");
		await waitForHydration(page);
		await trigger(page).click();

		await page.getByRole("dialog").getByRole("button", { name: "Share" }).click();

		await expect
			.poll(() => page.evaluate(() => (window as unknown as { __copied: string[] }).__copied))
			.toContain("https://own-your-game.org/");
	});

	test("the drawer Share copies via the legacy fallback in a non-secure context", async ({
		page,
	}, testInfo) => {
		// Repro of the reported bug: a phone hitting the dev server over a
		// LAN http IP has neither navigator.share nor navigator.clipboard,
		// so the control must fall back to execCommand and still confirm.
		test.skip(!testInfo.project.name.startsWith("chromium"), "chromium only");
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
			Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
			document.execCommand = () => true;
		});
		await page.goto("/");
		await waitForHydration(page);
		await trigger(page).click();

		await page.getByRole("dialog").getByRole("button", { name: "Share" }).click();

		await expect(page.getByRole("dialog").getByRole("button", { name: "Copied!" })).toBeVisible();
	});

	test("the open drawer is axe-clean", async ({ page }) => {
		await page.goto("/");
		await waitForHydration(page);
		await trigger(page).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await runAxe(page);
	});

	test("works on the Arabic (RTL) route", async ({ page }) => {
		await page.goto("/ar/");
		await waitForHydration(page);
		await trigger(page).click();

		const drawer = page.getByRole("dialog");
		await expect(drawer).toBeVisible();
		// Panel pins to the inline-end edge, which is the left under RTL.
		const box = await drawer.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.x).toBeLessThan(50);
	});
});
