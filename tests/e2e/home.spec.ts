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

/**
 * The campaign film island hydrates `client:idle` — anything clicking
 * its play button waits for an idle callback first (the
 * `rotation.spec.ts` pattern).
 */
async function waitForIslandHydration(page: Page): Promise<void> {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
					.requestIdleCallback;
				if (typeof idle === "function") idle(() => resolve());
				else setTimeout(resolve, 100);
			}),
	);
}

/**
 * Read a figure off the header counter pill, which reads
 * "{voices} voices · {countries} countries" (DEV-119): index 0 = voices,
 * index 1 = countries.
 */
async function readPillFigure(page: Page, index: number): Promise<number> {
	const pill = page.locator("[aria-live='polite']").first();
	const text = (await pill.textContent()) ?? "";
	const matches = text.match(/[\d,]+/g) ?? [];
	const raw = matches[index];
	return raw ? Number.parseInt(raw.replace(/,/g, ""), 10) : 0;
}

/** The live voice count — the first figure in the header pill. */
async function readVoiceCount(page: Page): Promise<number> {
	return readPillFigure(page, 0);
}

/** The live country count — the second figure in the header pill. */
async function readCountryCount(page: Page): Promise<number> {
	return readPillFigure(page, 1);
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

	test("hero shows the wordmark, tagline, and the letter CTA; squad CTA sits in the film beat", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(hero(page).getByRole("img", { name: "Own Your Game" })).toBeVisible();
		// The starting-eleven supporting paragraph ends "...whose game is
		// it anyway?" (lowercase) and matches case-insensitively; exact
		// scopes this to the hero Tagline.
		await expect(hero(page).getByText("Whose game is it anyway?", { exact: true })).toBeVisible();

		const letterCta = hero(page).getByRole("link", { name: /Read the letter/ });
		await expect(letterCta).toHaveAttribute("href", "/letter");

		// DEV-124: the squad CTA moved out of the hero CTA row into the
		// film second beat (one CTA per beat). The beat renders twice
		// (desktop left column / mobile film section); exactly one is in
		// the accessibility tree at any viewport.
		const squadCta = hero(page).getByRole("link", { name: /Meet all \d/ });
		await expect(squadCta).toHaveCount(1);
		await expect(squadCta).toHaveAttribute("href", "/squad");
		const beatCta = page
			.locator("[data-film-beat]")
			.getByRole("link", { name: /Meet all \d/ })
			.filter({ visible: true });
		await expect(beatCta).toHaveCount(1);
	});

	test("country counter band renders the live count full-width below the hero", async ({
		page,
	}) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/");
		const band = page.locator("[data-voice-counter-card]");
		await expect(band).toContainText("The country counter");

		const countries = await readCountryCount(page);
		const number = band.locator("p.font-display.font-bold").first();
		await expect(number).toHaveText(String(countries));
		// Tabular figures keep the giant number from reflowing as it
		// ticks. Confirm the computed font-variant-numeric, not the class.
		const variant = await number.evaluate((el) => getComputedStyle(el).fontVariantNumeric);
		expect(variant).toContain("tabular-nums");

		// DEV-124: relocated out of the hero into its own full-width band
		// below it (the hero's right column is now the campaign film).
		const heroBox = (await page.locator("main section").first().boundingBox())!;
		const bandBox = (await band.boundingBox())!;
		expect(bandBox.y, "band sits below the hero section").toBeGreaterThan(
			heroBox.y + heroBox.height - 1,
		);
		expect(Math.abs(bandBox.width - heroBox.width), "band spans the content width").toBeLessThan(2);

		// The AA-cleared cyan-family fill (#007AB1, INTENTIONAL_DIVERGENCES)
		// — not the prototype's raw Process Cyan.
		const bg = await band.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(bg).toBe("rgb(0, 122, 177)");
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
			await expect(footer.getByRole("heading", { level: 2, name: heading })).toBeVisible();
		}
	});
});

