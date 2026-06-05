import { expect, test } from "@playwright/test";

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

	test("language switcher opens via keyboard and lists every language", async ({
		page,
		browserName,
	}) => {
		test.skip(
			browserName === "webkit",
			"WebKit can't traverse interactive controls on Tab without OS-level Full Keyboard Access.",
		);
		const trigger = page.getByRole("button", { name: "English", expanded: false });
		await trigger.focus();
		await page.keyboard.press("Enter");

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
	test("stubbed links carry data-todo markers for the future pages", async ({ page }) => {
		await page.goto("/demo/footer");
		const todoLinks = page.locator("a[data-todo]");
		const count = await todoLinks.count();
		expect(count).toBeGreaterThanOrEqual(3); // Privacy/Terms/Accessibility at minimum
		for (const link of await todoLinks.all()) {
			await expect(link).toHaveAttribute("href", "#");
			await expect(link).toHaveAttribute("data-todo", /^DEV-/);
		}
	});

	test("has zero WCAG 2.1 A/AA violations", async ({ page }) => {
		await page.goto("/demo/footer");
		await runAxe(page);
	});
});
