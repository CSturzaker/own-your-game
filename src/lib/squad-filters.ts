/**
 * Squad filter options + label helpers.
 *
 * DEV-58 owns the filter-bar UI: the four dropdowns derive their option
 * lists from the live voice set here, and the chip labels resolve raw
 * values (country codes, language tags, theme tokens) to display names.
 *
 * The actual filter *intersection* (narrowing the grid) and URL-state
 * sync are DEV-59 — this module is purely "what can you pick, and how
 * is it spelled". Kept pure so Vitest can pin every option list and
 * label without rendering the island.
 */

import { countryName } from "~/lib/countries";
import { THEMES, type Theme, type Voice } from "~/lib/voice";

/** The selected value for each filter dimension. Undefined = "All". */
export interface SquadFilterState {
	theme?: Theme;
	/** ISO 3166-1 alpha-2 country code. */
	country?: string;
	/** BCP 47 language tag. */
	language?: string;
	age?: number;
}

export interface FilterOption<T> {
	value: T;
	label: string;
}

/** Selectable ages — the schema constrains voices to 11–18 inclusive. */
export const AGE_OPTIONS = [11, 12, 13, 14, 15, 16, 17, 18] as const;

function capitalise(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

/** The six themes, title-cased for display. Order matches `THEMES`. */
export function themeOptions(): FilterOption<Theme>[] {
	return THEMES.map((theme) => ({ value: theme, label: capitalise(theme) }));
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

/** Whether any dimension is narrowed (drives the Reset button + count). */
export function hasActiveFilter(filters: SquadFilterState): boolean {
	return (
		filters.theme !== undefined ||
		filters.country !== undefined ||
		filters.language !== undefined ||
		filters.age !== undefined
	);
}

/** Display label for a dimension's chip, e.g. "Theme: Friendship". */
export function themeChipLabel(theme: Theme | undefined): string {
	return `Theme: ${theme ? capitalise(theme) : "All"}`;
}

export function countryChipLabel(country: string | undefined): string {
	return `Country: ${country ? countryName(country) : "All"}`;
}

export function languageChipLabel(language: string | undefined): string {
	return `Language: ${language ? languageName(language) : "All"}`;
}

export function ageChipLabel(age: number | undefined): string {
	return `Age: ${age ?? "All"}`;
}
