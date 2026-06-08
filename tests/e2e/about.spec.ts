import { expect, test, type Locator, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Whole-page e2e for /about (DEV-67).
 *
 * Content + structure run against the real page and its live content, so
 * the stat counts are derived (card 1 is anchored to the header voice
 * counter; countries/languages are asserted as integers ≤ voices) rather
 * than hard-coded — the page must read correctly at 3 or 350 voices.
 *
 * The count-up *behaviour* (animates on scroll-in, runs once, respects
 * reduced motion) is exercised on /demo/about-stats, which wires the same
 * <MovementStats> to fixed figures at scale (247 / 42 / 26) so the
 * assertions are exact and deterministic.
 *
 * Copy follows the revised prototype, not the issue prose: there are no
 * "Who / What / Why" body kickers, and the closing pair is the prototype's
 * two ink statements rather than "One letter. / Many voices." — the tests
 * assert what ships.
 */

const isMobileViewport = (vp: { width: number; height: number } | null) => (vp?.width ?? 0) < 1025;

/** Resolve once the below-the-fold islands have hydrated (client:idle). */
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

/** The three stat cards, in order: voices, countries, languages. */
function statCards(page: Page): Locator {
	return page
		.locator("section")
		.filter({ has: page.getByRole("heading", { level: 2, name: "The movement in numbers" }) })
		.locator(".grid > div");
}

/** The visible (animated) number element inside a stat card. */
function cardNumber(card: Locator): Locator {
	return card.locator('span[aria-hidden="true"]');
}

/**
 * The live voice count — the first figure in the header counter pill,
 * which reads "{voices} voices · {countries} countries" (DEV-119).
 */
async function headerVoiceCount(page: Page): Promise<number> {
	const text = await page.locator("header [aria-live='polite']").first().innerText();
	const matches = text.match(/[\d,]+/g) ?? [];
	return Number((matches[0] ?? "0").replace(/,/g, ""));
}

type Rect = { x: number; y: number; width: number; height: number };

/**
 * The first two stat cards' rects captured in a single layout snapshot.
 * Reading the two boxes in one `evaluate` (rather than two sequential
 * `boundingBox()` awaits) means a reflow — font swap, the count-up reset
 * frame — can't land between the reads and yield boxes from different
 * layout states. That cross-read race was an intermittent flake in the
 * desktop "same row" assertion.
 */
async function firstTwoCardRects(page: Page): Promise<{ a: Rect; b: Rect } | null> {
	return page.evaluate(() => {
		const section = [...document.querySelectorAll("section")].find((s) =>
			/movement in numbers/i.test(s.querySelector("h2")?.textContent ?? ""),
		);
		const cards = section?.querySelectorAll<HTMLElement>(".grid > div");
		const r0 = cards?.[0]?.getBoundingClientRect();
		const r1 = cards?.[1]?.getBoundingClientRect();
		if (!r0 || !r1) return null;
		const pick = (r: DOMRect) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
		return { a: pick(r0), b: pick(r1) };
	});
}

/**
 * Scroll the stats into view and sample the first card's number every
 * ~50ms for `windowMs`, returning every value seen. Lets a test tell an
 * animated count (dips toward 0) from a static one (stays at final)
 * without a timing-fragile single-frame capture.
 */
async function traceFirstStat(page: Page, windowMs: number): Promise<number[]> {
	return page.evaluate((ms: number) => {
		return new Promise<number[]>((resolve) => {
			const section = [...document.querySelectorAll("section")].find((s) =>
				/movement in numbers/i.test(s.querySelector("h2")?.textContent ?? ""),
			);
			const el = section?.querySelector('span[aria-hidden="true"]');
			const values: number[] = [];
			window.scrollTo(0, document.body.scrollHeight);
			const id = setInterval(() => {
				if (el) values.push(Number(el.textContent));
			}, 50);
			setTimeout(() => {
				clearInterval(id);
				resolve(values);
			}, ms);
		});
	}, windowMs);
}

test.describe("about page", () => {
	test("loads with the hero — kicker, title, lede", async ({ page }) => {
		await page.goto("/about");
		await expect(page.getByText("A youth-led campaign · 2026 World Cup")).toBeVisible();
		await expect(
			page.getByRole("heading", { level: 1, name: "About Own Your Game." }),
		).toBeVisible();
		await expect(
			page.getByText(
				"Own Your Game is a youth-led global campaign built around one simple question:",
			),
		).toBeVisible();
	});

	test("renders the question/answer designed moment", async ({ page }) => {
		await page.goto("/about");
		const question = page.getByText("Whose game is it anyway?");
		await expect(question).toBeVisible();
		// The question is a blockquote; the answer is the Deep Cyan reply.
		await expect(question).toHaveJSProperty("tagName", "BLOCKQUOTE");
		const answer = page.getByText(/It.s ours\./);
		await expect(answer).toBeVisible();
		await expect(answer).toHaveCSS("color", "rgb(7, 70, 97)"); // --c-deep-900
	});

	test("renders the body paragraphs (no Who/What/Why kickers)", async ({ page }) => {
		await page.goto("/about");
		// Distinctive phrases from the prototype's replacement copy.
		await expect(page.getByText("Fix My Food").first()).toBeVisible();
		await expect(
			page.getByText(/the spaces we love are being overshadowed by junk food/),
		).toBeVisible();
		await expect(page.getByText(/ahead of the 2026 FIFA World Cup/)).toBeVisible();
		// The revised prototype dropped the issue's section kickers.
		await expect(page.getByText("Who", { exact: true })).toHaveCount(0);
	});

	test("renders the closing pair", async ({ page }) => {
		await page.goto("/about");
		await expect(
			page.getByText("Because football belongs to players, fans, families and communities."),
		).toBeVisible();
		await expect(
			page.getByText("And young people deserve a say in the future of the game they love."),
		).toBeVisible();
	});

	test("stat cards show the live counts", async ({ page }) => {
		await page.goto("/about");
		await waitForIslandHydration(page);
		const voices = await headerVoiceCount(page);
		const cards = statCards(page);
		await expect(cards).toHaveCount(3);
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Order (DEV-119): countries, voices, languages.
		const countries = Number(await cardNumber(cards.nth(0)).innerText());
		await expect(cards.nth(0)).toContainText("Countries");

		// Card 2 settles to the live voice count (auto-retries past any anim).
		await expect(cardNumber(cards.nth(1))).toHaveText(String(voices));
		await expect(cards.nth(1)).toContainText("Young voices");

		const languages = Number(await cardNumber(cards.nth(2)).innerText());
		await expect(cards.nth(2)).toContainText("Languages");

		// Distinct countries/languages can never exceed the voice count.
		expect(countries).toBeGreaterThanOrEqual(0);
		expect(countries).toBeLessThanOrEqual(voices);
		expect(languages).toBeGreaterThanOrEqual(0);
		expect(languages).toBeLessThanOrEqual(voices);
	});

	test("stat cards stack on mobile", async ({ page, viewport }) => {
		test.skip(!isMobileViewport(viewport), "mobile-only layout assertion");
		await page.goto("/about");
		await waitForIslandHydration(page);
		const rects = await firstTwoCardRects(page);
		expect(rects).not.toBeNull();
		const { a, b } = rects!;
		expect(b.y).toBeGreaterThan(a.y + a.height - 1); // second below first
		expect(Math.abs(b.x - a.x)).toBeLessThan(2); // same column
	});

	test("stat cards sit in a row on desktop", async ({ page, viewport }) => {
		test.skip(isMobileViewport(viewport), "desktop-only layout assertion");
		await page.goto("/about");
		await waitForIslandHydration(page);
		const rects = await firstTwoCardRects(page);
		expect(rects).not.toBeNull();
		const { a, b } = rects!;
		expect(Math.abs(b.y - a.y)).toBeLessThan(2); // same row
		expect(b.x).toBeGreaterThan(a.x); // second to the right
	});

	test("is accessible on desktop and mobile", async ({ page }) => {
		await page.goto("/about");
		await waitForIslandHydration(page);
		// Settle the count-up before scanning the final DOM. Voices is card 2
		// since DEV-119 (countries leads).
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await expect(cardNumber(statCards(page).nth(1))).toHaveText(
			String(await headerVoiceCount(page)),
		);
		await runAxe(page);
	});
});

test.describe("about stats — count-up (demo)", () => {
	test("counts up from a low value to the final on scroll-in", async ({ page }) => {
		await page.goto("/demo/about-stats");
		await waitForIslandHydration(page);
		// First card is Countries since DEV-119 — demo figure 42.
		const trace = await traceFirstStat(page, 1200);
		expect(Math.min(...trace)).toBeLessThan(42); // animated up from a low value
		expect(trace.at(-1)).toBe(42); // settled at the final value

		const cards = statCards(page);
		await expect(cardNumber(cards.nth(1))).toHaveText("247"); // voices
		await expect(cardNumber(cards.nth(2))).toHaveText("26"); // languages
	});

	test("does not re-run when scrolled away and back", async ({ page }) => {
		await page.goto("/demo/about-stats");
		await waitForIslandHydration(page);

		// First scroll-in: confirm it actually animated and settled, so we
		// know the observer has fired and unobserved before phase two.
		const first = await traceFirstStat(page, 1200);
		expect(Math.min(...first)).toBeLessThan(42);
		expect(first.at(-1)).toBe(42);

		// Scroll up, then back down, and sample: the observer was unobserved
		// after the first hit, so the number must stay pinned at 42 (a
		// re-trigger would reset it toward 0).
		await page.evaluate(() => window.scrollTo(0, 0));
		const minAfterReturn = await page.evaluate(
			() =>
				new Promise<number>((resolve) => {
					const section = [...document.querySelectorAll("section")].find((s) =>
						/movement in numbers/i.test(s.querySelector("h2")?.textContent ?? ""),
					);
					const el = section?.querySelector('span[aria-hidden="true"]');
					let min = Infinity;
					window.scrollTo(0, document.body.scrollHeight);
					const id = setInterval(() => {
						if (el) min = Math.min(min, Number(el.textContent));
					}, 50);
					setTimeout(() => {
						clearInterval(id);
						resolve(min);
					}, 600);
				}),
		);
		expect(minAfterReturn).toBe(42);
	});

	test("reduced motion renders final values with no count animation", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/demo/about-stats");
		await waitForIslandHydration(page);
		const trace = await traceFirstStat(page, 700);
		expect(Math.min(...trace)).toBe(42); // never dipped — no animation ran (Countries leads, DEV-119)
		await expect(cardNumber(statCards(page).nth(0))).toHaveText("42");
	});
});
