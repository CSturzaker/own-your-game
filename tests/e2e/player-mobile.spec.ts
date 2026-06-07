import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Mobile full-screen player card + swipe (DEV-45).
 *
 * Runs only on the mobile project. Derives the newest-first order from the
 * live `content/voices.json` (the same content the site builds from) so it
 * adapts to whatever voices ship, rather than hard-coding ids. Needs at
 * least two voices to exercise swipe; skips otherwise.
 */

interface VoiceRow {
	id: string;
	publishedAt: string;
}

function orderedVoiceIds(): string[] {
	const file = JSON.parse(readFileSync("content/voices.json", "utf8")) as { voices: VoiceRow[] };
	return [...file.voices]
		.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id))
		.map((v) => v.id);
}

/** Wait for the `client:idle` PlayerControls island to hydrate and bind. */
async function waitForSwipeReady(page: Page) {
	await page.locator("[data-player-card]").waitFor();
	// `client:idle` hydrates on requestIdleCallback, with a setTimeout
	// fallback in browsers without it (WebKit/Mobile Safari — this project).
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				if ("requestIdleCallback" in window) requestIdleCallback(() => resolve());
				else setTimeout(resolve, 250);
			}),
	);
	// PlayerControls binds swipe/keys only after the lazily-fetched voice
	// index resolves (DEV-107) — wait for the ready marker so the gesture
	// is wired before the test drives it.
	await page.waitForFunction(() => document.documentElement.hasAttribute("data-voice-index-ready"));
}

/** Drag horizontally across the card by `fraction` of its width (− = left). */
async function swipe(page: Page, fraction: number) {
	const card = page.locator("[data-player-card]");
	const box = await card.boundingBox();
	if (!box) throw new Error("player card not found");
	const y = box.y + box.height / 2;
	const startX = box.x + box.width * 0.8;
	await page.mouse.move(startX, y);
	await page.mouse.down();
	await page.mouse.move(startX + box.width * fraction, y, { steps: 12 });
	await page.mouse.up();
}

const ids = orderedVoiceIds();

test.describe("mobile player card", () => {
	test.skip(({ viewport }) => !viewport || viewport.width >= 1024, "Mobile viewport only.");
	test.skip(ids.length < 2, "Needs at least two voices to swipe between.");

	test("renders the full-screen layout and is axe-clean", async ({ page }) => {
		await page.goto(`/voice/${ids[0]}`);
		await expect(page.locator("[data-player-card]")).toBeVisible();
		// Mobile chrome: the close button + swipe hint are present.
		await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
		await expect(page.getByText("next & previous voice")).toBeVisible();
		await runAxe(page);
	});

	test("swipe left advances to the next voice", async ({ page }) => {
		await page.goto(`/voice/${ids[0]}`); // newest → has a next
		await waitForSwipeReady(page);
		await swipe(page, -0.6);
		await page.waitForURL(`**/voice/${ids[1]}`);
	});

	test("swipe right returns to the previous voice", async ({ page }) => {
		await page.goto(`/voice/${ids[1]}`); // second → has a previous
		await waitForSwipeReady(page);
		await swipe(page, 0.6);
		await page.waitForURL(`**/voice/${ids[0]}`);
	});

	test("a short drag snaps back without navigating", async ({ page }) => {
		await page.goto(`/voice/${ids[0]}`);
		await waitForSwipeReady(page);
		await swipe(page, -0.1); // below the 80px threshold
		await page.waitForTimeout(400);
		await expect(page).toHaveURL(new RegExp(`/voice/${ids[0]}(?:[?#]|$)`));
	});

	test("the close button leaves the card", async ({ page }) => {
		// Direct visit (no same-origin referrer) tagged from the squad →
		// close lands on /squad.
		await page.goto(`/voice/${ids[0]}?from=squad`);
		await waitForSwipeReady(page);
		await page.getByRole("button", { name: "Close" }).click();
		await page.waitForURL("**/squad");
	});
});
