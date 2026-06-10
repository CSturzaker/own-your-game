import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MobileNav, type MobileNavProps } from "~/islands/MobileNav";

/**
 * Mobile nav drawer spec (DEV-103).
 *
 * Exercises the host contract: the trigger label toggles open/closed, the
 * drawer exposes the locale-aware nav links with the active item marked, the
 * language list renders, and Escape / Close dismiss it. Focus-trap + slide
 * are Playwright's job (mobile-nav.spec.ts) where focus and animation exist.
 */

const STRINGS: MobileNavProps["strings"] = {
	openMenu: "Open menu",
	closeMenu: "Close menu",
	navAriaLabel: "Primary",
	menuLabel: "Menu",
	languageLabel: "Language",
	share: "Share",
	copied: "Copied!",
	copiedStatus: "Link copied to clipboard",
	copyError: "Couldn't copy — your browser blocked clipboard access",
};

const SHARE_URL = "https://own-your-game.org/";

const LINKS: MobileNavProps["links"] = [
	{ id: "home", href: "/", label: "Home", active: false },
	{ id: "letter", href: "/letter", label: "The Letter", active: true },
	{ id: "squad", href: "/squad", label: "The Squad", active: false },
	{ id: "about", href: "/about", label: "About", active: false },
];

const LANGUAGES: MobileNavProps["languages"] = [
	{ code: "en", href: "/letter", label: "English", current: true },
	{ code: "es", href: "/es/letter", label: "Español", current: false },
];

function renderNav(overrides: Partial<MobileNavProps> = {}) {
	return render(
		<MobileNav
			links={LINKS}
			languages={LANGUAGES}
			strings={STRINGS}
			shareUrl={SHARE_URL}
			{...overrides}
		/>,
	);
}

describe("MobileNav", () => {
	it("renders the hamburger labelled 'Open menu' and stays closed", () => {
		renderNav();
		expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("opens the drawer, toggles aria-expanded, and offers a Close control", async () => {
		const user = userEvent.setup();
		renderNav();

		const trigger = screen.getByRole("button", { name: "Open menu" });
		expect(trigger).toHaveAttribute("aria-expanded", "false");

		await user.click(trigger);

		await screen.findByRole("dialog");
		// Stable name + aria-expanded (disclosure pattern), not a label swap.
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
	});

	it("lists the locale-aware nav links with the active item marked", async () => {
		const user = userEvent.setup();
		renderNav();
		await user.click(screen.getByRole("button", { name: "Open menu" }));

		const nav = screen.getByRole("navigation", { name: "Primary" });
		const letter = within(nav).getByRole("link", { name: "The Letter" });
		expect(letter).toHaveAttribute("href", "/letter");
		expect(letter).toHaveAttribute("aria-current", "page");

		const home = within(nav).getByRole("link", { name: "Home" });
		expect(home).toHaveAttribute("href", "/");
		expect(home).not.toHaveAttribute("aria-current");
	});

	it("renders the language list with the current locale marked", async () => {
		const user = userEvent.setup();
		renderNav();
		await user.click(screen.getByRole("button", { name: "Open menu" }));

		const es = screen.getByRole("link", { name: "Español" });
		expect(es).toHaveAttribute("href", "/es/letter");
		expect(es).toHaveAttribute("lang", "es");
		expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
	});

	it("hides the language section when no languages are passed", async () => {
		const user = userEvent.setup();
		renderNav({ languages: [] });
		await user.click(screen.getByRole("button", { name: "Open menu" }));

		expect(screen.queryByText("Language")).not.toBeInTheDocument();
	});

	it("copies the campaign URL from the drawer Share control (no native share)", async () => {
		// jsdom has no `navigator.share`, so the control takes the
		// clipboard fallback; user-event's setup stubs the clipboard.
		const user = userEvent.setup();
		renderNav();
		await user.click(screen.getByRole("button", { name: "Open menu" }));

		await user.click(screen.getByRole("button", { name: "Share" }));

		await expect(navigator.clipboard.readText()).resolves.toBe(SHARE_URL);
		// Visible confirmation swaps the label to the copied string.
		expect(await screen.findByRole("button", { name: "Copied!" })).toBeInTheDocument();
	});

	it("closes on Escape", async () => {
		const user = userEvent.setup();
		renderNav();
		await user.click(screen.getByRole("button", { name: "Open menu" }));
		await screen.findByRole("dialog");

		await user.keyboard("{Escape}");

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
