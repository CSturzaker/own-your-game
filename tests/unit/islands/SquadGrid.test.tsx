import { act, render, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SquadGrid } from "~/islands/SquadGrid";
import { applyFilters, type SquadFilterState } from "~/lib/squad-filters";
import { PAGE_SIZE, sortByNewest } from "~/lib/squad-grid";
import { SQUAD_FILTERS_CHANGED } from "~/lib/squad-url";
import { SAMPLE_VOICES } from "../../fixtures/voices";

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
		const { container } = render(<SquadGrid voices={SAMPLE_VOICES} />);
		const expected = sortByNewest(SAMPLE_VOICES).map((v) => v.id);

		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(SAMPLE_VOICES.length);
		});
		expect(tileIds(container)).toEqual(expected);
	});

	it("numbers tiles 001… in the sorted order", async () => {
		const { container } = render(<SquadGrid voices={SAMPLE_VOICES} />);
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
		const { container } = render(<SquadGrid voices={many} />);

		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(PAGE_SIZE);
		});
	});

	it("links each tile to the player card with the squad origin", async () => {
		const { container } = render(<SquadGrid voices={SAMPLE_VOICES} />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		const newest = sortByNewest(SAMPLE_VOICES)[0]!;
		const firstTile = container.querySelector<HTMLAnchorElement>("[data-tile]")!;
		expect(firstTile.getAttribute("href")).toBe(`/voice/${newest.id}?from=squad`);
	});

	it("re-filters and re-links on a squad:filters-changed broadcast", async () => {
		const { container } = render(<SquadGrid voices={SAMPLE_VOICES} forceReducedMotion />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		dispatchFilters({ theme: "friendship" });

		// Reduced motion swaps instantly — newest friendship voice first.
		await waitFor(() => {
			expect(tileIds(container)).toEqual(["liang-cn-008", "yusuf-eg-002"]);
		});
		const firstTile = container.querySelector<HTMLAnchorElement>("[data-tile]")!;
		expect(firstTile.getAttribute("href")).toBe("/voice/liang-cn-008?from=squad&theme=friendship");
	});

	it("renders an empty grid when no voice matches the filters", async () => {
		const { container } = render(<SquadGrid voices={SAMPLE_VOICES} forceReducedMotion />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		// Friendship voices exist only in EG and CN — pairing with KE is empty.
		dispatchFilters({ theme: "friendship", country: "KE" });
		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(0);
		});
	});

	it("fades the container then swaps when motion is allowed", () => {
		vi.useFakeTimers();
		try {
			const { container } = render(<SquadGrid voices={SAMPLE_VOICES} />);
			act(() => {
				vi.runOnlyPendingTimers();
			});
			const grid = () => container.querySelector<HTMLElement>("[data-squad-grid]")!;
			expect(grid().className).toContain("opacity-100");

			act(() => {
				window.dispatchEvent(
					new CustomEvent(SQUAD_FILTERS_CHANGED, { detail: { theme: "friendship" } }),
				);
			});
			// Mid-fade: dimmed, old content still mounted.
			expect(grid().className).toContain("opacity-0");

			act(() => {
				vi.advanceTimersByTime(240);
			});
			expect(grid().className).toContain("opacity-100");
			expect(tileIds(container)).toEqual(["liang-cn-008", "yusuf-eg-002"]);
		} finally {
			vi.useRealTimers();
		}
	});

	it("ignores a broadcast that matches the current filters (no spurious fade)", async () => {
		const { container } = render(<SquadGrid voices={SAMPLE_VOICES} />);
		await waitFor(() => expect(container.querySelector("[data-tile]")).not.toBeNull());

		dispatchFilters({});
		const grid = container.querySelector<HTMLElement>("[data-squad-grid]")!;
		expect(grid.className).toContain("opacity-100");
		expect(grid.className).not.toContain("opacity-0");
	});

	it("reads the initial filter state from the URL on mount", async () => {
		window.history.replaceState({}, "", "/?theme=fairness");
		const filtered = applyFilters(SAMPLE_VOICES, { theme: "fairness" });
		const { container } = render(<SquadGrid voices={SAMPLE_VOICES} />);

		await waitFor(() => {
			expect(container.querySelectorAll("[data-tile]").length).toBe(filtered.length);
		});
		expect(within(container).getAllByRole("link").length).toBe(filtered.length);
	});
});
