import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 720 } as const;

test.describe("why this letter band demo", () => {
	test("renders the kicker, heading, and both paragraphs", async ({ page }) => {
		await page.goto("/demo/why-this");
		await expect(page.getByText("Why this letter").first()).toBeVisible();
		await expect(
			page.getByRole("heading", { name: "The biggest stage. The youngest authors." }),
		).toBeVisible();
		await expect(page.getByText(/Every four years/)).toBeVisible();
		await expect(page.getByText(/young people across \d+ countries/)).toBeVisible();
	});

	test("the about link points at /about", async ({ page }) => {
		await page.goto("/demo/why-this");
		const link = page.getByRole("link", { name: /Read more about the project/ });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute("href", "/about");
	});

	test("desktop layout is a two-column grid", async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/demo/why-this");
		const band = page.locator("section.bg-paper-2").first();
		const cols = await band.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		expect(cols.split(" ").filter(Boolean)).toHaveLength(2);
	});

	test("mobile layout stacks to a single column (flex, no grid tracks)", async ({ page }) => {
		await page.setViewportSize(MOBILE_VIEWPORT);
		await page.goto("/demo/why-this");
		const band = page.locator("section.bg-paper-2").first();
		const display = await band.evaluate((el) => getComputedStyle(el).display);
		expect(display).toBe("flex");
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/why-this");
		await runAxe(page);
	});
});

test.describe("why this letter band · home integration", () => {
	test("the band's counts match the header voice counter", async ({ page }) => {
		await page.goto("/");
		// Paragraph 2 leads with the same voice count the header pill
		// shows — both read getVoiceCount() at build time.
		const counter = page.locator("[aria-live='polite']").first();
		const counterText = (await counter.textContent()) ?? "";
		const countMatch = counterText.match(/([\d,]+)/);
		expect(countMatch, "header counter should contain a number").toBeTruthy();
		const count = countMatch![1]!;

		const band = page.getByText(/young people across \d+ countries/);
		await expect(band).toContainText(`${count} young people`);
	});
});
