/**
 * Country code → self-hosted flag SVG (DEV-132).
 *
 * Player tiles show a small flag swatch next to the country code. This
 * was previously a CSS `linear-gradient` approximation that could only
 * draw stripes/bands — it could not render stars, crescents, or
 * emblems, so several flags were materially wrong (e.g. Vietnam was a
 * plain red field with no gold star; reported by the Vietnam country
 * office). National flags matter to participants and their offices, so
 * we now ship accurate artwork.
 *
 * The flags are rectangular (4:3) SVGs vendored from the `flag-icons`
 * project into `public/flags/{code}.svg` and rendered as a cached
 * `<img>` in a 14×10 swatch (the handoff's flag-swatch proportions).
 * Each is its own document, so the SVGs' internal element ids never
 * collide (the reason `<img>` is used rather than an inline sprite).
 * Flag *designs* are not copyrightable in most jurisdictions and
 * `flag-icons` is MIT-licensed — see `public/flags/LICENSE`.
 *
 * To add a country: drop its `4x3` SVG into `public/flags/` named with
 * the lowercase ISO 3166-1 alpha-2 code (e.g. `np.svg`) and add the
 * upper-case code to `AVAILABLE_FLAGS` below. Until a code is added,
 * its tile shows the neutral `FALLBACK_FLAG` marker — never a broken
 * image. (Nepal, `NP`, is the one non-rectangular national flag: its
 * 4:3 render will pad it — handle when it first appears.)
 */

/**
 * Country codes with a vendored SVG in `public/flags/`. Upper-case,
 * ISO 3166-1 alpha-2. Keep this in lockstep with the files on disk.
 */
const AVAILABLE_FLAGS: ReadonlySet<string> = new Set([
	"NG",
	"EG",
	"AR",
	"VN",
	"PK",
	"BR",
	"SN",
	"CN",
	"IN",
	"US",
	"MA",
	"IT",
	"GH",
	"KE",
	"JP",
	"ZW",
	"LB",
	"LY",
	"CI",
	"CO",
	"EC",
	"FJ",
	"GT",
	"ID",
	"MN",
	"PH",
	"SI",
	"GB",
	"KH",
]);

/**
 * Neutral grey gradient shown when a country code has no vendored SVG
 * yet. Three-band striping signals "flag here" without pretending to
 * be any specific country.
 */
export const FALLBACK_FLAG = "linear-gradient(90deg,#888 33%,#aaa 33% 66%,#888 66%)";

/**
 * Resolve a country code (ISO 3166-1 alpha-2) to the public URL of its
 * flag SVG, or `null` when no flag is vendored yet (the caller then
 * renders the `FALLBACK_FLAG` marker). Case-insensitive.
 */
export function flagSrc(countryCode: string): string | null {
	const code = countryCode.toUpperCase();
	return AVAILABLE_FLAGS.has(code) ? `/flags/${code.toLowerCase()}.svg` : null;
}

/**
 * Whether a country code has a vendored flag SVG — useful for tests and
 * tooling that wants to gate on "real flag vs fallback".
 */
export function hasFlag(countryCode: string): boolean {
	return AVAILABLE_FLAGS.has(countryCode.toUpperCase());
}
