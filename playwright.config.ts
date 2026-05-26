import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Own Your Game.
 *
 * Local default: builds the site once via `pnpm build && pnpm preview`
 * so the test target matches production output. Set BASE_URL to point
 * at any other server (a Cloudflare Pages preview, a deployed branch,
 * etc.) and the webServer is skipped automatically.
 *
 * Three projects per the issue: chromium-desktop (1440×900),
 * webkit-desktop (1440×900), chromium-mobile (iPhone 13 — 390×844,
 * touch, mobile UA). Firefox is installed but unused for now;
 * configure a project here only when a Firefox-specific regression
 * appears.
 */

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL ?? "http://localhost:4321";

export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	reporter: isCI ? [["html"], ["github"]] : [["list"]],
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	expect: {
		toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
	},
	projects: [
		{
			name: "chromium-desktop",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1440, height: 900 },
			},
		},
		{
			name: "webkit-desktop",
			use: {
				...devices["Desktop Safari"],
				viewport: { width: 1440, height: 900 },
			},
		},
		{
			name: "chromium-mobile",
			use: { ...devices["iPhone 13"] },
		},
	],
	// Skip the webServer when BASE_URL is overridden — the assumption
	// is that whoever set it pointed at a live target.
	webServer: process.env.BASE_URL
		? undefined
		: {
				command: "pnpm build && pnpm preview",
				url: "http://localhost:4321",
				reuseExistingServer: !isCI,
				timeout: 120_000,
			},
});
