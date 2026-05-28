import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SquadFilters } from "~/islands/SquadFilters";
import { SAMPLE_VOICES } from "../../fixtures/voices";

// pushState mutates the shared jsdom URL; reset between tests so one
// test's selection doesn't seed the next via the mount sync.
beforeEach(() => {
	window.history.replaceState({}, "", "/");
});

/**
 * SquadFilters spec — the four single-select dropdowns, reset, and
 * count. Radix Popover content renders with role="dialog" in jsdom, so
 * option queries scope to it. Real cross-popover focus/keyboard journeys
 * live in the Playwright spec where focus is real.
 *
 * DEV-58 scope: selection is local and presentational — the count shows
 * the full total until DEV-59 wires the intersection + URL state.
 */

async function openChip(user: ReturnType<typeof userEvent.setup>, name: string) {
	await user.click(screen.getByRole("button", { name, expanded: false }));
	return await screen.findByRole("dialog");
}

describe("SquadFilters", () => {
	it("renders the four filter chips defaulting to 'All' and the total count", () => {
		render(<SquadFilters voices={SAMPLE_VOICES} />);
		expect(screen.getByRole("button", { name: "Theme: All" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Country: All" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Language: All" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Age: All" })).toBeInTheDocument();
		expect(screen.getByText(String(SAMPLE_VOICES.length))).toBeInTheDocument();
	});

	it("does not show the reset button until a filter is active", () => {
		render(<SquadFilters voices={SAMPLE_VOICES} />);
		expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
	});

	it("opens the theme popover and lists All + the six themes", async () => {
		const user = userEvent.setup();
		render(<SquadFilters voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Theme: All");
		for (const label of [
			"All themes",
			"Fairness",
			"Belonging",
			"Friendship",
			"Confidence",
			"Family",
			"Community",
		]) {
			expect(within(popover).getByRole("button", { name: label })).toBeInTheDocument();
		}
	});

	it("selecting a theme updates the chip label, closes, and reveals reset", async () => {
		const user = userEvent.setup();
		render(<SquadFilters voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Theme: All");
		await user.click(within(popover).getByRole("button", { name: "Friendship" }));

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Theme: Friendship" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
	});

	it("reset clears every active filter", async () => {
		const user = userEvent.setup();
		render(<SquadFilters voices={SAMPLE_VOICES} />);

		const themePopover = await openChip(user, "Theme: All");
		await user.click(within(themePopover).getByRole("button", { name: "Friendship" }));
		await user.click(screen.getByRole("button", { name: "Reset filters" }));

		expect(screen.getByRole("button", { name: "Theme: All" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
	});

	it("writes the selection to the URL and broadcasts a change event", async () => {
		const user = userEvent.setup();
		const push = vi.spyOn(window.history, "pushState");
		const onEvent = vi.fn();
		window.addEventListener("squad:filters-changed", onEvent);
		render(<SquadFilters voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Theme: All");
		await user.click(within(popover).getByRole("button", { name: "Friendship" }));

		expect(push).toHaveBeenCalledWith({}, "", expect.stringContaining("theme=friendship"));
		expect(onEvent).toHaveBeenCalled();
		window.removeEventListener("squad:filters-changed", onEvent);
	});

	it("shows 'Showing X of Y' once a filter narrows the set", async () => {
		const user = userEvent.setup();
		render(<SquadFilters voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Theme: All");
		await user.click(within(popover).getByRole("button", { name: "Friendship" }));

		expect(screen.getByText(/Showing/)).toBeInTheDocument();
		expect(screen.getByText(new RegExp(`of ${SAMPLE_VOICES.length} voices`))).toBeInTheDocument();
	});

	it("country popover derives options from the voice set", async () => {
		const user = userEvent.setup();
		render(<SquadFilters voices={SAMPLE_VOICES} />);

		const popover = await openChip(user, "Country: All");
		// Nigeria (NG) is in the fixture; selecting it relabels the chip.
		await user.click(within(popover).getByRole("button", { name: "Nigeria" }));
		expect(screen.getByRole("button", { name: "Country: Nigeria" })).toBeInTheDocument();
	});
});
