/**
 * Country-code helpers — ISO 3166-1 alpha-2 → human-readable name.
 *
 * The Voice schema (`schemas/voice.ts`) stores `countryCode` in alpha-2
 * form (`"KE"`, `"NG"`). The Tile, player card, and squad filters all
 * need a display string; this is the single source of truth.
 *
 * The list is intentionally minimal — it only covers countries that
 * actually appear in `content/voices.json`. The pipeline rejects voices
 * with codes not in `COUNTRY_NAMES`, surfacing a clear error in Slack
 * rather than rendering `"KE"` as the country label.
 *
 * To add a country: append to `COUNTRY_NAMES`, and (if the campaign
 * team wants a visible flag stripe) add a matching gradient to
 * `src/lib/flags.ts`.
 *
 * Internationalisation is deferred — every supported display language
 * ships English country names at launch. The campaign brief calls this
 * out; the LanguageSwitcher epic will revisit if a translator pushes
 * back.
 */

export const COUNTRY_NAMES: Readonly<Record<string, string>> = {
	AR: "Argentina",
	BR: "Brazil",
	CN: "China",
	EG: "Egypt",
	GH: "Ghana",
	IN: "India",
	IT: "Italy",
	JP: "Japan",
	KE: "Kenya",
	MA: "Morocco",
	NG: "Nigeria",
	PK: "Pakistan",
	SN: "Senegal",
	US: "United States",
	VN: "Vietnam",
};

/**
 * Resolve an ISO 3166-1 alpha-2 country code to its English display
 * name. Case-insensitive on input; unknown codes return the code itself
 * (uppercased) so the page never blanks out — but unknown codes should
 * never reach the renderer, because the pipeline validates against
 * this table.
 */
export function countryName(countryCode: string): string {
	const upper = countryCode.toUpperCase();
	return COUNTRY_NAMES[upper] ?? upper;
}

/** Whether the code has an explicit display-name mapping. */
export function hasCountryName(countryCode: string): boolean {
	return countryCode.toUpperCase() in COUNTRY_NAMES;
}
