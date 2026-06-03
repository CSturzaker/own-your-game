import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

/**
 * Whole-page e2e for /letter (DEV-55). Runs against the real page and
 * its live content, so anything count-dependent is derived from the H1
 * rather than hard-coded — the pipeline syncs the voice pool every 2h,
 * and the page must render correctly at 0, 3, 11, or 350 voices.
 *
 * Deep interaction edge cases (full scroll-spy sweep, signature overflow
 * + "+N more" navigation) live in letter-rail.spec.ts and
 * signed-by.spec.ts against demo pages with fixed fixtures; this suite
 * is the integration pass.
 */

const RAIL = 'nav[aria-label="Letter sections"]';
const SIGNATURE_ROW = "section.border-t";

const isMobileViewport = (vp: { width: number; height: number } | null) => (vp?.width ?? 0) < 1025;

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

async function voiceCountFromH1(page: Page): Promise<number> {
	const text = await page.getByRole("heading", { level: 1 }).innerText();
	const match = text.match(/From\s+([\d,]+)\s+young people/);
	return match ? Number(match[1]!.replace(/,/g, "")) : 0;
}

test.describe("letter page", () => {
	test("loads with the H1 naming the voice count", async ({ page }) => {
		await page.goto("/letter");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			/From [\d,]+ young people to FIFA/,
		);
	});

	test("renders all four waypoint anchors in the DOM", async ({ page }) => {
		await page.goto("/letter");
		for (const id of ["opening", "question", "ask", "signoff"]) {
			await expect(page.locator(`#waypoint-${id}`)).toHaveCount(1);
		}
	});

	test("renders the drop cap in deep cyan", async ({ page }) => {
		await page.goto("/letter");
		const cap = page.locator("article p span.float-start").first();
		await expect(cap).toHaveText("W");
		await expect(cap).toHaveCSS("color", "rgb(7, 70, 97)"); // --c-deep-900
	});

	test("renders the five values dots in their theme colours", async ({ page }) => {
		await page.goto("/letter");
		const dots = page.locator("article ul li span[aria-hidden='true']");
		await expect(dots).toHaveCount(5);
		const expected = [
			"rgb(26, 26, 26)", // community
			"rgb(7, 70, 97)", // friendship
			"rgb(122, 47, 8)", // confidence
			"rgb(192, 74, 18)", // joy → belonging
			"rgb(0, 122, 177)", // belonging → fairness
		];
		for (let i = 0; i < expected.length; i++) {
			await expect(dots.nth(i)).toHaveCSS("background-color", expected[i]!);
		}
	});

	test("renders the signature row at min(11, count) pills", async ({ page }) => {
		await page.goto("/letter");
		await waitForIslandHydration(page);
		const n = await voiceCountFromH1(page);
		const row = page.locator(SIGNATURE_ROW).first();
		await expect(row.getByRole("button")).toHaveCount(Math.min(11, n));
		const more = row.getByRole("link", { name: /more/ });
		if (n > 11) await expect(more).toBeVisible();
		else await expect(more).toHaveCount(0);
	});

	test("renders the sign-off and the share controls", async ({ page }) => {
		await page.goto("/letter");
		await expect(page.locator("article").getByText("Own Your Game", { exact: true })).toBeVisible();

		const share = page.locator("[data-share]");
		await expect(share.getByRole("button", { name: "Copy link to letter" })).toBeVisible();
		await expect(share.getByRole("link", { name: "Share as image" })).toHaveAttribute(
			"href",
			/\/og\/letter\.png$/,
		);
	});

	test("is accessible on desktop and mobile", async ({ page }) => {
		await page.goto("/letter");
		await runAxe(page);
	});

	test("copy link writes the canonical URL to the clipboard", async ({ page }, testInfo) => {
		// Reading the real system clipboard in headless is unreliable (it
		// needs document focus and doesn't persist), so spy on writeText to
		// assert the handler copies the right URL. Chromium only — WebKit
		// freezes navigator.clipboard so the spy can't be installed.
		test.skip(!testInfo.project.name.startsWith("chromium"), "clipboard spy: chromium only");
		await page.addInitScript(() => {
			const w = window as unknown as { __copied: string[] };
			w.__copied = [];
			if (navigator.clipboard) {
				navigator.clipboard.writeText = (text: string) => {
					w.__copied.push(String(text));
					return Promise.resolve();
				};
			}
		});
		await page.goto("/letter");
		await page.locator("[data-share]").getByRole("button", { name: "Copy link to letter" }).click();
		await expect
			.poll(() => page.evaluate(() => (window as unknown as { __copied: string[] }).__copied))
			.toContain("https://ownyourgame.org/letter");
	});

	test("shows a signature tooltip on hover", async ({ page }, testInfo) => {
		// WebKit headless doesn't deliver Radix's hover pointer events;
		// open/close logic is covered by the Tooltip Vitest spec.
		test.skip(testInfo.project.name !== "chromium-desktop", "hover tooltip: chromium-desktop only");
		await page.goto("/letter");
		await waitForIslandHydration(page);
		const pill = page.locator(SIGNATURE_ROW).first().getByRole("button").first();
		const name = (await pill.innerText()).trim();
		await pill.hover();
		const tip = page.getByRole("tooltip").first();
		await expect(tip).toBeVisible();
		await expect(tip).toContainText(name);
	});

	test("hides the rail on mobile", async ({ page, viewport }) => {
		test.skip(!isMobileViewport(viewport), "mobile-only assertion");
		await page.goto("/letter");
		await expect(page.locator(RAIL)).toBeHidden();
	});

	test("a direct URL with a hash scrolls to that waypoint on load", async ({ page, viewport }) => {
		test.skip(isMobileViewport(viewport), "rail is desktop-only");
		// Reduced motion → the on-load scroll is instant (WebKit headless
		// smooth-scroll is slow/flaky). Load via another page first so the
		// hashed URL is a full document load — a same-document hash change
		// wouldn't re-run the on-load scroll effect.
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		await page.goto("/letter#question");
		await waitForIslandHydration(page);
		await expect
			.poll(
				() =>
					page.evaluate(() =>
						Math.round(document.getElementById("waypoint-question")!.getBoundingClientRect().top),
					),
				{ timeout: 8_000 },
			)
			.toBeLessThan(200);
	});

	test.describe("desktop rail", () => {
		test.skip(({ viewport }) => isMobileViewport(viewport), "rail is desktop-only");

		test.beforeEach(async ({ page }) => {
			await page.goto("/letter");
			await waitForIslandHydration(page);
		});

		test("is visible", async ({ page }) => {
			await expect(page.locator(RAIL)).toBeVisible();
		});

		test("scroll spy marks the sign-off active at the bottom", async ({ page }) => {
			await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
			await expect(page.locator(RAIL).getByRole("link", { name: "Sign-off" })).toHaveAttribute(
				"aria-current",
				"true",
			);
		});

		test("clicking a waypoint scrolls to it and updates the hash", async ({ page }) => {
			await page.locator(RAIL).getByRole("link", { name: "The ask" }).click();
			await expect(page).toHaveURL(/#ask$/);
			await expect
				.poll(() =>
					page.evaluate(() =>
						Math.round(document.getElementById("waypoint-ask")!.getBoundingClientRect().top),
					),
				)
				.toBeLessThan(160);
		});
	});
});
