import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Behavioural e2e for the LetterRail island (DEV-52). The rail is
 * desktop-only (≥1025px); the desktop-behaviour blocks skip on the
 * mobile project, where the rail is `display:none` (and so absent from
 * the accessibility tree).
 *
 * The rail hydrates `client:idle`, so anything depending on React event
 * handlers waits for an idle callback first — same pattern as
 * `rotation.spec.ts`.
 */

const RAIL = 'nav[aria-label="Letter sections"]';
const isMobile = ({ viewport }: { viewport: { width: number; height: number } | null }) =>
	(viewport?.width ?? 0) < 1025;

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

/** Top of a waypoint anchor relative to the viewport. */
function anchorTop(page: Page, id: string): Promise<number> {
	return page.evaluate(
		(wid) => Math.round(document.getElementById(`waypoint-${wid}`)!.getBoundingClientRect().top),
		id,
	);
}

test.describe("letter rail", () => {
	test("rail visibility follows the desktop breakpoint", async ({ page, viewport }) => {
		await page.goto("/letter");
		const rail = page.locator(RAIL);
		// The rail is server-rendered into the DOM either way; it's only
		// shown ≥1025px via `hidden lg:block`.
		await expect(rail).toHaveCount(1);
		if ((viewport?.width ?? 0) >= 1025) await expect(rail).toBeVisible();
		else await expect(rail).toBeHidden();
	});

	test.describe("desktop behaviour", () => {
		test.skip(isMobile, "rail is desktop-only");

		test.beforeEach(async ({ page }) => {
			await page.goto("/letter");
			await waitForIslandHydration(page);
		});

		test("clicking a waypoint scrolls to it, updates the hash, and highlights it", async ({
			page,
		}) => {
			const ask = page.locator(RAIL).getByRole("link", { name: "The ask" });
			await ask.click();
			await expect(page).toHaveURL(/#ask$/);
			await expect(ask).toHaveAttribute("aria-current", "true");
			// The anchor clears the sticky header via its scroll-margin.
			await expect.poll(() => anchorTop(page, "ask")).toBeLessThan(160);
		});

		test("scroll-spy highlights the waypoint nearest the top as the reader scrolls", async ({
			page,
		}) => {
			await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
			await expect(page.locator(RAIL).getByRole("link", { name: "Sign-off" })).toHaveAttribute(
				"aria-current",
				"true",
			);

			await page.evaluate(() => window.scrollTo(0, 0));
			await expect(page.locator(RAIL).getByRole("link", { name: "Opening" })).toHaveAttribute(
				"aria-current",
				"true",
			);
		});

		test("a direct URL with a hash scrolls to that waypoint on load", async ({ page }) => {
			// Reduced motion → instant on-load scroll (WebKit headless
			// smooth-scroll is slow/flaky). Load via another page first so the
			// hashed URL is a full document load — a same-document hash change
			// (the beforeEach already loaded /letter) wouldn't re-run the
			// on-load scroll effect.
			await page.emulateMedia({ reducedMotion: "reduce" });
			await page.goto("/");
			await page.goto("/letter#ask");
			await waitForIslandHydration(page);
			await expect.poll(() => anchorTop(page, "ask"), { timeout: 8_000 }).toBeLessThan(200);
			await expect(page.locator(RAIL).getByRole("link", { name: "The ask" })).toHaveAttribute(
				"aria-current",
				"true",
			);
		});

		test("jump to top returns to the start and clears the hash", async ({ page }, testInfo) => {
			// Chromium-desktop only: under WebKit headless `history.replaceState`
			// doesn't drop the URL fragment and smooth-scroll-to-top is slow —
			// both harness quirks, not real-Safari bugs. Reduced motion makes
			// the scroll instant so the assertion is deterministic.
			test.skip(testInfo.project.name !== "chromium-desktop", "jump-to-top: chromium-desktop only");
			await page.emulateMedia({ reducedMotion: "reduce" });
			await page.goto("/letter");
			await waitForIslandHydration(page);

			await page.locator(RAIL).getByRole("link", { name: "The ask" }).click();
			await expect(page).toHaveURL(/#ask$/);

			await page
				.locator(RAIL)
				.getByRole("button", { name: /Jump to top/ })
				.click();
			await expect(page).toHaveURL(/\/letter$/);
			await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeLessThan(50);
		});

		test("the letter page is accessible with the rail present", async ({ page }) => {
			await runAxe(page);
		});
	});

	test.describe("desktop · reduced motion", () => {
		test.skip(isMobile, "rail is desktop-only");

		test.beforeEach(async ({ page }) => {
			await page.emulateMedia({ reducedMotion: "reduce" });
			await page.goto("/letter");
			await waitForIslandHydration(page);
		});

		test("clicking a waypoint still navigates (instant) and highlights it", async ({ page }) => {
			const ask = page.locator(RAIL).getByRole("link", { name: "The ask" });
			await ask.click();
			await expect(page).toHaveURL(/#ask$/);
			await expect(ask).toHaveAttribute("aria-current", "true");
			await expect.poll(() => anchorTop(page, "ask")).toBeLessThan(160);
		});
	});
});
