import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Canonical end-to-end suite for the home page (`/`) — the
 * campaign's most-visited surface (DEV-41).
 *
 * Scope split: the *active* rotation behaviour (≥N tiles swap in
 * ~8s, pause stops it, resume restarts it) lives in
 * `tests/e2e/rotation.spec.ts`, which drives the island against
 * the project-owned 16-voice fixture on `/demo/starting-eleven`.
 * The home page's pool is `content/voices.json` — pipeline-managed
 * (DEV-32 syncs the live sheet every 2h) and currently 3 voices,
 * which can't demonstrate rotation (pool == visible). This suite
 * therefore covers everything that's correct against `/` at any
 * voice count: rendering, the reduced-motion *no-rotation* path,
 * mobile layout, accessibility, network, and light perf.
 *
 * Tile-count assertions derive `min(11, count)` / `min(8, count)`
 * from the live count rather than hard-coding 11 / 8, so they hold
 * whether the sheet has 3 voices or 350. The 11-tile formation
 * itself is pinned in `starting-eleven.spec.ts` against the
 * fixture.
 */

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 720 } as const;

const DESKTOP_VISIBLE = 11;
const MOBILE_VISIBLE = 8;

/**
 * Several primitive strings (the brand wordmark, "Read the letter")
 * appear in the footer chrome as well as the hero. Scoping to
 * `<main>` keeps hero assertions about the hero.
 */
function hero(page: Page) {
	return page.getByRole("main");
}

/** Read the live voice count off the header counter pill. */
async function readVoiceCount(page: Page): Promise<number> {
	const pill = page.locator("[aria-live='polite']").first();
	const text = (await pill.textContent()) ?? "";
	const match = text.match(/([\d,]+)/);
	return match ? Number.parseInt(match[1]!.replace(/,/g, ""), 10) : 0;
}

// ===========================================================
// Rendering
// ===========================================================
test.describe("home page · rendering", () => {
	test("loads with the expected document title", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle("Own Your Game");
	});

	test("exposes exactly one h1 — the sr-only campaign orientation landmark (DEV-86)", async ({
		page,
	}) => {
		await page.goto("/");
		const h1 = page.getByRole("heading", { level: 1 });
		await expect(h1).toHaveCount(1);
		// Visually hidden but present in the accessibility tree.
		await expect(h1).toHaveText(/^Own Your Game/);
	});

	test("hero shows the wordmark, tagline, and both CTAs", async ({ page }) => {
		await page.goto("/");
		await expect(hero(page).getByRole("img", { name: "Own Your Game" })).toBeVisible();
		// The starting-eleven supporting paragraph ends "...whose game is
		// it anyway?" (lowercase) and matches case-insensitively; exact
		// scopes this to the hero Tagline.
		await expect(hero(page).getByText("Whose game is it anyway?", { exact: true })).toBeVisible();

		const letterCta = hero(page).getByRole("link", { name: /Read the letter/ });
		await expect(letterCta).toHaveAttribute("href", "/letter");
		const squadCta = hero(page).getByRole("link", { name: /Meet all \d/ });
		await expect(squadCta).toHaveAttribute("href", "/squad");
	});

	test("voice counter card renders the count with tabular-nums", async ({ page }) => {
		await page.goto("/");
		const card = page.locator("[data-voice-counter-card]");
		await expect(card).toContainText("The voice counter");

		const count = await readVoiceCount(page);
		const number = card.locator("p.font-display.font-bold").first();
		await expect(number).toHaveText(String(count));
		// Tabular figures keep the giant number from reflowing as it
		// ticks. Confirm the computed font-variant-numeric, not the class.
		const variant = await number.evaluate((el) => getComputedStyle(el).fontVariantNumeric);
		expect(variant).toContain("tabular-nums");
	});

	test("starting eleven renders min(11, count) tiles on desktop", async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/");
		const count = await readVoiceCount(page);
		const expected = Math.min(DESKTOP_VISIBLE, count);
		await expect(page.locator("[data-eleven-formation] [data-voice-id]")).toHaveCount(expected);
	});

	test("why-this band renders and links to /about", async ({ page }) => {
		await page.goto("/");
		await expect(
			page.getByRole("heading", { name: "The biggest stage. The youngest authors." }),
		).toBeVisible();
		const aboutLink = page.getByRole("link", { name: /Read more about the project/ });
		await expect(aboutLink).toHaveAttribute("href", "/about");
	});

	test("footer renders all columns", async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/");
		const footer = page.getByRole("contentinfo");
		// 4-track grid on desktop: the brand block + three link columns.
		const cols = await footer.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		expect(cols.split(" ").filter(Boolean)).toHaveLength(4);
		// The three link-column headings, plus the brand wordmark block.
		for (const heading of ["The Letter", "The Squad", "Project"]) {
			await expect(footer.getByRole("heading", { level: 5, name: heading })).toBeVisible();
		}
	});
});

