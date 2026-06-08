import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * E2E for the 404 and 500 error pages (DEV-83).
 *
 * The 404 is reached two ways: the special `/404` route and — the path
 * that matters in production — any unmatched URL, which `astro preview`
 * (and Cloudflare Pages) serves the custom `404.html` for. Copy is
 * asserted against the English source strings; the localised routes fall
 * back to English until UNICEF supplies translations, so `/es/404` shows
 * the same heading (we assert it renders, not that it's Spanish).
 */

test.describe("404 page", () => {
	test("an unknown URL serves the custom 404, not a platform default", async ({ page }) => {
		const response = await page.goto("/this-route-does-not-exist");
		// Custom 404 still returns a 404 status code…
		expect(response?.status()).toBe(404);
		// …while rendering our branded page.
		await expect(page.getByText("404 — Page not found")).toBeVisible();
		await expect(
			page.getByRole("heading", { level: 1, name: "We can’t find that one." }),
		).toBeVisible();
	});

	test("renders the three CTAs pointing at letter, home and squad", async ({ page }) => {
		await page.goto("/404");
		// Scope to <main> — the footer carries its own "Read the letter" link.
		const main = page.locator("main");
		const letter = main.getByRole("link", { name: "Read the letter" });
		const home = main.getByRole("link", { name: "Meet the team" });
		const squad = main.getByRole("link", { name: "Browse all voices" });
		await expect(letter).toHaveAttribute("href", "/letter");
		await expect(home).toHaveAttribute("href", "/");
		await expect(squad).toHaveAttribute("href", "/squad");
	});

	test("is marked noindex", async ({ page }) => {
		await page.goto("/404");
		await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex");
	});

	test("has a localised route that renders", async ({ page }) => {
		await page.goto("/es/404");
		// English fallback copy until translated, but the route must exist.
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.locator("html")).toHaveAttribute("lang", "es");
	});

	test("is accessible", async ({ page }) => {
		await page.goto("/404");
		await runAxe(page);
	});
});

test.describe("500 page", () => {
	test("renders the branded server-error page", async ({ page }) => {
		await page.goto("/500");
		await expect(page.getByText("500 — Something went wrong")).toBeVisible();
		await expect(page.getByRole("heading", { level: 1, name: "We hit a snag." })).toBeVisible();
	});

	test("the refresh control is a plain button and reloads the page", async ({ page }) => {
		await page.goto("/500");
		const refresh = page.getByRole("button", { name: "Refresh the page" });
		await expect(refresh).toBeVisible();

		// Prove the inline script wired location.reload() — stamp the window,
		// click, and confirm the stamp is gone after the reload.
		await page.evaluate(() => ((window as unknown as { __kept: boolean }).__kept = true));
		await refresh.click();
		await page.waitForLoadState("load");
		const kept = await page.evaluate(
			() => (window as unknown as { __kept?: boolean }).__kept ?? false,
		);
		expect(kept).toBe(false);
	});

	test("offers a home CTA and is marked noindex", async ({ page }) => {
		await page.goto("/500");
		await expect(page.getByRole("link", { name: "Go to the home page" })).toHaveAttribute(
			"href",
			"/",
		);
		await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex");
	});

	test("is accessible", async ({ page }) => {
		await page.goto("/500");
		await runAxe(page);
	});
});
