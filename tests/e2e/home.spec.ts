import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 720 } as const;

/**
 * Several primitive strings (the brand wordmark, "Read the letter")
 * appear in the footer chrome as well as the hero. Scoping
 * locators to `<main>` keeps hero assertions about the hero, not
 * about whatever the footer happens to also list.
 */
function hero(page: Page) {
	return page.getByRole("main");
}

test.describe("home page · shared behaviour", () => {
	test("loads with the expected document title", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle("Own Your Game");
	});

	test("hero shows the kicker, wordmark, tagline, and supporting copy", async ({ page }) => {
		await page.goto("/");
		// The kicker is rendered twice (mobile + desktop spans, each
		// hidden at the other breakpoint); assert via text presence
		// rather than visibility so this is one test for all viewports.
		await expect(hero(page)).toContainText("An open letter · 2026");
		await expect(hero(page).getByRole("img", { name: "Own Your Game" })).toBeVisible();
		// The starting-eleven supporting paragraph ends with "...whose game
		// is it anyway?" (lowercase) so it also matches case-insensitively;
		// use exact:true to scope to the Tagline.
		await expect(hero(page).getByText("Whose game is it anyway?", { exact: true })).toBeVisible();
		await expect(hero(page).getByText(/One open letter to FIFA/)).toBeVisible();
	});

	test("primary CTA navigates to the letter route", async ({ page }) => {
		await page.goto("/");
		const cta = hero(page).getByRole("link", { name: /Read the letter/ });
		await expect(cta).toBeVisible();
		await expect(cta).toHaveAttribute("href", "/letter");
	});

	test("ghost CTA shows the live voice count and links to the squad route", async ({ page }) => {
		await page.goto("/");
		const cta = hero(page).getByRole("link", { name: /Meet all \d/ });
		await expect(cta).toBeVisible();
		await expect(cta).toHaveAttribute("href", "/squad");
	});

	test("ghost CTA count matches the count in the header voice counter", async ({ page }) => {
		await page.goto("/");
		const cta = hero(page).getByRole("link", { name: /Meet all \d/ });
		const ctaText = (await cta.textContent()) ?? "";
		const ctaCount = ctaText.match(/Meet all ([\d,]+)/)?.[1];
		expect(ctaCount, "CTA should contain a count").toBeTruthy();

		const counter = page.locator("[aria-live='polite']").first();
		await expect(counter).toContainText(ctaCount!);
	});

	test("renders the voice counter card, the starting eleven, and the why-this stub", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page.locator("[data-voice-counter-card]")).toHaveCount(1);
		// Both the formation (desktop) and the 2-col grid (mobile) are
		// always in the DOM; CSS picks which is visible per viewport.
		await expect(page.locator("[data-eleven-formation]")).toHaveCount(1);
		await expect(page.locator("[data-eleven-mobile]")).toHaveCount(1);
		await expect(page.locator("[data-stub='why-this']")).toHaveCount(1);
	});

	test("voice counter card shows the live count and the label", async ({ page }) => {
		await page.goto("/");
		const card = page.locator("[data-voice-counter-card]");
		await expect(card).toContainText("The voice counter");
		// The card's number should equal the count rendered in the
		// "Meet all N" CTA — both come from the same loader.
		const cta = hero(page).getByRole("link", { name: /Meet all \d/ });
		const ctaCount = ((await cta.textContent()) ?? "").match(/Meet all ([\d,]+)/)?.[1];
		expect(ctaCount).toBeTruthy();
		await expect(card).toContainText(ctaCount!);
	});

	test("makes no video network requests — the home page must not load video", async ({ page }) => {
		const videoRequests: string[] = [];
		page.on("request", (req) => {
			const url = req.url();
			if (
				/\.(mp4|m3u8|webm|m4s|ts)(\?|$)/i.test(url) ||
				/cloudflarestream\.com/i.test(url) ||
				/videodelivery\.net/i.test(url)
			) {
				videoRequests.push(url);
			}
		});
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		expect(videoRequests, videoRequests.join("\n")).toEqual([]);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/");
		await runAxe(page);
	});
});

test.describe("home page · desktop layout", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/");
	});

	test("hero uses a two-column grid with the left column wider than the right", async ({
		page,
	}) => {
		const heroSection = page.locator("main section").first();
		const cols = await heroSection.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		const tracks = cols.split(" ").filter(Boolean);
		expect(tracks).toHaveLength(2);
		const [leftPx, rightPx] = tracks.map((t) => parseFloat(t));
		// 1.25fr / 1fr ⇒ left strictly wider than right.
		expect(leftPx).toBeGreaterThan(rightPx!);
	});
});

test.describe("home page · mobile layout", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(MOBILE_VIEWPORT);
		await page.goto("/");
	});

	test("hero stacks into a single column", async ({ page }) => {
		const heroSection = page.locator("main section").first();
		const cols = await heroSection.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		expect(cols.split(" ").filter(Boolean)).toHaveLength(1);
	});

	test("shorter kicker variant is the one visible to mobile users", async ({ page }) => {
		// The desktop kicker span is `hidden lg:inline` so it should be
		// display: none at mobile width; the mobile span is `lg:hidden`.
		const desktopKicker = hero(page).getByText("An open letter · 2026 World Cup");
		const mobileKicker = hero(page).getByText("An open letter · 2026", { exact: true });
		await expect(desktopKicker).toBeHidden();
		await expect(mobileKicker).toBeVisible();
	});
});