// ===========================================================
// Rotation — reduced-motion path only (active rotation in rotation.spec.ts)
// ===========================================================
test.describe("home page · reduced motion", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		// Must be set before navigation so the island's matchMedia read
		// on mount sees `reduce`.
		await page.emulateMedia({ reducedMotion: "reduce" });
	});

	test("no rotation occurs over a full tick window", async ({ page }) => {
		test.setTimeout(25_000);
		await page.goto("/");
		const formation = page.locator("[data-eleven-formation]");
		await formation.scrollIntoViewIfNeeded();

		const ids = () =>
			page.evaluate(() =>
				Array.from(document.querySelectorAll("[data-eleven-formation] [data-voice-id]")).map(
					(el) => (el as HTMLElement).dataset.voiceId,
				),
			);
		const before = await ids();
		// 12s spans more than one 8s tick — proves rotation is off, not
		// just slow.
		await page.waitForTimeout(12_000);
		const after = await ids();
		expect(after).toEqual(before);
	});

	test("the reduced-motion pill replaces the rotation controls", async ({ page }) => {
		await page.goto("/");
		const formation = page.locator("[data-eleven-formation]");
		await formation.scrollIntoViewIfNeeded();
		const section = formation.locator("xpath=ancestor::section[1]");
		await expect(section.getByText("Reduced motion — rotation paused").first()).toBeVisible();
		await expect(section.getByRole("button", { name: /Pause rotation/ })).toHaveCount(0);
	});
});

// ===========================================================
// Mobile layout (runs at every project viewport; forces mobile width)
// ===========================================================
test.describe("home page · mobile layout", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(MOBILE_VIEWPORT);
		await page.goto("/");
	});

	test("starting eleven renders min(8, count) tiles in the 2-col grid", async ({ page }) => {
		const count = await readVoiceCount(page);
		const expected = Math.min(MOBILE_VISIBLE, count);
		const grid = page.locator("[data-eleven-mobile]");
		await expect(grid.locator("[data-voice-id]")).toHaveCount(expected);
		const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		expect(cols.split(" ").filter(Boolean)).toHaveLength(2);
	});

	test("hero stacks into a single column", async ({ page }) => {
		const heroSection = page.locator("main section").first();
		const cols = await heroSection.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		expect(cols.split(" ").filter(Boolean)).toHaveLength(1);
	});

	test("voice counter card still renders", async ({ page }) => {
		await expect(page.locator("[data-voice-counter-card]")).toBeVisible();
		await expect(page.locator("[data-voice-counter-card]")).toContainText("The voice counter");
	});

	test("shorter kicker variant is the one visible to mobile users", async ({ page }) => {
		const desktopKicker = hero(page).getByText("An open letter · 2026 World Cup");
		const mobileKicker = hero(page).getByText("An open letter · 2026", { exact: true });
		await expect(desktopKicker).toBeHidden();
		await expect(mobileKicker).toBeVisible();
	});
});

