/**
 * Player-card active set — which voices prev/next traverses, and where the
 * current one sits (DEV-48).
 *
 * The set is described by the URL the card was reached through:
 *   - `?from=squad&theme=…&country=…` → the squad's filtered, sorted list
 *   - `?from=letter&theme=…`          → the curated theme group
 *   - no `from` / `?from=home`         → all voices
 *
 * Those params only exist at runtime (a static page has no query string at
 * build time), so resolution is client-side. Pure + framework-free so it's
 * unit-testable and shared by the modal overlay and the standalone page's
 * control island.
 */

import { interpolate } from "~/i18n/interpolate";
import { sortByNewest } from "~/lib/squad-grid";
import { applyFilters, type SquadFilterState } from "~/lib/squad-filters";
import { parseFilters } from "~/lib/squad-url";
import type { VoiceIndexEntry } from "~/lib/voice-index";

export interface ActiveSet<T = VoiceIndexEntry> {
	/** The traversal order — the filtered subset, newest-first. */
	readonly ordered: readonly T[];
	/** 0-based position of the current voice in `ordered`. */
	readonly index: number;
	/** Total voices in the set. */
	readonly total: number;
	/** The previous voice, or undefined at the start (no looping). */
	readonly prev: T | undefined;
	/** The next voice, or undefined at the end (no looping). */
	readonly next: T | undefined;
	/** The active filters (drives the indicator label). */
	readonly filters: SquadFilterState;
}

/**
 * Resolve the active set for `currentId` from the URL search params.
 *
 * The squad and letter origins narrow by the filter params; everything
 * else (home, direct visit) is the full list. Either way the order is
 * newest-first (the squad's order — the per-visit home shuffle isn't
 * serialised into the URL, an accepted degradation). If the current voice
 * isn't in the filtered subset (a stale or hand-edited link), we fall back
 * to the full list so prev/next still work.
 */
export function resolveActiveSet<T extends VoiceIndexEntry>(
	currentId: string,
	allVoices: readonly T[],
	search: URLSearchParams,
): ActiveSet<T> {
	const filters = parseFilters(search);
	let ordered = sortByNewest(applyFilters(allVoices, filters));
	let index = ordered.findIndex((v) => v.id === currentId);

	if (index === -1) {
		ordered = sortByNewest(allVoices);
		index = ordered.findIndex((v) => v.id === currentId);
	}

	return {
		ordered,
		index,
		total: ordered.length,
		prev: index > 0 ? ordered[index - 1] : undefined,
		next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined,
		filters,
	};
}

export type DotItem =
	| { readonly kind: "dot"; readonly active: boolean }
	| { readonly kind: "ellipsis" };

/**
 * A bounded dot indicator: one dot per voice up to `max`, otherwise a
 * sliding window of `max` dots around the current position with an
 * ellipsis marking each truncated side.
 */
export function buildDots(index: number, total: number, max = 8): DotItem[] {
	if (total <= 0) return [];
	if (total <= max) {
		return Array.from({ length: total }, (_, i) => ({ kind: "dot", active: i === index }));
	}

	const start = Math.max(0, Math.min(index - Math.floor(max / 2), total - max));
	const end = start + max;
	const items: DotItem[] = [];
	if (start > 0) items.push({ kind: "ellipsis" });
	for (let i = start; i < end; i++) items.push({ kind: "dot", active: i === index });
	if (end < total) items.push({ kind: "ellipsis" });
	return items;
}

/**
 * Build the indicator label: `"3 of 38 Friendship voices"` when a theme
 * narrows the set, else the plain `"3 of 38"`. `position` is 1-based.
 */
export function activeSetLabel(
	position: number,
	total: number,
	themeLabel: string,
	templates: { indicator: string; setIndicator: string },
): string {
	return themeLabel
		? interpolate(templates.setIndicator, { position, total, theme: themeLabel })
		: interpolate(templates.indicator, { position, total });
}

/** Build a same-set href for a neighbour voice — preserves the `from`/filter params. */
export function neighbourPath(id: string, search: URLSearchParams): string {
	const qs = search.toString();
	return qs ? `/voice/${id}?${qs}` : `/voice/${id}`;
}
