import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * DEV-46 — the Cloudflare Stream iframe player, in isolation
 * (`/demo/stream-player`). The full player-card integration (modal +
 * standalone, prev/next, captions, transcript, share) is covered by
 * `player-card.spec.ts` (DEV-49); this guards the player's own contract:
 * lazy mount, the iframe URL shape, and the error/poster states.
 *
 * The iframe never plays video in headless Chromium (Cloudflare blocks it)
 * — we assert the element mounts with the right `src`, not playback. The
 * CI `build` job bakes in `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN`, so the iframe
 * mounts; run locally with that var set (`.env.local`) to exercise this.
 */
test.describe("Stream player (DEV-46)", () => {
	test("shows the poster + play button and loads no Stream bytes until play", async ({ page }) => {
		const streamRequests: string[] = [];
		page.on("request", (req) => {
			if (req.url().includes("cloudflarestream.com")) streamRequests.push(req.url());
		});

		await page.goto("/demo/stream-player");

		const play = page.getByRole("button", { name: "Play video" });
		await expect(play).toBeVisible();
		// No iframe and no Stream request before the user presses play.
		await expect(page.locator("iframe")).toHaveCount(0);
		expect(streamRequests).toHaveLength(0);

		await play.click();

		// The iframe mounts synchronously on play, pointing at Stream.
		const iframe = page.locator("iframe");
		await expect(iframe).toHaveCount(1);
		await expect(iframe).toHaveAttribute("src", /cloudflarestream\.com\/.+\/iframe/);
		await expect(iframe).toHaveAttribute("src", /autoplay=true/);

		// And now Stream bytes are requested.
		await expect.poll(() => streamRequests.length).toBeGreaterThan(0);
	});

	test("the poster state is accessible", async ({ page }) => {
		await page.goto("/demo/stream-player");
		await expect(page.getByRole("button", { name: "Play video" })).toBeVisible();
		await runAxe(page);
	});
});

/**
 * DEV-127 — the player pane never moves between first paint and playback.
 *
 * Live RUM flagged the Stream iframe as a poor-CLS element on `/voice/*`.
 * The actual mechanism wasn't the iframe's own box (the pane reserves an
 * aspect-ratio box from first SSR paint and the iframe fills it
 * absolutely) — it was the dot indicator: `[data-player-dots]` is SSR'd
 * empty and filled by `PlayerControls` after idle hydration + the index
 * fetch, and its old `empty:hidden` made the fill grow the card footer
 * ~22px, recentring the `justify-center` video pane and shifting the
 * (possibly playing) iframe well after any input. The container now
 * reserves its height; this spec pins the whole window — pane position
 * stable from pre-hydration SSR through dots fill, play, and embed load.
 *
 * Geometric `boundingBox()` assertions per the `squad-filters.spec.ts`
 * pattern, not screenshots — measured card-relative: play hands focus to
 * the iframe, which scrolls the page (CLS-exempt), which compacts the
 * sticky header and moves the card in document coordinates. That's page
 * chrome, not the player contract; the contract is that the card keeps
 * its height and the pane keeps its box *within* the card.
 *
 * Runs against the real voice page template (first voice from the live
 * `content/voices.json` — never a hard-coded id; the pipeline overwrites
 * that file every sync). The embed itself may 404 in CI (demo-customer
 * subdomain) — the pane's geometry must hold either way.
 */
test.describe("Stream player pane geometry (DEV-127)", () => {
	function firstVoiceId(): string | undefined {
		const file = JSON.parse(readFileSync("content/voices.json", "utf8")) as {
			voices: { id: string; publishedAt: string }[];
		};
		return [...file.voices].sort(
			(a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id),
		)[0]?.id;
	}

	/** The pane's box relative to the card, plus the card's own height. */
	async function paneBox(page: Page) {
		return page.evaluate(() => {
			const pane = document.querySelector("[data-stream-player]");
			const card = document.querySelector("[data-player-card]");
			if (!pane || !card) return null;
			const p = pane.getBoundingClientRect();
			const c = card.getBoundingClientRect();
			return { x: p.x - c.x, y: p.y - c.y, w: p.width, h: p.height, cardH: c.height };
		});
	}

	test("the pane box is stable from SSR paint through dots fill, play, and embed load", async ({
		page,
	}) => {
		const id = firstVoiceId();
		test.skip(!id, "needs at least one voice in content/voices.json");

		await page.goto(`/voice/${id}`);

		const pane = page.locator("[data-stream-player]");
		await expect(pane).toBeVisible();
		// Settle the webfont swap before the baseline read — the ~1px metric
		// residual the fallback faces leave (DEV-105's domain, guarded by the
		// lhci CLS budget) would otherwise race this spec's tolerance.
		await page.evaluate(() => document.fonts.ready);
		const before = await paneBox(page);
		expect(before).not.toBeNull();
		// The aspect box exists at first paint — never a collapsed slot.
		expect(before!.h).toBeGreaterThan(100);

		// Press play. The island is client:idle, so an early click can land
		// on un-hydrated SSR HTML — retry until the iframe mounts (once it
		// has, the play button is gone and the click is skipped). The same
		// window covers PlayerControls hydrating and filling the dots row.
		await expect(async () => {
			const play = page.locator("[data-play]");
			if ((await play.count()) > 0) await play.click();
			await expect(pane.locator("iframe")).toHaveCount(1);
		}).toPass({ timeout: 15_000 });

		// Let the embed load (or fail — CI's demo subdomain 404s; the pane
		// geometry must hold either way). The iframe's load event fires in
		// the parent frame even cross-origin; cap the wait so a hung embed
		// can't stall the spec.
		await pane.locator("iframe").evaluate(
			(el) =>
				new Promise<void>((resolve) => {
					el.addEventListener("load", () => resolve(), { once: true });
					setTimeout(resolve, 3_000);
				}),
		);

		const after = await paneBox(page);
		expect(after).not.toBeNull();
		// The card must not grow (the dots fill-in regression) …
		expect(Math.abs(after!.cardH - before!.cardH)).toBeLessThanOrEqual(1);
		// … and the pane must not move or resize within it.
		expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
		expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(1);
		expect(Math.abs(after!.h - before!.h)).toBeLessThanOrEqual(1);
		expect(Math.abs(after!.w - before!.w)).toBeLessThanOrEqual(1);
	});
});
