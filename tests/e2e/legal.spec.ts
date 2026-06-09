/**
 * Legal pages — Privacy / Terms / Accessibility (DEV-82).
 *
 * Each page is near-static prose. The guarantees that matter: it renders
 * with a single page <h1>, shows its "Last updated" line, passes the
 * axe-core WCAG 2.1 A/AA gate, the footer links resolve to it, and a
 * non-English locale falls back to English content (rendered ltr).
 *
 * Width is asserted geometrically (boundingBox), not by screenshot diff
 * — same approach as letter-rail.spec.ts.
 */

import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

const PAGES = [
	{ slug: "privacy", path: "/privacy", title: "Privacy Notice" },
	{ slug: "terms", path: "/terms", title: "Terms of Use" },
	{ slug: "accessibility", path: "/accessibility", title: "Accessibility Statement" },
] as const;

for (const { slug, path, title } of PAGES) {
	test.describe(`${slug} page`, () => {
		test("renders a single page <h1> carrying the document title", async ({ page }) => {
			await page.goto(path);
			const h1 = page.getByRole("heading", { level: 1 });
			await expect(h1).toHaveCount(1);
			await expect(h1).toHaveText(title);
		});

		test("shows the 'Last updated' line", async ({ page }) => {
			await page.goto(path);
			await expect(page.getByText(/Last updated:/)).toBeVisible();
		});

		test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
			await page.goto(path);
			await runAxe(page);
		});

		test("constrains the prose column on desktop", async ({ page }) => {
			test.skip(
				test.info().project.name === "chromium-mobile",
				"Width constraint is a desktop-layout assertion.",
			);
			await page.goto(path);
			const box = await page.locator("[data-legal-prose]").boundingBox();
			expect(box).not.toBeNull();
			// max-w-[720px] + px-6 (24px each side) → never wider than ~768px.
			expect(box!.width).toBeLessThanOrEqual(770);
		});
	});
}

test.describe("legal footer wiring", () => {
	test("footer meta links resolve to the three legal routes", async ({ page }) => {
		await page.goto("/privacy");
		const footer = page.getByRole("contentinfo");
		for (const [name, href] of [
			["Privacy", "/privacy"],
			["Terms", "/terms"],
			["Accessibility", "/accessibility"],
		] as const) {
			await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
		}
	});
});

test.describe("locale fallback", () => {
	test("an Arabic route serves English content rendered left-to-right", async ({ page }) => {
		await page.goto("/ar/privacy");
		// The document reflects the *loaded* content (English) — not the
		// requested locale — so the fallback renders ltr, lang=en.
		await expect(page.locator("html")).toHaveAttribute("lang", "en");
		await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
		// English prose is present.
		await expect(
			page.getByRole("heading", { level: 2, name: "About Own Your Game" }),
		).toBeVisible();
	});
});
