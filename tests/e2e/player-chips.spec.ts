import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * DEV-47 — the player-card chip row (captions / share) on the standalone
 * `/voice/{id}` page, where it's a nested `client:idle` island. The modal
 * surface and the full keyboard/focus journeys are covered by the
 * comprehensive player-card suite (DEV-49); this guards each chip's own
 * interaction. (The transcript chip + share-as-image were removed in
 * DEV-114.)
 *
 * The target voice is the first in the live `content/voices.json` (the same
 * content the site builds from) rather than a hard-coded id, so the spec
 * survives the pipeline overwriting the voice set.
 *
 * The chips hydrate `client:idle`, so each opener polls (click → expect
 * open) which doubles as the hydration gate.
 */

const firstVoiceId = (
	JSON.parse(readFileSync("content/voices.json", "utf8")) as { voices: { id: string }[] }
).voices[0]?.id;
const VOICE = `/voice/${firstVoiceId}`;

test.describe("Player chips (DEV-47)", () => {
	test("captions chip toggles its on/off state", async ({ page }) => {
		await page.goto(VOICE);
		const off = page.getByRole("button", { name: "Captions: Off" });
		// Wait for hydration: the toggle only flips once the island is live.
		await expect(async () => {
			await off.click();
			await expect(page.getByRole("button", { name: /Captions: \w+/ })).toHaveAttribute(
				"aria-pressed",
				"true",
			);
		}).toPass({ timeout: 10_000 });

		// Toggling again returns to off.
		await page.getByRole("button", { name: /Captions:/ }).click();
		await expect(page.getByRole("button", { name: "Captions: Off" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	test("share → copy link writes the voice URL to the clipboard", async ({
		page,
		context,
		browserName,
	}) => {
		test.skip(browserName !== "chromium", "clipboard permissions are chromium-only here");
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);
		await page.goto(VOICE);

		const share = page.getByRole("button", { name: "Share this voice" });
		await expect(async () => {
			await share.click();
			await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible({ timeout: 500 });
		}).toPass({ timeout: 10_000 });

		await page.getByRole("button", { name: "Copy link" }).click();
		await expect(page.getByText("Copied!")).toBeVisible();

		const clip = await page.evaluate(() => navigator.clipboard.readText());
		expect(clip).toBe(new URL(VOICE, page.url()).toString());
	});

	test("the chip row is axe-clean", async ({ page }) => {
		await page.goto(VOICE);
		await runAxe(page);
	});
});
