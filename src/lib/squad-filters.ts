/**
 * Squad filter options + label helpers.
 *
 * DEV-58 owns the filter-bar UI: the two dropdowns (country, language)
 * derive their option lists from the live voice set here, and the chip
 * labels resolve raw values (country codes, language tags) to display
 * names. The theme + age dimensions were dropped in DEV-110 (the data
 * stays on the Voice record; only the filter UI/state/URL went).
 *
 * The actual filter *intersection* (narrowing the grid) and URL-state
 * sync are DEV-59 — this module is purely "what can you pick, and how
 * is it spelled". Kept pure so Vitest can pin every option list and
 * label without rendering the island.
 */

import { countryName } from "~/lib/countries";
import type { Voice } from "~/lib/voice";

/** The selected value for each filter dimension. Undefined = "All". */
export interface SquadFilterState {
	/** ISO 3166-1 alpha-2 country code. */
	country?: string;
	/** BCP 47 language tag. */
	language?: string;
}

export interface FilterOption<T> {
	value: T;
	label: string;
}

/**
 * Resolve a BCP 47 tag to an English language name ("es-MX" → "Mexican
 * Spanish"). Falls back to the raw tag if the runtime can't resolve it,
 * so an exotic tag never renders blank.
 */
export function languageName(tag: string): string {
	try {
		const display = new Intl.DisplayNames(["en"], { type: "language" });
		return display.of(tag) ?? tag;
	} catch {
		return tag;
	}
}

/**
 * Unique countries present in the voice set, as `{ value: code, label:
 * name }`, sorted by display name. The dropdown only offers countries
 * that actually have a voice — no dead options.
 */
export function countryOptions(voices: readonly Voice[]): FilterOption<string>[] {
	const codes = Array.from(new Set(voices.map((v) => v.countryCode)));
	return codes
		.map((code) => ({ value: code, label: countryName(code) }))
		.sort((a, b) => a.label.localeCompare(b.label));
}

/** Unique languages present in the voice set, sorted by display name. */
export function languageOptions(voices: readonly Voice[]): FilterOption<string>[] {
	const tags = Array.from(new Set(voices.map((v) => v.language)));
	return tags
		.map((tag) => ({ value: tag, label: languageName(tag) }))
		.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Narrow the voice set by the active filter dimensions. Dimensions
 * intersect (AND): `{ country: "KE", language: "sw" }` returns Swahili
 * voices *from Kenya*, not the union. An unset dimension (undefined)
 * imposes no constraint.
 */
export function applyFilters<T extends Pick<Voice, "countryCode" | "language">>(
	voices: readonly T[],
	filters: SquadFilterState,
): readonly T[] {
	return voices.filter((voice) => {
		if (filters.country !== undefined && voice.countryCode !== filters.country) return false;
		if (filters.language !== undefined && voice.language !== filters.language) return false;
		return true;
	});
}

/** Whether any dimension is narrowed (drives the Reset button + count). */
export function hasActiveFilter(filters: SquadFilterState): boolean {
	return filters.country !== undefined || filters.language !== undefined;
}

// The chip labels ("Country: All", "Language: Spanish") moved into the
// dictionary in DEV-70 (`squad.filters.chip*` templates) and are
// interpolated client-side in the `SquadFilters` island. The option
// lists above supply the English country/language display names (via
// `Intl`) the island reuses for the chips.
