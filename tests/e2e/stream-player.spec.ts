import { expect, test } from "@playwright/test";

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