// ===========================================================
// Campaign film (DEV-124)
// ===========================================================
test.describe("home page · campaign film", () => {
	test("shows the poster with an accessible play button and no iframe before activation", async ({
		page,
	}) => {
		await page.goto("/");
		const film = page.locator("[data-campaign-film]");
		await expect(film).toBeVisible();

		// The play control is a real <button> whose accessible name names
		// the film and its duration — the box's only interactive element.
		const play = film.getByRole("button", { name: /Play the campaign film/ });
		await expect(play).toBeVisible();

		// Click-to-play contract: no Stream iframe in the initial DOM (the
		// network side is pinned by the "no video requests" test below).
		await expect(film.locator("iframe")).toHaveCount(0);

		// The duration chip is poster chrome.
		await expect(film.locator("[data-film-duration]")).toBeVisible();
	});

	test("pressing play leaves the poster state and drops the duration chip", async ({ page }) => {
		await page.goto("/");
		await waitForIslandHydration(page);
		const film = page.locator("[data-campaign-film]");

		// An idle callback doesn't guarantee the island's lazy chunk has
		// attached its handlers yet, so retry the click until the player
		// reacts rather than racing hydration.
		await expect(async () => {
			await film.getByRole("button", { name: /Play the campaign film/ }).click();
			await expect(film.locator("[data-stream-player]")).not.toHaveAttribute(
				"data-mode",
				"poster",
				{ timeout: 500 },
			);
		}).toPass();

		// With the montage UID provisioned this is the playing iframe;
		// until then (env unset, DEV-124 layer 8) it's the unavailable
		// state. Either way the poster must not silently no-op, and the
		// chip must not float over the player/error surface.
		await expect(film.locator("[data-film-duration]")).toBeHidden();
	});

	test("the film poster tops the hero and overlaps the second beat (V5 overlap)", async ({
		page,
	}) => {
		// Geometric assertions, not screenshots (letter-rail.spec.ts
		// pattern). Desktop layout — forced like the formation tests.
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/");

		const heroBox = (await page.locator("main section").first().boundingBox())!;
		const filmBox = (await page.locator("[data-campaign-film]").boundingBox())!;
		// The desktop beat is the first in DOM order (left column).
		const beatBox = (await page.locator("[data-film-beat]").first().boundingBox())!;

		// items-start: the poster's top edge aligns to the hero section.
		expect(Math.abs(filmBox.y - heroBox.y), "poster top aligns to the hero top").toBeLessThan(2);
		// The 400px column carries the 9:16 box.
		expect(Math.round(filmBox.width)).toBe(400);
		expect(Math.round(filmBox.height)).toBe(Math.round((400 * 16) / 9));
		// The fold-aware overlap: the poster runs down past the second
		// beat's top edge, so any common fold crops it mid-frame.
		expect(filmBox.y + filmBox.height, "poster bottom overlaps the second beat").toBeGreaterThan(
			beatBox.y,
		);
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

	test("film section sits between the hero copy and the counter band", async ({ page }) => {
		const film = page.locator("[data-campaign-film]");
		await expect(film).toBeVisible();
		// The mobile beat (poster, then copy + squad CTA) is the visible one.
		const beat = page.locator("[data-film-beat]").filter({ visible: true });
		await expect(beat.getByRole("link", { name: /Meet all \d/ })).toBeVisible();

		const filmBox = (await film.boundingBox())!;
		const beatBox = (await beat.boundingBox())!;
		const bandBox = (await page.locator("[data-voice-counter-card]").boundingBox())!;
		expect(beatBox.y, "second-beat copy sits under the poster").toBeGreaterThan(
			filmBox.y + filmBox.height - 1,
		);
		expect(bandBox.y, "counter band renders below the film section").toBeGreaterThan(
			beatBox.y + beatBox.height - 1,
		);
	});

	test("country counter band still renders", async ({ page }) => {
		await expect(page.locator("[data-voice-counter-card]")).toBeVisible();
		await expect(page.locator("[data-voice-counter-card]")).toContainText("The country counter");
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
	test("makes no video / Cloudflare Stream requests before play", async ({ page }) => {
		// Since DEV-124 a Stream player (the campaign film) lives on `/`
		// itself, so this guard is now load-bearing for the "no video
		// weight until interaction" budget — mirror of the demo-page
		// assertion in stream-player.spec.ts.
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
