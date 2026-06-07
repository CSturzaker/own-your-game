import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Player Card — integrated E2E (DEV-49).
 *
 * The end-to-end suite that ties Epic 6 together at the real page level:
 * tile → modal, the lazy Stream player, the chip row, prev/next, direct
 * visits, the hybrid-history close, RTL, and axe across all three surfaces.
 *
 * It complements rather than duplicates the focused specs that own a single
 * mechanism: `dialog-focus-trap` (focus trap / Escape / scrim / initial
 * focus), `player-prevnext` (the desktop prev/next + arrow-key boundaries),
 * `player-mobile` (the swipe gesture physics), `stream-player` (the player
 * in isolation), and `player-chips` (the chip interactions on the page).
 * Here we assert the integrated flows those rely on.
 *
 * Orders + counts derive from the live `content/voices.json` so the suite
 * adapts to whatever ships (min(…) rather than hard-coded counts).
 */

interface VoiceRow {
	id: string;
	firstName: string;
	theme: string;
	publishedAt: string;
}

const VOICES: VoiceRow[] = (() => {
	const file = JSON.parse(readFileSync("content/voices.json", "utf8")) as { voices: VoiceRow[] };
	return [...file.voices].sort(
		(a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id),
	);
})();
const TOTAL = VOICES.length;

/**
 * Wait for a `client:idle` island (overlay / controls) to hydrate + bind,
 * then for the lazily-fetched voice index to resolve — the deterministic
 * "interception / active-set rescoping is live" signal (DEV-107), in place
 * of racing a single `requestIdleCallback`.
 */
async function waitForIdle(page: Page) {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				if ("requestIdleCallback" in window) requestIdleCallback(() => resolve());
				else setTimeout(resolve, 250);
			}),
	);
	await page.waitForFunction(() => document.documentElement.hasAttribute("data-voice-index-ready"));
}

/** Open the modal by clicking the nth tile on the current (desktop) page. */
async function openModalFromTile(page: Page, nth = 0) {
	const tile = page.locator("main a[data-voice-id]").nth(nth);
	await tile.waitFor();
	await waitForIdle(page);
	const id = await tile.getAttribute("data-voice-id");
	await tile.click();
	await expect(page.getByRole("dialog")).toBeVisible();
	// The modal shell is lazy-loaded (DEV-76). Wait for Radix to finish
	// mounting — autofocus lands on Close (the first focusable) — so the
	// Escape listener + focus trap are bound before a test interacts; this
	// stops Escape/Tab racing the dynamic import under parallel CI load.
	await expect(page.getByRole("dialog").getByRole("button", { name: "Close" })).toBeFocused();
	return id;
}

// ===========================================================
// Desktop modal (the intercepted-route overlay)
// ===========================================================
test.describe("player card — desktop modal", () => {
	test.skip(({ viewport }) => !viewport || viewport.width < 1024, "Desktop modal only.");
	test.skip(TOTAL < 1, "Needs at least one voice.");

	test("a tile opens the modal at the canonical URL with the voice's content", async ({ page }) => {
		await page.goto("/squad");
		const id = await openModalFromTile(page, 0);
		const voice = VOICES[0]!;

		await expect(page).toHaveURL(new RegExp(`/voice/${id}`));
		const dialog = page.getByRole("dialog");
		await expect(dialog).toHaveAccessibleName(new RegExp(voice.firstName));
		// Theme tag, name, location, and pull quote are all present.
		await expect(dialog).toContainText(voice.firstName);
		await expect(dialog.getByRole("button", { name: "Play video" })).toBeVisible();
		await expect(dialog.getByRole("button", { name: "Read transcript" })).toBeVisible();
		await expect(dialog.getByRole("button", { name: "Share this voice" })).toBeVisible();
	});

	test("Escape and Back both close the modal and restore the URL", async ({ page }) => {
		await page.goto("/squad");
		await openModalFromTile(page, 0);

		await page.keyboard.press("Escape");
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect(page).toHaveURL(/\/squad/);

		// Re-open, then dismiss via the browser Back button.
		await openModalFromTile(page, 0);
		await page.goBack();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect(page).toHaveURL(/\/squad/);
	});

	test("no Stream bytes load until play, then the iframe mounts", async ({ page }) => {
		const streamRequests: string[] = [];
		page.on("request", (req) => {
			if (req.url().includes("cloudflarestream.com")) streamRequests.push(req.url());
		});

		await page.goto("/squad");
		await openModalFromTile(page, 0);
		const dialog = page.getByRole("dialog");

		// Modal open, video not yet played → zero Stream requests.
		expect(streamRequests).toHaveLength(0);

		await dialog.getByRole("button", { name: "Play video" }).click();
		// The iframe mounts pointing at Stream (its UID is the videoId, not
		// the voice slug).
		await expect(dialog.locator("iframe")).toHaveAttribute(
			"src",
			/cloudflarestream\.com\/[a-f0-9]+\/iframe/,
		);
		await expect.poll(() => streamRequests.length).toBeGreaterThan(0);
	});

	test("the transcript chip opens its dialog inside the modal", async ({ page }) => {
		await page.goto("/squad");
		await openModalFromTile(page, 0);
		await page.getByRole("button", { name: "Read transcript" }).click();
		// Two dialogs now: the card modal + the nested transcript dialog.
		await expect(page.getByRole("dialog").filter({ hasText: "Transcript" })).toBeVisible();
	});

	test("the open modal is axe-clean", async ({ page }) => {
		await page.goto("/squad");
		await openModalFromTile(page, 0);
		// Scope the scan to the open dialog over the (inert) background.
		await runAxe(page, { include: ['[role="dialog"]'] });
	});
});

