import { expect, test, type Locator, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * i18n suite (DEV-72) — the footer language switcher and its
 * path/query-preserving navigation.
 *
 * Routing (per-locale URLs, `html lang`) is covered by
 * `i18n-routing.spec.ts` and RTL layout by `rtl.spec.ts`; this suite
 * focuses on the switcher behaviour DEV-72 wires up, plus a clean axe
 * pass on every locale's homepage (the issue's explicit AC).
 */

const HOME = { en: "/", es: "/es/", fr: "/fr/", ar: "/ar/", pt: "/pt/" } as const;
const NATIVE = { en: "English", es: "Español", fr: "Français", ar: "العربية", pt: "Português" };

/**
 * Open a Radix Popover by clicking its (closed) trigger, retrying until
 * the dialog appears. The triggers hydrate `client:idle`; under parallel
 * load on webkit / chromium-mobile that can lag, so the first click may
 * land on un-hydrated SSR HTML and be lost. We only click the *closed*
 * trigger (`expanded: false`), so a retry never toggles an open menu.
 */
async function openPopover(trigger: Locator, page: Page): Promise<void> {
	await expect(async () => {
		if (await trigger.count()) await trigger.click();
		await expect(page.getByRole("dialog")).toBeVisible({ timeout: 500 });
	}).toPass({ timeout: 15_000 });
}

/** Open the footer switcher and pick `target` by its native name. */
async function switchTo(page: Page, from: string, target: string): Promise<void> {
	const trigger = page
		.getByRole("contentinfo")
		.getByRole("button", { name: from, expanded: false });
	await openPopover(trigger, page);
	await page.getByRole("dialog").getByRole("button", { name: target }).click();
}

// Full-URL-anchored so `/letter` never matches `/es/letter` and vice versa.
const url = (path: string): RegExp =>
	new RegExp(`^https?://[^/]+${path.replace(/[.?]/g, "\\$&")}$`);

test.describe("language switcher", () => {
	test("the trigger shows the current language's native name", async ({ page }) => {
		for (const [code, path] of Object.entries(HOME)) {
			await page.goto(path);
			await expect(
				page
					.getByRole("contentinfo")
					.getByRole("button", { name: NATIVE[code as keyof typeof NATIVE], expanded: false }),
			).toBeVisible();
		}
	});

	test("navigates to the chosen locale", async ({ page }) => {
		await page.goto("/");
		await switchTo(page, "English", "Español");
		await expect(page).toHaveURL(/^https?:\/\/[^/]+\/es\/?$/);
		await expect(page.locator("html")).toHaveAttribute("lang", "es");
	});

	test("preserves the path when switching", async ({ page }) => {
		await page.goto("/letter");
		await switchTo(page, "English", "Español");
		await expect(page).toHaveURL(url("/es/letter"));
	});

	test("preserves the query string when switching", async ({ page }) => {
		await page.goto("/squad?country=KE");
		await switchTo(page, "English", "Español");
		await expect(page).toHaveURL(url("/es/squad?country=KE"));
	});

	test("drops the prefix when switching back to English", async ({ page }) => {
		await page.goto("/es/letter");
		await switchTo(page, "Español", "English");
		await expect(page).toHaveURL(url("/letter"));
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
	});
});

test.describe("Arabic squad filters work under RTL", () => {
	test("a filter dropdown opens on /ar/squad", async ({ page }) => {
		await page.goto("/ar/squad");
		await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
		// The four filter chips are Radix Popover triggers (aria-expanded);
		// the "Reset" link is not. Opening the first proves the dropdown
		// works in the RTL layout.
		const chip = page.getByRole("main").getByRole("button", { expanded: false }).first();
		await openPopover(chip, page);
		await expect(page.getByRole("dialog")).toBeVisible();
	});
});

test.describe("accessibility per locale", () => {
	for (const [code, path] of Object.entries(HOME)) {
		test(`${code} homepage has no axe violations`, async ({ page }) => {
			await page.goto(path);
			await runAxe(page);
		});
	}
});
