/**
 * SEO helpers shared by every page through `BaseLayout`.
 *
 * Kept as pure functions so the layout's Astro frontmatter (which we
 * can't unit-test directly) stays trivial and the interesting
 * behaviour lives somewhere Vitest can reach.
 */

import { LOCALES, type Locale } from "~/i18n/config";

/** The `og:site_name` / brand string used across social cards. */
export const SITE_NAME = "Own Your Game";

/**
 * The Twitter/X `@handle` for `twitter:site`, or `undefined` until the
 * campaign confirms one. Emitted only when set — pointing the tag at a
 * non-existent handle is worse than omitting it. Set this (and document
 * it) once the campaign account exists.
 */
export const TWITTER_SITE: string | undefined = undefined;

/**
 * Map an app locale to its Open Graph `og:locale` value
 * (`language_TERRITORY`). Facebook/LinkedIn expect this form, not the
 * bare `en`/`es` route code. `ar_AR` is Facebook's canonical Arabic
 * entry (there is no single Arabic territory). Portuguese uses `pt_BR`
 * to match the Brazilian register of the shipped translation.
 */
const OG_LOCALE: Record<Locale, string> = {
	en: "en_GB",
	es: "es_ES",
	fr: "fr_FR",
	ar: "ar_AR",
	pt: "pt_BR",
};

/** The `og:locale` value for a locale. */
export function ogLocale(locale: Locale): string {
	return OG_LOCALE[locale];
}

/**
 * The `og:locale:alternate` values — every locale's OG form except the
 * current one. Tells crawlers the same page exists in other languages.
 */
export function ogLocaleAlternates(locale: Locale): string[] {
	return LOCALES.filter((other) => other !== locale).map((other) => OG_LOCALE[other]);
}

/**
 * The canonical URL for a page: the origin-qualified pathname, with any
 * query string and hash dropped (filtered/anchored variants must not
 * each claim to be canonical). Falls back to the bare pathname when the
 * site origin is unknown (e.g. unit tests without a configured `site`).
 */
export function resolveCanonical(url: URL, site?: URL): string {
	if (!site) return url.pathname;
	return new URL(url.pathname, site).toString();
}

/**
 * The default campaign meta description now lives in the translation
 * dictionary (`meta.description`) so it localises with the page; see
 * `src/i18n/dictionaries/en.json`. `BaseLayout` reads it via `t()`.
 */

/**
 * Default Open Graph image path, relative to the site root. The actual
 * PNG asset is supplied separately as part of the brand handoff; until
 * it lands, link previews fall back to whatever the host serves at
 * this path (a placeholder during local dev is fine).
 */
export const DEFAULT_OG_IMAGE = "/og/default.png";

/**
 * Resolve an Open Graph image URL.
 *
 * - When `input` is undefined, falls back to {@link DEFAULT_OG_IMAGE}.
 * - When the path is already absolute (`http(s)://…`), returns it
 *   verbatim — useful for CMS-provided social images.
 * - When `site` is provided, root-relative paths are upgraded to
 *   absolute URLs. Social crawlers (Facebook, Twitter/X, Slack) require
 *   absolute `og:image` URLs to scrape reliably; root-relative paths
 *   work in browsers but break previews.
 */
export function resolveOgImage(input: string | undefined, site?: URL): string {
	const path = input ?? DEFAULT_OG_IMAGE;
	if (/^https?:\/\//i.test(path)) return path;
	if (!site) return path;
	return new URL(path, site).toString();
}
