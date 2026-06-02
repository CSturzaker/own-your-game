/**
 * UI string translation lookup.
 *
 * `t(key, locale)` resolves a dot-path key (e.g. `"header.nav.home"`)
 * against the locale's dictionary, falling back to English when the
 * locale hasn't translated that key, and substitutes `{var}`
 * placeholders. `tList` is the array equivalent for repeated text blocks
 * (the About body paragraphs and closing pair).
 *
 * **Build-time / server-side only.** This module statically imports all
 * five dictionaries, so importing it into a React island would ship
 * every translation to the browser. Islands instead receive the
 * resolved strings (or `{var}` templates) as props from their Astro
 * host, and use `interpolate` from `~/i18n/interpolate` for any
 * client-side count substitution. Astro components use `makeT` from
 * `~/i18n/astro`.
 *
 * Fallback contract:
 *   - A key missing in the requested locale falls back to English.
 *   - The sentinel value `"TODO: translate"` (see {@link TODO_MARKER})
 *     counts as "present but untranslated" — it satisfies the key-parity
 *     CI guard but resolves to the English string at runtime, so a
 *     half-translated locale shows English rather than the marker.
 *   - A key missing (or non-string) in English too is a content bug and
 *     throws, rather than rendering an empty string.
 */

import { DEFAULT_LOCALE, type Locale } from "~/i18n/config";
import { interpolate } from "~/i18n/interpolate";
import ar from "~/i18n/dictionaries/ar.json";
import en from "~/i18n/dictionaries/en.json";
import es from "~/i18n/dictionaries/es.json";
import fr from "~/i18n/dictionaries/fr.json";
import pt from "~/i18n/dictionaries/pt.json";

/**
 * Stub value for a key that exists in a non-English dictionary but
 * hasn't been translated yet. Lets us ship complete key sets (the CI
 * guard enforces parity) while rendering the English fallback until a
 * real translation lands.
 */
export const TODO_MARKER = "TODO: translate";

type DictValue = string | string[] | { [key: string]: DictValue };
type Dictionary = { [key: string]: DictValue };

const DICTIONARIES: Record<Locale, Dictionary> = {
	en: en,
	es: es,
	fr: fr,
	ar: ar,
	pt: pt,
};

/** Walk a dot-path into a dictionary; returns undefined if any hop misses. */
function getPath(dict: Dictionary, key: string): DictValue | undefined {
	let node: DictValue | undefined = dict;
	for (const segment of key.split(".")) {
		if (typeof node !== "object" || Array.isArray(node) || node === null) return undefined;
		node = node[segment];
	}
	return node;
}

/** A locale's string value for a key, or undefined when untranslated. */
function resolveString(locale: Locale, key: string): string | undefined {
	const value = getPath(DICTIONARIES[locale], key);
	if (typeof value !== "string" || value === TODO_MARKER) return undefined;
	return value;
}

/** A locale's array value for a key, or undefined when untranslated. */
function resolveList(locale: Locale, key: string): string[] | undefined {
	const value = getPath(DICTIONARIES[locale], key);
	if (!Array.isArray(value)) return undefined;
	return value;
}

/**
 * Resolve a translation key to a string for `locale`, falling back to
 * English, then substituting `{var}` placeholders.
 *
 * Throws if the key resolves to no string in either the locale or
 * English — a content bug worth failing the build for.
 */
export function t(key: string, locale: Locale, vars?: Record<string, string | number>): string {
	const value = resolveString(locale, key) ?? resolveString(DEFAULT_LOCALE, key);
	if (value === undefined) {
		throw new Error(`Missing i18n string for key "${key}" (no value in "${locale}" or English)`);
	}
	return interpolate(value, vars);
}

/**
 * Resolve a translation key to a string array for `locale`, falling back
 * to English. Used for the repeated text blocks (About body + closing).
 * Throws if the key resolves to no array in either locale or English.
 */
export function tList(key: string, locale: Locale): readonly string[] {
	const value = resolveList(locale, key) ?? resolveList(DEFAULT_LOCALE, key);
	if (value === undefined) {
		throw new Error(`Missing i18n list for key "${key}" (no array in "${locale}" or English)`);
	}
	return value;
}
