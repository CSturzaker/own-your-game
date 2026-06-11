import { expect, test } from "@playwright/test";

/**
 * DEV-125 — Cloudflare Web Analytics beacon.
 *
 * The beacon is gated on PUBLIC_CF_BEACON_TOKEN at build time: set (the
 * production deploy env) → the explicit snippet is in <head>; unset
 * (preview / CI / local) → no beacon markup at all. This spec asserts
 * whichever branch matches the runtime env, so it must run against an
 * artifact built with the same PUBLIC_CF_BEACON_TOKEN value the test
 * process sees — true in CI (both unset), and locally as long as you
 * build and test in the same shell env. To exercise the "present" branch
 * locally: PUBLIC_CF_BEACON_TOKEN=test-token pnpm build, then run this
 * spec with the same var set.
 *
 * The /cdn-cgi/rum endpoint the beacon POSTs to exists only behind the
 * Cloudflare edge — it can't be asserted against a localhost preview and
 * is a post-deploy production check instead.
 */

const TOKEN = process.env.PUBLIC_CF_BEACON_TOKEN || undefined;
const BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

// Representative pages: the home page and a content page.
const PAGES = ["/", "/letter"];

test.describe("cloudflare web analytics (DEV-125)", () => {
	for (const path of PAGES) {
		test(`${path} ${TOKEN ? "carries the beacon with the token" : "carries no beacon markup"}`, async ({
			page,
		}) => {
			await page.goto(path);
			const beacon = page.locator(`script[src="${BEACON_SRC}"]`);

			if (TOKEN) {
				await expect(beacon).toHaveCount(1);
				await expect(beacon).toHaveAttribute("defer", "");
				const config = await beacon.getAttribute("data-cf-beacon");
				expect(JSON.parse(config ?? "{}")).toEqual({ token: TOKEN });
			} else {
				// Omitted entirely — no script element, no half-rendered
				// attribute, nothing referencing the insights CDN.
				await expect(beacon).toHaveCount(0);
				expect(await page.locator("[data-cf-beacon]").count()).toBe(0);
			}
		});
	}

	test("no CSP violations are reported on load", async ({ page }) => {
		// The site currently ships no Content-Security-Policy (verified in
		// DEV-125: none in the repo, none from the Cloudflare edge), so
		// nothing should ever be refused; if a CSP lands later it must
		// allow the beacon origin (script-src https://static.cloudflareinsights.com).
		const violations: string[] = [];
		page.on("console", (msg) => {
			if (/content security policy|refused to (load|execute|connect)/i.test(msg.text())) {
				violations.push(msg.text());
			}
		});

		for (const path of PAGES) {
			await page.goto(path);
			await page.waitForLoadState("networkidle");
		}

		expect(violations).toEqual([]);
	});
});
