import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 } as const;
const MOBILE_VIEWPORT = { width: 375, height: 720 } as const;

const COLUMN_HEADINGS = ["The Letter", "The Squad", "Project"] as const;

test.describe("footer demo · desktop chrome", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(DESKTOP_VIEWPORT);
		await page.goto("/demo/footer");
	});

	test("renders the three link column headings", async ({ page }) => {
		for (const heading of COLUMN_HEADINGS) {
			await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
		}
	});

	test("brand block shows the campaign description line", async ({ page }) => {
		const footer = page.getByRole("contentinfo");
		await expect(footer).toContainText("Own Your Game, a youth-led campaign");
	});

	test("brand block shows the UNICEF partner logo (DEV-117)", async ({ page }) => {
		const logo = page.getByRole("contentinfo").getByRole("img", { name: "UNICEF" });
		await expect(logo).toBeVisible();
		await expect(logo).toHaveAttribute("src", "/assets/unicef-logo.svg");
	});

	test("Fix My Food opens in a new tab with safe rel attributes", async ({ page }) => {
		// Headings are <h2> (DEV-77 heading-order fix); the Project column
		// items follow it in the DOM. Find the list after that heading.
		const projectList = page
			.getByRole("heading", { level: 2, name: "Project" })
			.locator("..")
			.getByRole("list");
		const fixMyFood = projectList.getByRole("link", { name: /Fix My Food/ });
		await expect(fixMyFood).toHaveAttribute("target", "_blank");
		await expect(fixMyFood).toHaveAttribute("rel", /noopener/);
		await expect(fixMyFood).toHaveAttribute("rel", /noreferrer/);
		await expect(fixMyFood).toHaveAttribute(
			"href",
			"https://www.unicef.org/take-action/campaign/fix-my-food",
		);

		// About stays an internal link — no new-tab treatment.
		const about = projectList.getByRole("link", { name: "About" });
		await expect(about).toHaveAttribute("href", "/about");
		await expect(about).not.toHaveAttribute("target", "_blank");
	});

	test("Kick Big Soda Out opens in a new tab with safe rel attributes (DEV-123)", async ({
		page,
	}) => {
		const projectList = page
			.getByRole("heading", { level: 2, name: "Project" })
			.locator("..")
			.getByRole("list");
		const kickBigSodaOut = projectList.getByRole("link", { name: /Kick Big Soda Out/ });
		await expect(kickBigSodaOut).toHaveAttribute("target", "_blank");
		await expect(kickBigSodaOut).toHaveAttribute("rel", /noopener/);
		await expect(kickBigSodaOut).toHaveAttribute("rel", /noreferrer/);
		await expect(kickBigSodaOut).toHaveAttribute("href", "https://www.kickbigsodaout.org");
	});

	test("language switcher opens via keyboard and lists every language", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === "webkit",
			"WebKit can't traverse interactive controls on Tab without OS-level Full Keyboard Access.",
		);
		const trigger = page.getByRole("button", { name: "English", expanded: false });
		// The switcher hydrates client:idle, so under parallel CI load the
		// trigger may not have bound its key handler when we press Enter.
		// Retry the keyboard-open against the *closed* trigger (so a retry
		// never toggles an already-open popover) until the dialog appears.
		await expect(async () => {
			if (await trigger.count()) {
				await trigger.focus();
				await page.keyboard.press("Enter");
			}
			await expect(page.getByRole("dialog")).toBeVisible({ timeout: 500 });
		}).toPass({ timeout: 15_000 });

		const popover = page.getByRole("dialog");
		for (const label of ["English", "Español", "Français", "العربية", "Português"]) {
			await expect(popover.getByRole("button", { name: label })).toBeVisible();
		}

		await page.keyboard.press("Escape");
		await expect(page.getByRole("dialog")).not.toBeVisible();
	});
});

test.describe("footer demo · mobile chrome", () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(MOBILE_VIEWPORT);
		await page.goto("/demo/footer");
	});

	test("stacks all blocks into a single column", async ({ page }) => {
		const footer = page.getByRole("contentinfo");
		const gridColsValue = await footer.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
		// 1fr grid resolves to a single track width; the desktop layout
		// resolves to four tracks. A single track value means we've
		// stacked correctly.
		expect(gridColsValue.split(" ").filter(Boolean)).toHaveLength(1);
	});
});

test.describe("footer demo · shared behaviour", () => {
	test("meta links resolve to the real legal pages with no stub markers (DEV-82)", async ({
		page,
	}) => {
		await page.goto("/demo/footer");
		const footer = page.getByRole("contentinfo");

		// The Privacy/Terms/Accessibility row now points at real pages.
		for (const [name, href] of [
			["Privacy", "/privacy"],
			["Terms", "/terms"],
			["Accessibility", "/accessibility"],
		] as const) {
			await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
		}

		// No stub markers remain anywhere in the footer.
		expect(await footer.locator("a[data-todo]").count()).toBe(0);
		expect(await footer.locator('a[href="#"]').count()).toBe(0);
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/footer");
		await runAxe(page);
	});
});

