import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageSwitcher, type LanguageOption } from "~/islands/LanguageSwitcher";

/**
 * LanguageSwitcher spec.
 *
 * The pill trigger shows the current language's native name; the popover
 * lists every language as a button (selecting navigates, so they're
 * buttons not links). Selecting calls `onNavigate` with
 * `localiseUrl(<current path>, code)` — the current path comes from
 * `window.location` at click time, so query and hash are preserved.
 */

const OPTIONS: LanguageOption[] = [
	{ code: "en", label: "English" },
	{ code: "es", label: "Español" },
	{ code: "fr", label: "Français" },
	{ code: "ar", label: "العربية" },
	{ code: "pt", label: "Português" },
];

// jsdom shares one URL across tests — reset it so a navigation in one
// doesn't leak into the next.
beforeEach(() => {
	window.history.replaceState({}, "", "/");
});

function renderSwitcher(props: Partial<React.ComponentProps<typeof LanguageSwitcher>> = {}) {
	return render(
		<LanguageSwitcher
			current={props.current ?? "en"}
			options={OPTIONS}
			currentPath={props.currentPath ?? "/"}
			onNavigate={props.onNavigate}
			{...props}
		/>,
	);
}

async function openPopover(user: ReturnType<typeof userEvent.setup>, triggerName: string) {
	await user.click(screen.getByRole("button", { name: triggerName, expanded: false }));
	return await screen.findByRole("dialog");
}

describe("LanguageSwitcher", () => {
	it("shows the current language's native name on the trigger", () => {
		renderSwitcher({ current: "ar" });
		expect(screen.getByRole("button", { name: "العربية", expanded: false })).toBeInTheDocument();
	});

	it("opens the popover and lists every launch language", async () => {
		const user = userEvent.setup();
		renderSwitcher({ current: "en" });
		const popover = await openPopover(user, "English");
		for (const o of OPTIONS) {
			expect(within(popover).getByRole("button", { name: o.label })).toBeInTheDocument();
		}
	});

	it("marks the current language with aria-current=true", async () => {
		const user = userEvent.setup();
		renderSwitcher({ current: "fr" });
		const popover = await openPopover(user, "Français");
		expect(within(popover).getByRole("button", { name: "Français" })).toHaveAttribute(
			"aria-current",
			"true",
		);
		expect(within(popover).getByRole("button", { name: "Español" })).not.toHaveAttribute(
			"aria-current",
		);
	});

	it("navigates to the chosen locale, preserving the path", async () => {
		const user = userEvent.setup();
		const onNavigate = vi.fn();
		window.history.replaceState({}, "", "/es/letter");
		renderSwitcher({ current: "es", currentPath: "/es/letter", onNavigate });

		const popover = await openPopover(user, "Español");
		await user.click(within(popover).getByRole("button", { name: "Français" }));

		expect(onNavigate).toHaveBeenCalledWith("/fr/letter");
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("drops the prefix when switching to the default locale", async () => {
		const user = userEvent.setup();
		const onNavigate = vi.fn();
		window.history.replaceState({}, "", "/es/letter");
		renderSwitcher({ current: "es", currentPath: "/es/letter", onNavigate });

		const popover = await openPopover(user, "Español");
		await user.click(within(popover).getByRole("button", { name: "English" }));

		expect(onNavigate).toHaveBeenCalledWith("/letter");
	});

	it("preserves the query string and hash", async () => {
		const user = userEvent.setup();
		const onNavigate = vi.fn();
		window.history.replaceState({}, "", "/squad?theme=friendship#top");
		renderSwitcher({ current: "en", currentPath: "/squad", onNavigate });

		const popover = await openPopover(user, "English");
		await user.click(within(popover).getByRole("button", { name: "Español" }));

		expect(onNavigate).toHaveBeenCalledWith("/es/squad?theme=friendship#top");
	});
});
