/**
 * Squad filter ⇄ URL serialisation.
 *
 * The URL is the single source of truth for the squad's filter state, so
 * a filtered view is shareable, survives reload, and works with browser
 * back/forward. The Player Card (DEV-48) reads this same format to learn
 * the active filter set for its prev/next navigation.
 *
 * ## URL parameter format — `/squad?country=KE&language=sw`
 *
 * | Param      | Value                              | Validation                       |
 * | ---------- | ---------------------------------- | -------------------------------- |
 * | `country`  | ISO 3166-1 alpha-2 (e.g. `KE`)     | two letters, upper-cased         |
 * | `language` | BCP 47 tag (e.g. `sw`, `es-MX`)    | `xx` or `xx-XX`                  |
 *
 * Missing param = no filter on that dimension. Invalid values (typos,
 * malformed codes) are silently dropped with a console warning — a bad
 * link still renders the page rather than crashing. (Theme + age were
 * dropped as filter dimensions in DEV-110; an old `theme=`/`age=` param
 * is simply ignored.)
 *
 * `parseFilters` / `serialiseFilters` are pure; `updateUrl` is the only
 * function that touches `history`.
 */

import type { SquadFilterState } from "~/lib/squad-filters";

/** Event dispatched on `window` whenever the filter selection changes. */
export const SQUAD_FILTERS_CHANGED = "squad:filters-changed";

/**
 * Event a sibling island dispatches to ask the filter bar to clear every
 * dimension — the empty-state "Reset filters" CTA fires this so the
 * filter bar (the source of truth) clears its chips + URL and re-broadcasts.
 */
export const SQUAD_FILTERS_RESET = "squad:filters-reset";

const COUNTRY_RE = /^[A-Z]{2}$/;
const LANGUAGE_RE = /^[a-z]{2,3}(-[A-Z]{2})?$/;

/**
 * Read filter state out of URL params. Each dimension is validated by
 * format; anything malformed is dropped with a console warning so a
 * shared link with a typo degrades gracefully.
 */
export function parseFilters(searchParams: URLSearchParams): SquadFilterState {
	const filters: SquadFilterState = {};

	const country = searchParams.get("country");
	if (country !== null) {
		const upper = country.toUpperCase();
		if (COUNTRY_RE.test(upper)) filters.country = upper;
		else console.warn(`[squad] dropping invalid country filter: "${country}"`);
	}

	const language = searchParams.get("language");
	if (language !== null) {
		if (LANGUAGE_RE.test(language)) filters.language = language;
		else console.warn(`[squad] dropping invalid language filter: "${language}"`);
	}

	return filters;
}

/**
 * Serialise filter state to URL params in a stable dimension order, so
 * equivalent selections always produce an identical (shareable) URL.
 * Unset dimensions are omitted.
 */
export function serialiseFilters(filters: SquadFilterState): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.country !== undefined) params.set("country", filters.country);
	if (filters.language !== undefined) params.set("language", filters.language);
	return params;
}

/**
 * Push the filter state into the URL as a new history entry, so browser
 * back/forward steps between filter states (the team's explicit choice
 * over `replaceState`). An empty selection produces a clean
 * `?`-free path.
 */
export function updateUrl(filters: SquadFilterState): void {
	const query = serialiseFilters(filters).toString();
	const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
	window.history.pushState({}, "", url);
}
