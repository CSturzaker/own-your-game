import { expect, test } from "@playwright/test";

/**
 * E2E for the launch SEO surface (DEV-81): robots.txt, the sitemap, and
 * the canonical / Open Graph / Twitter meta tags.
 *
 * Meta assertions use the production origin (`https://own-your-game.org`,
 * the configured `site`) — those URLs are baked at build time and are
 * independent of the test server's host.
 */

const SITE = "https://own-your-game.org";

test.describe("robots.txt", () => {
	test("is served at the root and points at the sitemap", async ({ page }) => {
		const res = await page.goto("/robots.txt");
		expect(res?.status()).toBe(200);
		const body = await res!.text();
		expect(body).toContain("Disallow: /demo/");
		expect(body).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
	});
});

test.describe("sitemap", () => {
	test("the index references the URL set", async ({ page }) => {
		const res = await page.goto("/sitemap-index.xml");
		expect(res?.status()).toBe(200);
		expect(await res!.text()).toContain("sitemap-0.xml");
	});

	test("lists localised pages with hreflang and excludes demo/error/data routes", async ({
		page,
	}) => {
		const res = await page.goto("/sitemap-0.xml");
		expect(res?.status()).toBe(200);
		const xml = await res!.text();
		// Pages, in English and a prefixed locale, with hreflang alternates.
		expect(xml).toContain(`<loc>${SITE}/letter/</loc>`);
		expect(xml).toContain(`${SITE}/es/letter/`);
		expect(xml).toContain('hreflang="es"');
		// Non-indexable / non-HTML routes must not appear.
		expect(xml).not.toContain("/demo/");
		expect(xml).not.toContain("/404");
		expect(xml).not.toContain("/500");
		expect(xml).not.toContain(".json");
	});
});

test.describe("canonical + social meta", () => {
	test("an English page carries canonical, og and twitter tags", async ({ page }) => {
		await page.goto("/letter");
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/letter/`);
		await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
			"content",
			`${SITE}/letter/`,
		);
		await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
			"content",
			"Own Your Game",
		);
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			`${SITE}/og/letter.png`,
		);
		await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_GB");
		await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(4);
		await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
			"content",
			"summary_large_image",
		);
		// No twitter:site until the campaign confirms a handle (DEV-81).
		await expect(page.locator('meta[name="twitter:site"]')).toHaveCount(0);
	});

	test("a localised page sets its own og:locale and canonical", async ({ page }) => {
		await page.goto("/es/letter");
		await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "es_ES");
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			`${SITE}/es/letter/`,
		);
	});

	test("og:image falls back to the default card on a page without its own", async ({ page }) => {
		// The 404 page passes no ogImage, so it resolves to /og/default.png.
		await page.goto("/404");
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			"content",
			`${SITE}/og/default.png`,
		);
	});
});
