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

/** The live voice count, read from the header counter pill. */
async function headerVoiceCount(page: Page): Promise<number> {
	const text = await page.locator("header b.tabular-nums").first().innerText();
	return Number(text.replace(/\D/g, ""));
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

		// Card 1 settles to the live voice count (auto-retries past any anim).
		await expect(cardNumber(cards.nth(0))).toHaveText(String(voices));
		await expect(cards.nth(0)).toContainText("Young voices");

		const countries = Number(await cardNumber(cards.nth(1)).innerText());
		const languages = Number(await cardNumber(cards.nth(2)).innerText());
		// Distinct countries/languages can never exceed the voice count.
		expect(countries).toBeGreaterThanOrEqual(0);
		expect(countries).toBeLessThanOrEqual(voices);
		expect(languages).toBeGreaterThanOrEqual(0);
		expect(languages).toBeLessThanOrEqual(voices);
		await expect(cards.nth(1)).toContainText("Countries");
		await expect(cards.nth(2)).toContainText("Languages");
	});

	test("stat cards stack on mobile", async ({ page, viewport }) => {
		test.skip(!isMobileViewport(viewport), "mobile-only layout assertion");
		await page.goto("/about");
		const cards = statCards(page);
		const b0 = await cards.nth(0).boundingBox();
		const b1 = await cards.nth(1).boundingBox();
		expect(b1!.y).toBeGreaterThan(b0!.y + b0!.height - 1); // second below first
		expect(Math.abs(b1!.x - b0!.x)).toBeLessThan(2); // same column
	});

	test("stat cards sit in a row on desktop", async ({ page, viewport }) => {
		test.skip(isMobileViewport(viewport), "desktop-only layout assertion");
		await page.goto("/about");
		const cards = statCards(page);
		const b0 = await cards.nth(0).boundingBox();
		const b1 = await cards.nth(1).boundingBox();
		expect(Math.abs(b1!.y - b0!.y)).toBeLessThan(2); // same row
		expect(b1!.x).toBeGreaterThan(b0!.x); // second to the right
	});

	test("is accessible on desktop and mobile", async ({ page }) => {
		await page.goto("/about");
		await waitForIslandHydration(page);
		// Settle the count-up before scanning the final DOM.
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await expect(cardNumber(statCards(page).nth(0))).toHaveText(
			String(await headerVoiceCount(page)),
		);
		await runAxe(page);
	});
});

test.describe("about stats — count-up (demo)", () => {
	test("counts up from a low value to the final on scroll-in", async ({ page }) => {
		await page.goto("/demo/about-stats");
		await waitForIslandHydration(page);
		const trace = await traceFirstStat(page, 1200);
		expect(Math.min(...trace)).toBeLessThan(247); // animated up from a low value
		expect(trace.at(-1)).toBe(247); // settled at the final value

		const cards = statCards(page);
		await expect(cardNumber(cards.nth(1))).toHaveText("42");
		await expect(cardNumber(cards.nth(2))).toHaveText("26");
	});

	test("does not re-run when scrolled away and back", async ({ page }) => {
		await page.goto("/demo/about-stats");
		await waitForIslandHydration(page);

		// First scroll-in: confirm it actually animated and settled, so we
		// know the observer has fired and unobserved before phase two.
		const first = await traceFirstStat(page, 1200);
		expect(Math.min(...first)).toBeLessThan(247);
		expect(first.at(-1)).toBe(247);

		// Scroll up, then back down, and sample: the observer was unobserved
		// after the first hit, so the number must stay pinned at 247 (a
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
		expect(minAfterReturn).toBe(247);
	});

	test("reduced motion renders final values with no count animation", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/demo/about-stats");
		await waitForIslandHydration(page);
		const trace = await traceFirstStat(page, 700);
		expect(Math.min(...trace)).toBe(247); // never dipped — no animation ran
		await expect(cardNumber(statCards(page).nth(0))).toHaveText("247");
	});
});
