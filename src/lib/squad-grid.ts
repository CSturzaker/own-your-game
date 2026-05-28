/**
 * Squad grid helpers — sort order, tile links, page size, and the
 * JSON-in-script reader.
 *
 * Kept pure (no React, no module-level DOM access) so Vitest can pin
 * the contract the `SquadGrid` island itself can't easily reach. The
 * island is a thin shell over these resolvers, the same "logic lives
 * in `src/lib/`" rule the home epic followed.
 */

import { formatVoiceCount } from "~/lib/header";
import type { SquadFilterState } from "~/lib/squad-filters";
import { serialiseFilters } from "~/lib/squad-url";
import type { Voice } from "~/lib/voice";

/**
 * Tiles rendered per page. A deliberate three-rows-on-desktop default
 * (8 columns × 3) that keeps the initial paint small; the load-more
 * control (DEV-61) grows the count in `PAGE_SIZE` steps.
 */
export const PAGE_SIZE = 24;

/** Fade duration (ms) for the grid opacity transition on a filter change. */
export const FADE_MS = 240;

/**
 * Sort voices newest-first by `publishedAt`. The ISO-8601 strings sort
 * lexicographically the same as chronologically, so a plain string
 * compare is correct. `id` is the stable tiebreaker so two voices
 * sharing a `publishedAt` keep a deterministic order across renders
 * (and so the position numbers never shuffle under the user).
 *
 * Pure: returns a new array, leaving the input untouched.
 */
export function sortByNewest(voices: readonly Voice[]): Voice[] {
	return [...voices].sort(
		(a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id),
	);
}

/**
 * The link target for a squad tile: the player card, tagged with the
 * `from=squad` origin and the active filter set so the card's prev/next
 * navigation (DEV-48) can walk the same filtered, sorted list the user
 * was browsing. Shape: `/voice/{id}?from=squad&theme=…&country=…`.
 *
 * The player card route itself is Epic 6 (Cloudflare-blocked) — this is
 * the stable href the tile points at today; nothing serves it yet.
 */
export function squadTileHref(voice: Voice, filters: SquadFilterState): string {
	const params = new URLSearchParams({ from: "squad" });
	for (const [key, value] of serialiseFilters(filters)) {
		params.set(key, value);
	}
	return `/voice/${voice.id}?${params.toString()}`;
}

/**
 * How many more tiles the next load-more click reveals: a full page,
 * or the remainder when fewer than a page is left. Never negative.
 */
export function loadMoreCount(shown: number, total: number): number {
	return Math.min(PAGE_SIZE, Math.max(0, total - shown));
}

/**
 * Load-more button label. Mirrors the prototype's "Load 24 more" but
 * uses the actual next-batch size so the tail (e.g. 14 left) reads
 * "Load 14 more" rather than overstating a full page.
 */
export function loadMoreLabel(shown: number, total: number): string {
	return `Load ${loadMoreCount(shown, total)} more`;
}

/**
 * The below-grid count: "Showing 24 of 38 voices" while more remain,
 * "All 38 voices shown" once every match is on screen. Counts carry
 * the thousands separator (matching the filter bar) via
 * {@link formatVoiceCount}.
 */
export function shownIndicatorLabel(shown: number, total: number): string {
	return shown >= total
		? `All ${formatVoiceCount(total)} voices shown`
		: `Showing ${formatVoiceCount(shown)} of ${formatVoiceCount(total)} voices`;
}

/** The shape the squad page serialises into the `#squad-data` block. */
interface SquadData {
	voices?: Voice[];
}

/**
 * Read the pre-rendered voice list out of the `#squad-data`
 * JSON-in-script block placed by the page shell (DEV-57). The grid
 * reads it synchronously on mount — no network fetch — so a missing or
 * malformed block degrades to an empty grid rather than throwing.
 *
 * The data is build-time output already validated by `voicesFileSchema`
 * (in `src/lib/content.ts`), so it is trusted here and not re-parsed
 * through Zod — that would only bloat the client bundle.
 */
export function readSquadVoices(doc: Document = document): readonly Voice[] {
	const el = doc.getElementById("squad-data");
	if (!el?.textContent) return [];
	try {
		const data = JSON.parse(el.textContent) as SquadData;
		return data.voices ?? [];
	} catch {
		console.warn("[squad] could not parse #squad-data; rendering an empty grid");
		return [];
	}
}