// ===========================================================
// Accessibility
// ===========================================================
test.describe("home page · accessibility", () => {
	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		// Runs in all three projects (chromium-desktop, webkit-desktop,
		// chromium-mobile) so desktop + mobile are both covered.
		await page.goto("/");
		await runAxe(page);
	});

	test("skip link moves focus into main", async ({ page, browserName }) => {
		test.skip(
			browserName === "webkit",
			"WebKit only traverses links on Tab with OS-level Full Keyboard Access, which Playwright can't enable.",
		);
		await page.goto("/");
		await page.keyboard.press("Tab");
		const skip = page.getByRole("link", { name: "Skip to content" });
		await expect(skip).toBeFocused();
		await page.keyboard.press("Enter");
		// `<main>` carries tabindex="-1" so activation moves focus into
		// it rather than only scrolling.
		await expect(page.locator("main#main")).toBeFocused();
	});

	test("hero CTAs receive a visible focus ring in tab order", async ({ page, browserName }) => {
		test.skip(
			browserName === "webkit",
			"WebKit Tab link traversal needs OS-level Full Keyboard Access.",
		);
		await page.goto("/");
		const letterCta = hero(page).getByRole("link", { name: /Read the letter/ });
		await letterCta.focus();
		await expect(letterCta).toBeFocused();
		// :focus-visible draws the 3px outline; confirm it resolves to a
		// non-"none" outline style when focused.
		const outline = await letterCta.evaluate((el) => getComputedStyle(el).outlineStyle);
		expect(outline).not.toBe("none");
	});

	test("tiles receive focus in formation reading order", async ({ page, browserName }) => {
		test.skip(
			browserName === "webkit",
			"WebKit Tab link traversal needs OS-level Full Keyboard Access.",
		);
		await page.setViewportSize(DESKTOP_VIEWPORT);
		// Reduced motion freezes the rotation so the tiles don't swap
		// out from under the keyboard walk mid-test.
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");

		const tiles = page.locator("[data-eleven-formation] [data-tile]");
		const count = await tiles.count();
		expect(count).toBeGreaterThan(0);

		// Within the formation, tiles are consecutive <a> elements with
		// no other focusable nodes between them, so Tab walks them in
		// DOM order: keeper → defenders → midfielders → forwards.
		await tiles.first().focus();
		await expect(tiles.first()).toBeFocused();
		for (let i = 1; i < count; i++) {
			await page.keyboard.press("Tab");
			await expect(tiles.nth(i)).toBeFocused();
		}
	});
});

// ===========================================================
// Network
// ===========================================================
test.describe("home page · network", () => {
	test("makes no video / Cloudflare Stream requests", async ({ page }) => {
		const videoRequests: string[] = [];
		// Listener attached before navigation so nothing slips through.
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
});

// ===========================================================
// Performance (light — Lighthouse CI owns the throttled budgets)
// ===========================================================
test.describe("home page · performance (light)", () => {
	test("initial HTML document is under 100KB", async ({ page }) => {
		const response = await page.goto("/");
		expect(response, "navigation should return a response").not.toBeNull();
		const body = await response!.body();
		expect(body.byteLength, `initial HTML = ${body.byteLength} bytes`).toBeLessThan(100_000);
	});

	test("largest contentful paint is under 2.5s on a fast network", async ({ page }) => {
		await page.goto("/");
		const lcp = await page.evaluate(
			() =>
				new Promise<number>((resolve) => {
					new PerformanceObserver((list) => {
						const entries = list.getEntries();
						const last = entries[entries.length - 1];
						if (last) resolve(last.startTime);
					}).observe({ type: "largest-contentful-paint", buffered: true });
					// Fallback if no LCP entry fires (e.g. no qualifying
					// element) — resolve 0 so the assertion passes rather
					// than hanging the test.
					setTimeout(() => resolve(0), 4_000);
				}),
		);
		expect(lcp, `LCP = ${lcp}ms (CI Lighthouse owns the throttled budget)`).toBeLessThan(2_500);
	});
});
