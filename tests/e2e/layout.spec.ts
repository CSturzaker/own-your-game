import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Coverage for `src/layouts/BaseLayout.astro` via the dedicated demo
 * page. The acceptance criteria focus on the keyboard skip-link
 * journey (the page's first focusable element) and the axe-core gate.
 *
 * Real per-page a11y journeys land with the pages they belong to;
 * this spec is anchored on the layout itself so a regression in head
 * or skip-link wiring is caught even before any feature page exists.
 */
test.describe("base layout demo", () => {
	test("emits noindex, the campaign title suffix, and a description", async ({ page }) => {
		await page.goto("/demo/layout");
		await expect(page).toHaveTitle(/· Own Your Game$/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
		await expect(page.locator('meta[name="description"]')).toHaveAttribute(
			"content",
			/young people/i,
		);
		await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
	});

	test("skip link is visible only when focused and lands on #main", async ({ page }) => {
		await page.goto("/demo/layout");
		const skipLink = page.getByRole("link", { name: "Skip to content" });

		// Hidden by default — `sr-only` collapses the link to a 1px clip
		// rect so it doesn't take up layout space until focused.
		const initialBox = await skipLink.boundingBox();
		expect(initialBox?.width ?? 0).toBeLessThan(4);

		// Focus the link directly. We can't rely on `Tab` here because
		// WebKit and mobile contexts don't traverse hyperlinks on Tab
		// without OS-level "Full Keyboard Access" enabled — which we
		// don't control in Playwright. Programmatic focus is still a
		// faithful test of the actual UX: the user reaches this link
		// with their keyboard and the styling must reveal it.
		await skipLink.focus();
		await expect(skipLink).toBeFocused();

		const focusedBox = await skipLink.boundingBox();
		expect(focusedBox?.width ?? 0).toBeGreaterThan(40);

		// Activating the link moves the URL hash and brings #main into
		// view. Dispatch the click programmatically so the assertion is
		// not sensitive to viewport-pointer plumbing differences across
		// the three Playwright projects.
		await skipLink.evaluate((el) => (el as HTMLAnchorElement).click());
		await expect(page).toHaveURL(/#main$/);
		await expect(page.locator("main#main")).toBeInViewport();
	});

	test("loads the self-hosted Space Grotesk + Noto Sans variable faces", async ({ page }) => {
		await page.goto("/demo/layout");
		// `document.fonts.ready` resolves once the in-use weights have
		// loaded. Faces only appear on `document.fonts` once they've
		// actually loaded glyphs, so this is a real "fonts loaded" check,
		// not just "the @font-face is declared". Self-hosted via
		// @fontsource-variable (DEV-75) — the family names carry the
		// "Variable" suffix the package uses.
		await page.evaluate(() => document.fonts.ready);
		const families = await page.evaluate(() => {
			const seen = new Set<string>();
			// WebKit reports `face.family` with the original CSS quoting
			// (e.g. `'"Space Grotesk Variable"'`); Chromium strips it.
			// Normalise both before returning so the spec is browser-portable.
			for (const face of document.fonts) seen.add(face.family.replace(/^["']|["']$/g, ""));
			return [...seen];
		});
		expect(families).toEqual(
			expect.arrayContaining(["Space Grotesk Variable", "Noto Sans Variable"]),
		);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/layout");
		await runAxe(page);
	});
});
