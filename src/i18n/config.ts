/**
 * i18n locale configuration — the single source of truth for the set of
 * languages the site routes, which one is the default (unprefixed), and
 * which read right-to-left.
 *
 * `astro.config.mjs` imports {@link LOCALES}, {@link DEFAULT_LOCALE}, and
 * {@link FALLBACK} so the build-time routing config and the app-side
 * helpers can never drift. `tests/unit/i18n/config-astro-sync.test.ts`
 * guards that link.
 *
 * Adding a language is a four-step change (see `docs/ops/i18n.md`):
 *   1. Add the code here (and to `RTL_LOCALES` if it reads RTL).
 *   2. Add a dictionary file under `src/i18n/dictionaries/` (DEV-70).
 *   3. Add `content/letter/{code}.md` (the campaign team translates it).
 *   4. Nothing else — routing, the switcher, and `localiseUrl` all read
 *      from this list.
 *
 * The locale set deliberately mirrors `LETTER_LANGS` in `schemas/letter.ts`
 * (`en/es/fr/ar/pt`); the two unions are structurally identical so a
 * `Locale` is assignable wherever a `LetterLang` is expected.
 */

/** Every routed locale. The first entry is the campaign's launch language. */
export const LOCALES = ["en", "es", "fr", "ar", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The default locale. With `prefixDefaultLocale: false` (see
 * `astro.config.mjs`) this locale is served from the root with no URL
 * prefix — `/letter`, not `/en/letter`.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Locales that carry a URL prefix — every locale except the default.
 * Drives `getStaticPaths` for the `[lang]/` page routes.
 */
export const NON_DEFAULT_LOCALES: readonly Locale[] = LOCALES.filter(
	(locale) => locale !== DEFAULT_LOCALE,
);

/**
 * Locales that read right-to-left. Consumed in DEV-71 to set
 * `<html dir="rtl">` and flip directional layout. Kept here so the RTL
 * decision lives with the rest of the locale metadata rather than being
 * hard-coded against `"ar"` in the layout.
 */
export const RTL_LOCALES = ["ar"] as const;

/**
 * Graceful fallback to English is handled at the content layer, not via
 * Astro's `i18n.fallback`: the translation dictionary returns English
 * for untranslated keys (DEV-70) and the `content/letter/{lang}.md`
 * files ship English copy until translated. Astro's page-level fallback
 * is unused — in a static build it shadows the explicit `[lang]/` routes
 * with empty renders (see `astro.config.mjs` and `docs/ops/i18n.md`).
 */

/** Type guard: is the given string one of the routed locales? */
export function isLocale(input: string | undefined): input is Locale {
	return input !== undefined && (LOCALES as readonly string[]).includes(input);
}

/**
 * Coerce an arbitrary value (e.g. `Astro.currentLocale`, which is typed
 * `string | undefined`) to a known {@link Locale}, defaulting to
 * {@link DEFAULT_LOCALE} when it isn't recognised.
 */
export function resolveLocale(input: string | undefined): Locale {
	return isLocale(input) ? input : DEFAULT_LOCALE;
}

/** Does the given locale read right-to-left? */
export function isRtl(locale: string | undefined): boolean {
	return (RTL_LOCALES as readonly string[]).includes(resolveLocale(locale));
}
