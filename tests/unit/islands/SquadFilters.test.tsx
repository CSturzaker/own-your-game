import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeT } from "~/i18n/astro";
import { buildSquadFiltersStrings } from "~/i18n/squad-strings";
import { SquadFilters } from "~/islands/SquadFilters";
import { SAMPLE_VOICES } from "../../fixtures/voices";

// English strings, resolved the same way the Astro host does.
const STRINGS = buildSquadFiltersStrings(makeT("en").t);

// pushState mutates the shared jsdom URL; reset between tests so one
// test's selection doesn't seed the next via the mount sync.
beforeEach(() => {
	window.history.replaceState({}, "", "/");
});

/**
 * SquadFilters spec — the two single-select dropdowns (country,
 * language), reset, and count. Radix Popover content renders with
 * role="dialog" in jsdom, so option queries scope to it. Real
 * cross-popover focus/keyboard journeys live in the Playwright spec
 * where focus is real. (Theme + age filters were dropped in DEV-110.)
 */

async function openChip(user: ReturnType<typeof userEvent.setup>, name: string) {
	await user.click(screen.getByRole("button", { name, expanded: false }));
	return await screen.findByRole("dialog");
}

describe("SquadFilters", () => {
	it("renders the two filter chips defaulting to 'All' and the total count", () => {
		render(<SquadFilters strings={STRINGS} voices={SAMPLE_VOICES} />);
		expect(screen.getByRole("button", { name: "Country: All" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Language: All" })).toBeInTheDocument();
		// Theme + age dropdowns are gone (DEV-110).
		expect(screen.queryByRole("button", { name: /^Theme:/ })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /^Age:/ })).not.toBeInTheDocument();
		expect(screen.getByText(String(SAMPLE_VOICES.length))).toBeInTheDocument();
	});

	it("does not show the reset button until a filter is active", () => {
		render(<SquadFilters strings={STRINGS} voices={SAMPLE_VOICES} />);
		expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
	});

	it("selecting a language updates the chip label, closes, and reveals reset", async () => {
		const user = userEvent.setup();
		render(<SquadFilters strings={STRINGS} voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Language: All");
		await user.click(within(popover).getByRole("button", { name: "Spanish" }));

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Language: Spanish" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
	});

	it("reset clears every active filter", async () => {
		const user = userEvent.setup();
		render(<SquadFilters strings={STRINGS} voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Language: All");
		await user.click(within(popover).getByRole("button", { name: "Spanish" }));
		await user.click(screen.getByRole("button", { name: "Reset filters" }));

		expect(screen.getByRole("button", { name: "Language: All" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
	});

	it("writes the selection to the URL and broadcasts a change event", async () => {
		const user = userEvent.setup();
		const push = vi.spyOn(window.history, "pushState");
		const onEvent = vi.fn();
		window.addEventListener("squad:filters-changed", onEvent);
		render(<SquadFilters strings={STRINGS} voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Language: All");
		await user.click(within(popover).getByRole("button", { name: "Spanish" }));

		expect(push).toHaveBeenCalledWith({}, "", expect.stringContaining("language=es"));
		expect(onEvent).toHaveBeenCalled();
		window.removeEventListener("squad:filters-changed", onEvent);
	});

	it("shows 'Showing X of Y' once a filter narrows the set", async () => {
		const user = userEvent.setup();
		render(<SquadFilters strings={STRINGS} voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Language: All");
		await user.click(within(popover).getByRole("button", { name: "Spanish" }));

		expect(screen.getByText(/Showing/)).toBeInTheDocument();
		expect(screen.getByText(new RegExp(`of ${SAMPLE_VOICES.length} voices`))).toBeInTheDocument();
	});

	it("clears every filter when it receives a reset event", async () => {
		const user = userEvent.setup();
		render(<SquadFilters strings={STRINGS} voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Language: All");
		await user.click(within(popover).getByRole("button", { name: "Spanish" }));
		expect(screen.getByRole("button", { name: "Language: Spanish" })).toBeInTheDocument();

		act(() => {
			window.dispatchEvent(new Event("squad:filters-reset"));
		});

		expect(screen.getByRole("button", { name: "Language: All" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
	});

	it("country popover derives options from the voice set", async () => {
		const user = userEvent.setup();
		render(<SquadFilters strings={STRINGS} voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Country: All");
		// Nigeria (NG) is in the fixture; selecting it relabels the chip.
		await user.click(within(popover).getByRole("button", { name: "Nigeria" }));
		expect(screen.getByRole("button", { name: "Country: Nigeria" })).toBeInTheDocument();
	});
});
