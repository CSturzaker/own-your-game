/**
 * Country-code helpers — ISO 3166-1 alpha-2 → human-readable name.
 *
 * The Voice schema (`schemas/voice.ts`) stores `countryCode` in alpha-2
 * form (`"KE"`, `"NG"`). The Tile, player card, and squad filters all
 * need a display string; this is the single source of truth.
 *
 * The list is intentionally minimal — it only covers countries that
 * actually appear in `content/voices.json`. It is NOT enforced by the
 * pipeline: the schema only checks the alpha-2 shape (`^[A-Z]{2}$`), so a
 * sheet that adds a new country lands in `voices.json` without a mapping,
 * and `countryName` then falls back to rendering the raw code (`"ZW"`).
 * Keep this table in sync when new countries' voices arrive.
 *
 * To add a country: append to `COUNTRY_NAMES`, and add a matching flag
 * gradient to `src/lib/flags.ts` (the Tile renders a swatch — an unmapped
 * code gets the neutral `FALLBACK_FLAG`).
 *
 * Internationalisation is deferred — every supported display language
 * ships English country names at launch. The campaign brief calls this
 * out; the LanguageSwitcher epic will revisit if a translator pushes
 * back.
 */

export const COUNTRY_NAMES: Readonly<Record<string, string>> = {
	AR: "Argentina",
	BR: "Brazil",
	CI: "Côte d’Ivoire",
	CN: "China",
	CO: "Colombia",
	EC: "Ecuador",
	EG: "Egypt",
	FJ: "Fiji",
	GB: "United Kingdom",
	GH: "Ghana",
	GT: "Guatemala",
	ID: "Indonesia",
	IN: "India",
	IT: "Italy",
	JP: "Japan",
	KE: "Kenya",
	LB: "Lebanon",
	LY: "Libya",
	MA: "Morocco",
	MN: "Mongolia",
	NG: "Nigeria",
	PH: "Philippines",
	PK: "Pakistan",
	SI: "Slovenia",
	SN: "Senegal",
	US: "United States",
	VN: "Vietnam",
	ZW: "Zimbabwe",
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
