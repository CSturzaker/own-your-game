import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * i18n routing suite (DEV-69) — the per-language URL prefix structure.
 *
 * Covers what's true the moment routing lands, before any UI strings
 * are translated (DEV-70) or RTL layout is applied (DEV-71): every
 * page resolves at its localised URL, the `html lang` attribute tracks
 * the route, and the shared chrome's internal links carry the locale
 * prefix. Content is still English on every locale at this stage —
 * these assertions are about *routing*, not translation.
 *
 * The language switcher's navigation behaviour and the full
 * source × target path-preservation matrix are DEV-72's `i18n.spec.ts`.
 */

const PAGES = ["/", "/letter", "/squad", "/about"] as const;
const NON_DEFAULT = ["es", "fr", "ar", "pt"] as const;

// The primary header nav is desktop-only (`hidden lg:flex`); the mobile
// drawer is deferred. Tests that assert on nav links pin a desktop
// viewport so they hold under the mobile browser project too.
const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;

test.describe("default locale (English, unprefixed)", () => {
	test("the home page declares lang=en", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
	});

	test("internal chrome links stay unprefixed", async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/");
		// Header nav points at the bare English routes. Scope to the
		// header so the hero/footer CTAs ("Read the letter") don't match.
		const nav = page.getByRole("banner");
		await expect(nav.getByRole("link", { name: "The Letter", exact: true })).toHaveAttribute(
			"href",
			"/letter",
		);
		await expect(nav.getByRole("link", { name: "The Squad", exact: true })).toHaveAttribute(
			"href",
			"/squad",
		);
	});
});

test.describe("localised routes", () => {
	for (const locale of NON_DEFAULT) {
		test(`every page renders under /${locale}/ with lang=${locale}`, async ({ page }) => {
			for (const path of PAGES) {
				const url = path === "/" ? `/${locale}/` : `/${locale}${path}`;
				const response = await page.goto(url);
				expect(response?.status(), `${url} should resolve`).toBeLessThan(400);
				await expect(page.locator("html")).toHaveAttribute("lang", locale);
				// The header is present, i.e. the real page rendered (not an
				// empty fallback shell).
				await expect(page.getByRole("banner")).toBeVisible();
			}
		});
	}

	test("nav links carry the active locale prefix", async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/es/");
		const nav = page.getByRole("banner");
		await expect(nav.getByRole("link", { name: "The Letter", exact: true })).toHaveAttribute(
			"href",
			"/es/letter",
		);
		await expect(nav.getByRole("link", { name: "The Squad", exact: true })).toHaveAttribute(
			"href",
			"/es/squad",
		);
	});

	test("the wordmark home link is localised", async ({ page }) => {
		await page.goto("/fr/letter");
		// The header wordmark links home; on /fr it must point at /fr.
		const home = page.getByRole("banner").getByRole("link", { name: /own your game/i });
		await expect(home.first()).toHaveAttribute("href", "/fr");
	});

	test("footer internal links are localised and preserve hashes; external links are untouched", async ({
		page,
	}) => {
		await page.goto("/es/squad");
		const footer = page.getByRole("contentinfo");
		await expect(footer.getByRole("link", { name: "By country" })).toHaveAttribute(
			"href",
			"/es/squad#by-country",
		);
		// The external partner link is never rewritten with a locale prefix.
		await expect(footer.getByRole("link", { name: /fix my food/i })).toHaveAttribute(
			"href",
			"https://www.unicef.org/take-action/campaign/fix-my-food",
		);
	});

	test("the Spanish letter loads content/letter/es.md", async ({ page }) => {
		// The es stub still carries English body copy until translated, but
		// it is a distinct file — proving the route reads the locale's
		// markdown rather than always serving en.md. The salutation comes
		// from es.md's frontmatter.
		await page.goto("/es/letter");
		await expect(page.getByRole("main")).toContainText("Dear FIFA,");
	});
});

test.describe("accessibility per locale", () => {
	test("the Spanish home page has no axe violations", async ({ page }) => {
		await page.goto("/es/");
		await runAxe(page);
	});

	test("the Arabic home page has no axe violations", async ({ page }) => {
		await page.goto("/ar/");
		await runAxe(page);
	});
});
