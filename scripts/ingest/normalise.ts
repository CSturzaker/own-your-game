/**
 * Pure normalisation for the intake → campaign bridge (DEV-104).
 *
 * The country-office intake sheet carries full country names, full
 * language names, full youth names, and quotes wrapped in curly quotes —
 * none of which match the campaign schema's shape directly. Every
 * conversion here is a pure function with no IO, so the offline reader
 * (Layer 1) can be unit-tested and eyeballed against the real file
 * before any credential or network call exists.
 *
 * Safeguarding is enforced here at the boundary, not downstream:
 * `proposeFirstName` only ever returns a single token (never a surname),
 * and `checkConsent` is the hard gate. Coercion never happens silently —
 * the caller turns every "unmapped"/"needs-review" result into a report
 * line rather than guessing.
 */

/**
 * Collapse a label to a diacritic-free, punctuation-free, lowercase key
 * for tolerant lookups. `"Côte d'Ivoire "` and `"cote divoire"` both map
 * to `"cotedivoire"`; `"Viet Nam"` → `"vietnam"`. Used for country and
 * language matching where offices type names with stray whitespace,
 * accents, and apostrophes.
 */
export function lookupKey(raw: string): string {
	return raw
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
}

/**
 * Country full-name → ISO 3166-1 alpha-2. Keyed on `lookupKey` so
 * accents/whitespace/punctuation variants resolve. Covers every country
 * in the current intake data plus common UNICEF-programme countries;
 * anything unmatched is reported, never guessed.
 */
const COUNTRY_TO_CODE: Readonly<Record<string, string>> = {
	colombia: "CO",
	ecuador: "EC",
	egypt: "EG",
	fiji: "FJ",
	ghana: "GH",
	guatemala: "GT",
	indonesia: "ID",
	kenya: "KE",
	lebanon: "LB",
	libya: "LY",
	mongolia: "MN",
	morocco: "MA",
	slovenia: "SI",
	vietnam: "VN",
	zimbabwe: "ZW",
	cotedivoire: "CI",
	// Common neighbours likely to appear as offices add rows.
	nigeria: "NG",
	southafrica: "ZA",
	tanzania: "TZ",
	uganda: "UG",
	ethiopia: "ET",
	india: "IN",
	pakistan: "PK",
	bangladesh: "BD",
	philippines: "PH",
	brazil: "BR",
	mexico: "MX",
	peru: "PE",
	jordan: "JO",
	tunisia: "TN",
	senegal: "SN",
	france: "FR",
	spain: "ES",
};

/**
 * Language full-name → BCP 47 tag. Keyed on `lookupKey`. `"English and
 * Shona"` is handled as a special case by `resolveLanguage` (not here),
 * because it's a compound the table can't express cleanly.
 */
const LANGUAGE_TO_TAG: Readonly<Record<string, string>> = {
	english: "en",
	arabic: "ar",
	spanish: "es",
	french: "fr",
	vietnamese: "vi",
	slovenian: "sl",
	portuguese: "pt",
	swahili: "sw",
	chinese: "zh",
	mandarin: "zh",
	hindi: "hi",
	indonesian: "id",
	bahasa: "id",
	mongolian: "mn",
	russian: "ru",
	german: "de",
	italian: "it",
};

export type Resolution<T> =
	| { readonly ok: true; readonly value: T; readonly note?: string }
	| { readonly ok: false; readonly reason: string };

/** Country full-name → ISO alpha-2, or an unmapped report reason. */
export function resolveCountry(raw: string): Resolution<string> {
	const trimmed = raw.trim();
	if (trimmed === "") return { ok: false, reason: "country is blank" };
	const code = COUNTRY_TO_CODE[lookupKey(trimmed)];
	if (!code) return { ok: false, reason: `unmapped country "${trimmed}"` };
	return { ok: true, value: code };
}

/**
 * Language full-name → BCP 47 tag. Two live edge cases:
 *  - blank → unmapped (reported).
 *  - "English and Shona" → `en` with a flag note (open-question default:
 *    Shona isn't a supported locale and the site is English-primary).
 */
