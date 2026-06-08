import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeT } from "~/i18n/astro";
import { buildSquadGridStrings } from "~/i18n/squad-strings";
import { SquadGrid } from "~/islands/SquadGrid";
import { applyFilters, type SquadFilterState } from "~/lib/squad-filters";
import { PAGE_SIZE, sortByNewest } from "~/lib/squad-grid";
import { SQUAD_FILTERS_CHANGED, SQUAD_FILTERS_RESET } from "~/lib/squad-url";
import type { Voice } from "~/lib/voice";
import { SAMPLE_VOICES } from "../../fixtures/voices";

// English strings, resolved the same way the Astro host does.
const STRINGS = buildSquadGridStrings(makeT("en").t, "en");

/** Repeat the fixtures to `n` voices with unique ids — pagination needs
 *  more than one 24-tile page, which the 16-voice fixture can't give. */
function manyVoices(n: number): Voice[] {
	return Array.from({ length: n }, (_, i) => {
		const base = SAMPLE_VOICES[i % SAMPLE_VOICES.length]!;
		return { ...base, id: `${base.id}-${i}` };
	});
}

/**
 * SquadGrid spec — the hydrated grid, newest-first ordering, the
 * player-card hrefs, and the re-filter on a `squad:filters-changed`
 * broadcast. The skeleton-on-cold-load and the opacity fade timing are
 * verified in the Playwright spec, where SSR and real transitions exist;
 * here the mount effect always flushes to the hydrated state.
 */

beforeEach(() => {
	window.history.replaceState({}, "", "/");
});

afterEach(() => {
	vi.useRealTimers();
});

/** Visible tile order, read straight off the DOM. */
function tileIds(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll<HTMLElement>("[data-tile]")).map(
		(t) => t.dataset.voiceId ?? "",
	);
}

function dispatchFilters(detail: SquadFilterState): void {
	act(() => {
		window.dispatchEvent(new CustomEvent(SQUAD_FILTERS_CHANGED, { detail }));
	});
}

