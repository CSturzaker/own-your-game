/**
 * `localiseUrl` — convert an internal path from any locale to the
 * equivalent path in a target locale.
 *
 * Introduced here (DEV-69) so the shared chrome (Wordmark, Header nav,
 * Footer links) and page CTAs render locale-correct internal links.
 * DEV-72 reuses the same helper to drive the footer language switcher
 * and adds the end-to-end coverage.
 *
 * Rules:
 *   - The default locale carries no prefix (`prefixDefaultLocale: false`),
 *     so `localiseUrl('/letter', 'en')` is `/letter`, not `/en/letter`.
 *   - Any existing known non-default prefix is stripped before the target
 *     prefix is applied, so the helper is idempotent and re-targetable:
 *     `localiseUrl('/es/letter', 'fr')` is `/fr/letter`.
 *   - Query strings and hash fragments are preserved verbatim:
 *     `localiseUrl('/squad?country=KE#x', 'es')` is
 *     `/es/squad?country=KE#x`.
 *   - An unknown target locale is treated as the default (no prefix)
 *     rather than minting a bogus `/xx/` route.
 *
 * Only the leading path segment is inspected for a locale; a path like
 * `/about/es` (where `es` is a deeper segment, not a locale prefix) is
 * left untouched.
 *
 * @example
 * localiseUrl('/letter', 'es')                 // '/es/letter'
 * localiseUrl('/es/letter', 'en')              // '/letter'
 * localiseUrl('/', 'ar')                        // '/ar'
 * localiseUrl('/voice/abc?from=squad', 'pt')   // '/pt/voice/abc?from=squad'
 */

import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "~/i18n/config";

/** Split a path into its pathname and the trailing `?query#hash` suffix. */
function splitSuffix(path: string): { pathname: string; suffix: string } {
	const queryIndex = path.indexOf("?");
	const hashIndex = path.indexOf("#");

	let cut = path.length;
	if (queryIndex !== -1) cut = Math.min(cut, queryIndex);
	if (hashIndex !== -1) cut = Math.min(cut, hashIndex);

	return { pathname: path.slice(0, cut), suffix: path.slice(cut) };
}

/**
 * Remove a leading known non-default locale segment from a pathname.
 * Returns the pathname unchanged when the first segment isn't a locale.
 */
function stripLocalePrefix(pathname: string): string {
	const segments = pathname.split("/");
	// segments[0] is the empty string before the leading slash.
	const first = segments[1];
	if (first !== undefined && isLocale(first) && first !== DEFAULT_LOCALE) {
		segments.splice(1, 1);
	}
	const stripped = segments.join("/");
	return stripped === "" ? "/" : stripped;
}

export function localiseUrl(path: string, targetLocale: string): string {
	const { pathname, suffix } = splitSuffix(path);

	const base = stripLocalePrefix(pathname);

	// Unknown target → treat as default (unprefixed) rather than inventing
	// a `/xx/` route.
	const locale: Locale = isLocale(targetLocale) ? targetLocale : DEFAULT_LOCALE;

	if (locale === DEFAULT_LOCALE) {
		return `${base}${suffix}`;
	}

	// `/` becomes `/es`; `/letter` becomes `/es/letter`.
	const tail = base === "/" ? "" : base;
	return `/${locale}${tail}${suffix}`;
}

/**
 * The locale a path currently belongs to, read from its leading segment.
 * Returns {@link DEFAULT_LOCALE} when there's no recognised prefix.
 */
export function localeFromPath(path: string): Locale {
	const { pathname } = splitSuffix(path);
	const first = pathname.split("/")[1];
	return isLocale(first) ? first : DEFAULT_LOCALE;
}

/** Re-exported for consumers that want the canonical locale list nearby. */
export { LOCALES };
