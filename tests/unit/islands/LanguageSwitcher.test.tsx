import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LanguageSwitcher } from "~/islands/LanguageSwitcher";

/**
 * LanguageSwitcher spec.
 *
 * The pill trigger label is the current language name, and the
 * popover content lists every language as a button. That means
 * the current language name appears twice in the open state —
 * both queries below scope to either the trigger or the popover
 * content (a Radix dialog role) to disambiguate.
 *
 * Focus management and Escape behaviour come from Radix and are
 * already exercised by the Dialog wrapper spec; the cross-popover
 * keyboard journey lives in the Playwright spec where focus is real.
 */

const triggerName = "English (United Kingdom)";

async function openPopover(user: ReturnType<typeof userEvent.setup>) {
	const trigger = screen.getByRole("button", { name: triggerName, expanded: false });
	await user.click(trigger);
	return await screen.findByRole("dialog");
}

describe("LanguageSwitcher", () => {
	it("renders the current language label on the trigger", () => {
		render(<LanguageSwitcher lang="en-GB" />);
		expect(screen.getByRole("button", { name: triggerName, expanded: false })).toBeInTheDocument();
	});

	it("opens the popover and lists every launch language", async () => {
		const user = userEvent.setup();
		render(<LanguageSwitcher lang="en-GB" />);

		const popover = await openPopover(user);

		for (const label of [
			"English (United Kingdom)",
			"Español",
			"Français",
			"العربية",
			"Português",
		]) {
			expect(within(popover).getByRole("button", { name: label })).toBeInTheDocument();
		}
	});

	it("marks the current language with aria-current=true", async () => {
		const user = userEvent.setup();
		render(<LanguageSwitcher lang="fr" />);

		const fr = screen.getByRole("button", { name: "Français", expanded: false });
		await user.click(fr);
		const popover = await screen.findByRole("dialog");

		expect(within(popover).getByRole("button", { name: "Français" })).toHaveAttribute(
			"aria-current",
			"true",
		);
		expect(within(popover).getByRole("button", { name: "Español" })).not.toHaveAttribute(
			"aria-current",
		);
	});

	it("fires onSelect with the chosen code and closes the popover", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();
		render(<LanguageSwitcher lang="en-GB" onSelect={onSelect} />);

		const popover = await openPopover(user);
		await user.click(within(popover).getByRole("button", { name: "Français" }));

		expect(onSelect).toHaveBeenCalledWith("fr");
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