export function resolveLanguage(raw: string): Resolution<string> {
	const trimmed = raw.trim();
	if (trimmed === "") return { ok: false, reason: "language is blank" };

	// Open-question default #2: "English and Shona" → en (flagged).
	if (lookupKey(trimmed) === lookupKey("English and Shona")) {
		return { ok: true, value: "en", note: `"${trimmed}" defaulted to en (Shona unsupported)` };
	}

	const tag = LANGUAGE_TO_TAG[lookupKey(trimmed)];
	if (!tag) return { ok: false, reason: `unmapped language "${trimmed}"` };
	return { ok: true, value: tag };
}

export interface NameProposal {
	/** The single token we'd publish — never a surname. */
	readonly firstName: string;
	/** All whitespace-separated tokens in the original name. */
	readonly tokens: readonly string[];
	/** Multi-token name: held for editorial confirmation before publish. */
	readonly needsReview: boolean;
	/**
	 * True when the name order is given-name-last (Vietnamese). The
	 * proposed `firstName` is then the LAST token, but the row is still
	 * held — first-token would publish the family name.
	 */
	readonly givenNameLast: boolean;
}

/**
 * Propose a publishable first name from a full name, safeguarding-first.
 *
 * Default = first whitespace token. For given-name-last locales
 * (Vietnamese), the given name is the LAST token, so we propose that
 * instead — but either way a multi-token name is flagged `needsReview`
 * and never auto-published, so a surname can't slip through on a guess.
 */
export function proposeFirstName(
	rawName: string,
	opts: { readonly givenNameLast?: boolean } = {},
): NameProposal {
	const tokens = rawName.trim().split(/\s+/).filter(Boolean);
	const givenNameLast = opts.givenNameLast ?? false;
	const firstName =
		tokens.length === 0
			? ""
			: givenNameLast
				? (tokens[tokens.length - 1] ?? "")
				: (tokens[0] ?? "");
	return {
		firstName,
		tokens,
		needsReview: tokens.length > 1,
		givenNameLast,
	};
}

/** URL-safe slug from a name token: lowercase, diacritic-free, hyphenated. */
export function slugify(raw: string): string {
	return raw
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Build a voice id `<firstname-slug>-<cc>-<NNN>` (e.g. `mariam-eg-001`),
 * matching the existing campaign ids (`carlos-br-002`). `seq` is 1-based
 * and zero-padded to three digits. The id is generated once and
 * persisted in the manifest — never recomputed from a live counter — so
 * inserting earlier intake rows can't shift existing slugs.
 */
export function makeVoiceId(firstNameSlug: string, countryCode: string, seq: number): string {
	const nnn = String(seq).padStart(3, "0");
	return `${firstNameSlug}-${countryCode.toLowerCase()}-${nnn}`;
}

/**
 * Strip a quote of its wrapping straight/curly quotation marks and trim.
 * The intake quotes arrive wrapped in `"…"` / `“…”`; the design supplies
 * its own quotation styling, so the stored `pullQuote` shouldn't carry
 * literal quote characters. Length is measured on the result.
 */
export function normaliseQuote(raw: string): string {
	let q = raw.trim();
	const open = q.charAt(0);
	const close = q.charAt(q.length - 1);
	const isWrap =
		q.length >= 2 &&
		(open === '"' || open === "“" || open === "«") &&
		(close === '"' || close === "”" || close === "»");
	if (isWrap) q = q.slice(1, -1).trim();
	return q;
}

/** Consent hard gate — case/whitespace-insensitive `yes`. */
export function checkConsent(raw: string): boolean {
	return raw.trim().toLowerCase() === "yes";
}

/**
 * Coerce the raw age cell to an integer, or `null` if it isn't one.
 * Range (15–25) is checked by `voiceSchema`, not here — this only
 * answers "is it an integer at all".
 */
export function coerceAge(raw: string): number | null {
	const trimmed = raw.trim();
	if (trimmed === "" || !/^\d+$/.test(trimmed)) return null;
	return Number(trimmed);
}

/** Age constants — mirror `voiceSchema` so the gate matches the validator. */
export const MIN_AGE = 15;
export const MAX_AGE = 25;

/** True when `age` is an integer within the eligible 15–25 range. */
export function ageInRange(age: number | null): age is number {
	return age !== null && Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE;
}