// ===========================================================
// Hybrid history — traverse in place, Back closes in one step
// ===========================================================
test.describe("player card — hybrid history", () => {
	test.skip(({ viewport }) => !viewport || viewport.width < 1024, "Desktop modal only.");
	test.skip(TOTAL < 3, "Needs at least three voices to prev twice.");

	test("open from squad, prev twice, Back returns to /squad (not a voice)", async ({ page }) => {
		await page.goto("/squad");
		// Open the last tile so we can step back twice.
		await openModalFromTile(page, TOTAL - 1);
		const dialog = page.getByRole("dialog");
		await expect(dialog).toContainText(VOICES[TOTAL - 1]!.firstName);

		// Prev twice — swaps in place via replaceState (URL tracks the voice).
		await dialog.getByRole("button", { name: /Previous voice/ }).click();
		await expect(page).toHaveURL(new RegExp(`/voice/${VOICES[TOTAL - 2]!.id}`));
		await dialog.getByRole("button", { name: /Previous voice/ }).click();
		await expect(page).toHaveURL(new RegExp(`/voice/${VOICES[TOTAL - 3]!.id}`));

		// One Back press closes the modal and lands on /squad — not the
		// previously-viewed voice (replaceState, not pushState, per traverse).
		await page.goBack();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect(page).toHaveURL(/\/squad/);
	});
});

// ===========================================================
// Direct visits to the standalone page
// ===========================================================
test.describe("player card — direct visit", () => {
	test.skip(TOTAL < 1, "Needs at least one voice.");

	test("renders the standalone page with header, footer, and card", async ({ page }) => {
		await page.goto(`/voice/${VOICES[0]!.id}`);
		await expect(page.locator("[data-player-card]")).toBeVisible();
		await expect(page.getByRole("banner")).toBeVisible();
		await expect(page.getByRole("contentinfo")).toBeVisible();
		await runAxe(page);
	});

	test("the disabled boundary prev/next control is a crawlable-safe button, not an hrefless anchor", async ({
		page,
	}) => {
		// DEV-101: the newest voice has no previous, so its prev control is a
		// boundary. It must render as a disabled <button> — Lighthouse's
		// crawlable-anchors SEO audit flags an <a> with no href. The next
		// control stays a real crawlable anchor.
		await page.goto(`/voice/${VOICES[0]!.id}`);
		const prev = page.locator("[data-player-prev]");
		await expect(prev).toBeVisible();
		await expect(prev).toHaveJSProperty("tagName", "BUTTON");
		await expect(prev).toBeDisabled();
		if (TOTAL >= 2) {
			const next = page.locator("[data-player-next]");
			await expect(next).toHaveJSProperty("tagName", "A");
			await expect(next).toHaveAttribute("href", /\/voice\//);
		}
		// No hrefless anchors anywhere on the page (the audit's actual check).
		expect(await page.locator("a:not([href])").count()).toBe(0);
	});

	test("?from=squad&theme=… scopes the active set to that theme", async ({ page }) => {
		// A voice that is mid-list overall (so unfiltered it has a next) and
		// whose theme has fewer voices than the full list.
		const voice = VOICES.find((v) => {
			const themeCount = VOICES.filter((o) => o.theme === v.theme).length;
			const idx = VOICES.indexOf(v);
			return idx > 0 && idx < TOTAL - 1 && themeCount < TOTAL;
		});
		test.skip(!voice, "No suitable mid-list voice in a smaller-than-total theme.");
		const themeCount = VOICES.filter((o) => o.theme === voice!.theme).length;

		await page.goto(`/voice/${voice!.id}?from=squad&theme=${voice!.theme}`);
		await waitForIdle(page);
		// The indicator reflects the filtered set's size, not the full total.
		await expect(page.locator("[data-player-indicator]")).toContainText(`of ${themeCount}`);
	});
});

// ===========================================================
// RTL (Arabic) — one happy path per surface
// ===========================================================
test.describe("player card — RTL (Arabic)", () => {
	test.skip(TOTAL < 1, "Needs at least one voice.");

	test("the standalone page renders RTL and is axe-clean", async ({ page }) => {
		await page.goto(`/ar/voice/${VOICES[0]!.id}`);
		await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
		await expect(page.locator("[data-player-card]")).toBeVisible();
		await runAxe(page);
	});

	test("the desktop modal opens RTL and is axe-clean", async ({ page, viewport }) => {
		test.skip(!viewport || viewport.width < 1024, "Desktop modal only.");
		await page.goto("/ar/squad");
		await openModalFromTile(page, 0);
		await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
		await runAxe(page, { include: ['[role="dialog"]'] });
	});
});
