import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Whole-page assertions for the atomic primitives. Variant-class
 * resolution is unit-tested via Vitest; this spec pins the rendered
 * DOM, polymorphic element choice, and a11y posture on a real render.
 */
test.describe("primitives demo", () => {
	test("Button without href renders as <button type='button'>", async ({ page }) => {
		await page.goto("/demo/primitives");
		const primary = page.getByRole("button", { name: "Primary" });
		await expect(primary).toBeVisible();
		await expect(primary).toHaveAttribute("type", "button");
	});

	test("Button with href renders as an anchor", async ({ page }) => {
		await page.goto("/demo/primitives");
		const squad = page.getByRole("link", { name: /Meet the squad/ });
		await expect(squad).toBeVisible();
		await expect(squad).toHaveAttribute("href", "/squad");
	});

	test("disabled button surfaces the disabled state to AT", async ({ page }) => {
		await page.goto("/demo/primitives");
		const disabled = page.getByRole("button", { name: "Disabled" });
		await expect(disabled).toBeDisabled();
	});

	test("Tag emits the theme background class for each filled theme", async ({ page }) => {
		await page.goto("/demo/primitives");
		for (const theme of [
			"fairness",
			"belonging",
			"friendship",
			"confidence",
			"family",
			"community",
		] as const) {
			const tag = page.getByText(theme, { exact: true }).first();
			await expect(tag).toHaveClass(new RegExp(`(^|\\s)bg-${theme}(\\s|$)`));
		}
	});

	test("Chip active state uses the amber-50 fill and brand-orange border", async ({ page }) => {
		await page.goto("/demo/primitives");
		const active = page.getByRole("button", { name: /Active filter/ });
		await expect(active).toHaveClass(/(^|\s)bg-amber-50(\s|$)/);
		await expect(active).toHaveClass(/(^|\s)border-brand-orange(\s|$)/);
	});

	test("Kicker renders with the uppercase eyebrow treatment", async ({ page }) => {
		await page.goto("/demo/primitives");
		const kicker = page.getByText("An open letter · 2026 World Cup");
		await expect(kicker).toBeVisible();
		await expect(kicker).toHaveClass(/(^|\s)uppercase(\s|$)/);
	});

	test("Tagline applies the consumer-supplied font size as inline style", async ({ page }) => {
		await page.goto("/demo/primitives");
		const tagline = page.getByText("Whose game is it anyway?");
		await expect(tagline).toHaveAttribute("style", /font-size:\s*40px/);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/primitives");
		await runAxe(page);
	});
});