describe("SquadGrid", () => {
	it("renders the supplied voices newest-first once hydrated", async () => {
		const { container } = render(<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} />);
		const expected = sortByNewest(SAMPLE_VOICES).map((v) => v.id);

		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(SAMPLE_VOICES.length);
		});
		expect(tileIds(container)).toEqual(expected);
	});

	it("numbers tiles 001… in the sorted order", async () => {
		const { container } = render(<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		const tiles = container.querySelectorAll<HTMLElement>("[data-tile]");
		expect(tiles[0]?.dataset.position).toBe("1");
		expect(tiles[1]?.dataset.position).toBe("2");
	});

	it("caps the render at PAGE_SIZE tiles", async () => {
		// Duplicate the fixtures past the page size with unique ids.
		const many = Array.from({ length: 60 }, (_, i) => {
			const base = SAMPLE_VOICES[i % SAMPLE_VOICES.length]!;
			return { ...base, id: `${base.id}-dup${i}` };
		});
		const { container } = render(<SquadGrid strings={STRINGS} voices={many} />);

		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(PAGE_SIZE);
		});
	});

	it("links each tile to the player card with the squad origin", async () => {
		const { container } = render(<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		const newest = sortByNewest(SAMPLE_VOICES)[0]!;
		const firstTile = container.querySelector<HTMLAnchorElement>("[data-tile]")!;
		expect(firstTile.getAttribute("href")).toBe(`/voice/${newest.id}?from=squad`);
	});

	it("re-filters and re-links on a squad:filters-changed broadcast", async () => {
		const { container } = render(
			<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} forceReducedMotion />,
		);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		dispatchFilters({ language: "ar" });

		// Reduced motion swaps instantly — newest Arabic voice first.
		await waitFor(() => {
			expect(tileIds(container)).toEqual(["idris-ma-011", "yusuf-eg-002"]);
		});
		const firstTile = container.querySelector<HTMLAnchorElement>("[data-tile]")!;
		expect(firstTile.getAttribute("href")).toBe("/voice/idris-ma-011?from=squad&language=ar");
	});

	it("shows the empty state when no voice matches the filters", async () => {
		const { container } = render(
			<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} forceReducedMotion />,
		);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		// Arabic voices exist only in EG and MA — pairing with KE is empty.
		dispatchFilters({ language: "ar", country: "KE" });
		await waitFor(() => {
			expect(container.querySelector("[data-squad-empty]")).not.toBeNull();
		});
		expect(container.querySelectorAll("[data-tile]").length).toBe(0);
		expect(container.querySelector("[data-squad-more]")).toBeNull();
	});

	it("the empty-state reset CTA asks the filter bar to clear", async () => {
		const onReset = vi.fn();
		window.addEventListener(SQUAD_FILTERS_RESET, onReset);
		const user = userEvent.setup();
		const { container } = render(
			<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} forceReducedMotion />,
		);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		dispatchFilters({ language: "ar", country: "KE" });
		await waitFor(() => expect(container.querySelector("[data-squad-empty]")).not.toBeNull());

		await user.click(screen.getByRole("button", { name: "Reset filters" }));
		expect(onReset).toHaveBeenCalled();
		window.removeEventListener(SQUAD_FILTERS_RESET, onReset);
	});

	it("fades the container then swaps when motion is allowed", () => {
		vi.useFakeTimers();
		try {
			const { container } = render(<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} />);
			act(() => {
				vi.runOnlyPendingTimers();
			});
			const grid = () => container.querySelector<HTMLElement>("[data-squad-grid]")!;
			expect(grid().className).toContain("opacity-100");

			act(() => {
				window.dispatchEvent(
					new CustomEvent(SQUAD_FILTERS_CHANGED, { detail: { language: "ar" } }),
				);
			});
			// Mid-fade: dimmed, old content still mounted.
			expect(grid().className).toContain("opacity-0");

			act(() => {
				vi.advanceTimersByTime(240);
			});
			expect(grid().className).toContain("opacity-100");
			expect(tileIds(container)).toEqual(["idris-ma-011", "yusuf-eg-002"]);
		} finally {
			vi.useRealTimers();
		}
	});

	it("ignores a broadcast that matches the current filters (no spurious fade)", async () => {
		const { container } = render(<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		dispatchFilters({});
		const grid = container.querySelector<HTMLElement>("[data-squad-grid]")!;
		expect(grid.className).toContain("opacity-100");
		expect(grid.className).not.toContain("opacity-0");
	});

	it("paginates: one page shown, load-more button and running indicator below", async () => {
		const { container } = render(<SquadGrid strings={STRINGS} voices={manyVoices(40)} />);
		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(PAGE_SIZE);
		});
		expect(screen.getByText("Showing 24 of 40 voices")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Load 16 more/ })).toBeInTheDocument();
	});

	it("reveals the next page on click and hides the button at the end", async () => {
		const user = userEvent.setup();
		const { container } = render(<SquadGrid strings={STRINGS} voices={manyVoices(40)} />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		await user.click(screen.getByRole("button", { name: /Load 16 more/ }));

		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(40);
		});
		expect(screen.getByText("All 40 voices shown")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Load/ })).not.toBeInTheDocument();
	});

	it("moves focus to the first newly revealed tile after load-more", async () => {
		const user = userEvent.setup();
		const { container } = render(<SquadGrid strings={STRINGS} voices={manyVoices(40)} />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		await user.click(screen.getByRole("button", { name: /Load 16 more/ }));

		await waitFor(() => {
			const tiles = container.querySelectorAll<HTMLElement>("[data-tile]");
			expect(tiles[PAGE_SIZE]).toHaveFocus();
		});
	});

	it("shows the all-shown indicator and no button when a page or less matches", async () => {
		const { container } = render(<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		expect(screen.getByText(`All ${SAMPLE_VOICES.length} voices shown`)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Load/ })).not.toBeInTheDocument();
	});

	it("resets to page one when the filters change", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<SquadGrid strings={STRINGS} voices={manyVoices(40)} forceReducedMotion />,
		);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		// Grow to the full list, then a filter round-trip must drop back
		// to a single page rather than staying at 40.
		await user.click(screen.getByRole("button", { name: /Load 16 more/ }));
		await waitFor(() => expect(container.querySelectorAll("[data-tile]").length).toBe(40));

		dispatchFilters({ language: "ar" });
		dispatchFilters({});

		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(PAGE_SIZE);
		});
		expect(screen.getByRole("button", { name: /Load 16 more/ })).toBeInTheDocument();
	});

	it("reads the initial filter state from the URL on mount", async () => {
		window.history.replaceState({}, "", "/?language=ar");
		const filtered = applyFilters(SAMPLE_VOICES, { language: "ar" });
		const { container } = render(<SquadGrid strings={STRINGS} voices={SAMPLE_VOICES} />);

		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(filtered.length);
		});
		expect(within(container).getAllByRole("link").length).toBe(filtered.length);
	});
});
