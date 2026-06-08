import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

const PRIMARY_NAV_PATHS = ["/", "/letter", "/squad", "/about"] as const;
const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;

/**
 * The Header renders desktop and mobile chrome via responsive
 * Tailwind utilities, so cross-viewport coverage matters. The
 * `desktop` describe forces a wide viewport even when running
 * inside the `chromium-mobile` Playwright project so the assertions
 * are about the component, not the project's default device frame.
 */
test.describe("header demo · desktop chrome", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/demo/header");
	});

	test("exposes the four primary nav links pointing at the public URLs", async ({ page }) => {
		const nav = page.getByRole("navigation", { name: "Primary" }).first();
		await expect(nav).toBeVisible();
		const links = nav.getByRole("link");
		await expect(links).toHaveCount(PRIMARY_NAV_PATHS.length);
		for (let i = 0; i < PRIMARY_NAV_PATHS.length; i++) {
			await expect(links.nth(i)).toHaveAttribute("href", PRIMARY_NAV_PATHS[i]!);
		}
	});

	test("active nav item announces page state to assistive tech", async ({ page }) => {
		const nav = page.getByRole("navigation", { name: "Primary" }).first();
		await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
		await expect(nav.getByRole("link", { name: "The Letter" })).not.toHaveAttribute(
			"aria-current",
			/.+/,
		);
	});

	test("Share CTA is reachable and the hamburger button is hidden", async ({ page }) => {
		await expect(page.getByRole("button", { name: /Share/ }).first()).toBeVisible();
		await expect(page.getByRole("button", { name: "Open menu" }).first()).not.toBeVisible();
	});

	test("sticky state engages once the page is scrolled", async ({ page }) => {
		const header = page.locator("[data-sticky-trigger]").first();
		await expect(header).not.toHaveAttribute("data-sticky", /.*/);
		await page.evaluate(() => window.scrollTo(0, 200));
		await expect(header).toHaveAttribute("data-sticky", "");
	});

	test("keyboard tab order goes skip → wordmark → nav links → Share CTA", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === "webkit",
			"WebKit only traverses links on Tab with OS-level 'Full Keyboard Access' on — Playwright can't enable that.",
		);

		await page.keyboard.press("Tab");
		await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

		await page.keyboard.press("Tab");
		await expect(page.getByRole("link", { name: "Own Your Game — home" }).first()).toBeFocused();

		for (const label of ["Home", "The Letter", "The Squad", "About"]) {
			await page.keyboard.press("Tab");
			await expect(
				page
					.getByRole("navigation", { name: "Primary" })
					.first()
					.getByRole("link", { name: label }),
			).toBeFocused();
		}

		await page.keyboard.press("Tab");
		await expect(page.getByRole("button", { name: /Share/ }).first()).toBeFocused();
	});
});

test.describe("header demo · mobile chrome", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 720 });
		await page.goto("/demo/header");
	});

	test("collapses the nav and Share CTA, exposing a hamburger button", async ({ page }) => {
		await expect(page.getByRole("navigation", { name: "Primary" }).first()).not.toBeVisible();
		await expect(page.getByRole("button", { name: "Open menu" }).first()).toBeVisible();
		await expect(page.getByRole("button", { name: /Share/ }).first()).not.toBeVisible();
	});
});

test.describe("header demo · share", () => {
	test("Share copies the canonical campaign URL when native share is unavailable", async ({
		page,
	}, testInfo) => {
		// Reading the real clipboard in headless is unreliable, so spy on
		// writeText (chromium only — WebKit freezes navigator.clipboard).
		// Also force the copy-link fallback by removing navigator.share,
		// which desktop chromium otherwise exposes.
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
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/demo/header");

		await page.getByRole("button", { name: /Share/ }).first().click();

		await expect
			.poll(() => page.evaluate(() => (window as unknown as { __copied: string[] }).__copied))
			.toContain("https://ownyourgame.org/");
	});
});

test.describe("header demo · shared behaviour", () => {
	test("voice counter renders count, label, and a polite atomic live region", async ({ page }) => {
		await page.goto("/demo/header");
		const counter = page.locator("[aria-live='polite']").first();
		await expect(counter).toContainText("247");
		await expect(counter).toContainText("voices and counting");
		await expect(counter).toHaveAttribute("aria-atomic", "true");
		await expect(counter.locator("[data-pulse]")).toHaveCount(1);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/header");
		await runAxe(page);
	});
});
