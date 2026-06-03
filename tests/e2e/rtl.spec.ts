import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * RTL layout suite (DEV-71) — Arabic reads right-to-left.
 *
 * `dir="rtl"` on <html> cascades to the whole tree, so Tailwind's logical
 * utilities (ps-/pe-/ms-/me-/inset-s-/inset-e-) and the `rtl:` variant
 * flip horizontal layout automatically. Rather than pixel-diff
 * screenshots (which need brittle per-browser baselines), these tests
 * assert the *mirroring* directly — the chrome flips to the right, the
 * drop cap floats right — plus a clean axe pass on every Arabic page.
 */

const DESKTOP = { width: 1440, height: 900 } as const;
const AR_PAGES = ["/ar/", "/ar/letter", "/ar/squad", "/ar/about"] as const;

test.describe("direction attribute", () => {
	for (const path of AR_PAGES) {
		test(`${path} sets html dir=rtl lang=ar`, async ({ page }) => {
			await page.goto(path);
			await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
			await expect(page.locator("html")).toHaveAttribute("lang", "ar");
		});
	}

	for (const path of ["/", "/es/", "/fr/letter"]) {
		test(`${path} stays dir=ltr`, async ({ page }) => {
			await page.goto(path);
			await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
		});
	}
});

test.describe("layout mirrors under RTL", () => {
	test("the header wordmark moves to the right", async ({ page }) => {
		await page.setViewportSize(DESKTOP);
		const wordmark = () =>
			page.getByRole("banner").getByRole("img", { name: "Own Your Game" }).first();

		// LTR: the wordmark leads on the left.
		await page.goto("/");
		const ltr = await wordmark().boundingBox();
		expect(ltr!.x).toBeLessThan(DESKTOP.width / 2);

		// RTL: the header flex reverses, so the wordmark leads on the right.
		await page.goto("/ar/");
		const rtl = await wordmark().boundingBox();
		expect(rtl!.x).toBeGreaterThan(DESKTOP.width / 2);
	});

	test("the letter drop cap floats to the right (trailing edge)", async ({ page }) => {
		await page.setViewportSize(DESKTOP);
		await page.goto("/ar/letter");
		// `float-start` floats the cap to the inline-start — the right under
		// RTL — so its centre sits right of its paragraph's centre.
		const cap = page.locator(".float-start").first();
		const capBox = await cap.boundingBox();
		const paraBox = await cap.locator("xpath=..").boundingBox();
		expect(capBox).not.toBeNull();
		expect(capBox!.x + capBox!.width / 2).toBeGreaterThan(paraBox!.x + paraBox!.width / 2);
	});

	test("the letter waypoint rail moves to the left gutter", async ({ page }) => {
		await page.setViewportSize(DESKTOP);
		await page.goto("/ar/letter");
		// The rail container is absolutely positioned at the inline-end,
		// which is the left side under RTL — its centre is left of the page
		// centre. (Desktop-only; it's hidden below lg.)
		const rail = page.locator("nav").nth(1); // [0] is the header nav
		const box = await rail.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.x + box!.width / 2).toBeLessThan(DESKTOP.width / 2);
	});
});

test.describe("accessibility under RTL", () => {
	for (const path of AR_PAGES) {
		test(`${path} has no axe violations`, async ({ page }) => {
			await page.goto(path);
			await runAxe(page);
		});
	}
});