/**
 * DEV-128 — the footer never moves while late assets land.
 *
 * Live RUM flagged the footer as a poor-CLS element (0.266). Two real
 * mechanisms, both fixed:
 *
 *  - The footer/header SVG logos (`h-* w-auto`, no intrinsic size) held
 *    0px width until the file loaded, then snapped wide and could
 *    re-wrap their flex row. They now carry width/height attributes
 *    mirroring their viewBox, so the box is reserved at first paint.
 *  - On RTL pages the late Noto Sans Arabic swap re-wrapped text and
 *    moved everything above the footer ~30–56px. The Arabic face is now
 *    `font-display: optional` + a metric-matched fallback (a late font
 *    is never applied mid-session), so the shift cannot happen.
 *
 * Geometric `boundingBox()` assertions per the `squad-filters.spec.ts`
 * pattern, not screenshots: fonts and logos are delayed in flight (the
 * slow-network case that produced the RUM sample), and the footer's
 * document-relative top and height must not move between first paint
 * and everything-settled. Tolerance 2px — sub-CLS-threshold noise; the
 * regressions this guards were 22–56px.
 *
 * The delay covers the assets whose late arrival DEV-128 made
 * layout-neutral: the Arabic woff2 (now font-display: optional) and the
 * SVG logos (now intrinsically sized). The Latin woff2s are left fast
 * on purpose — delaying them past first paint exposes pre-existing
 * DEV-105 calibration limits (the display fallback wraps the big
 * tracked-uppercase headings differently, and the body fallback can
 * gain/lose a wrapped line at some widths, e.g. the home why-band at
 * 1280px). Both are out of DEV-128's scope and noted on the issue; in
 * real delivery the display subset is preloaded and wins the race to
 * first paint. The spec window (first paint → settled) also pins the
 * DEV-128 hydration reserves: the squad grid's indicator + load-more
 * block and the locked sticky header.
 */
const FOOTER_CLS_PAGES = ["/", "/squad", "/ar/"] as const;
const SLOW_ASSETS = ["**/*noto-sans-arabic*", "**/assets/*.svg"] as const;

async function footerBox(page: Page) {
	return page.evaluate(() => {
		const f = document.querySelector("footer");
		if (!f) return null;
		const r = f.getBoundingClientRect();
		return { top: r.y + window.scrollY, height: r.height };
	});
}

function delayRoutes(page: Page, ms: number) {
	for (const pattern of SLOW_ASSETS) {
		void page.route(pattern, async (route) => {
			await new Promise((resolve) => setTimeout(resolve, ms));
			await route.continue();
		});
	}
}

async function assertFooterStable(page: Page, path: string) {
	delayRoutes(page, 800);
	await page.goto(path, { waitUntil: "domcontentloaded" });
	const before = await footerBox(page);
	expect(before, "footer present at first paint").not.toBeNull();

	// On pages with the squad grid, make sure the after-measure lands
	// past the skeleton → live-tiles hydration swap it must pin.
	if ((await page.locator("[data-skeleton-grid]").count()) > 0) {
		await page.locator("[data-squad-grid]:not([data-skeleton-grid])").waitFor({ timeout: 15_000 });
	}

	// Everything settles: delayed fonts resolve (loaded or rejected by
	// font-display: optional), delayed logos arrive and decode. Only the
	// chrome logos matter here — page-body images can be lazy and never
	// load without scrolling, so waiting on all of them would hang.
	await page.evaluate(() => document.fonts.ready);
	await page.evaluate(() =>
		Promise.all(
			[...document.querySelectorAll<HTMLImageElement>("header img, footer img")].map((img) => {
				if (img.complete) return Promise.resolve();
				return new Promise((resolve) => {
					img.addEventListener("load", resolve, { once: true });
					img.addEventListener("error", resolve, { once: true });
				});
			}),
		),
	);
	await page.waitForTimeout(500);

	const after = await footerBox(page);
	expect(after).not.toBeNull();
	expect(Math.abs(after!.top - before!.top), "footer top").toBeLessThanOrEqual(2);
	expect(Math.abs(after!.height - before!.height), "footer height").toBeLessThanOrEqual(2);
}

test.describe("footer geometry under slow assets (DEV-128)", () => {
	for (const path of FOOTER_CLS_PAGES) {
		test(`footer box is stable on ${path} across font + logo load`, async ({ page }) => {
			await assertFooterStable(page, path);
		});
	}
});

test.describe("footer geometry under forced colors (DEV-128)", () => {
	// forcedColors emulation is a Chromium feature in Playwright; the
	// geometry contract is identical, so one engine's coverage suffices.
	test.skip(({ browserName }) => browserName !== "chromium", "forcedColors needs Chromium");

	test("footer box is stable on / across font + logo load", async ({ page }) => {
		await page.emulateMedia({ forcedColors: "active" });
		await assertFooterStable(page, "/");
	});
});
