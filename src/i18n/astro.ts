/**
 * Astro-component convenience wrapper around `t` / `tList`.
 *
 * In a component's frontmatter:
 *
 *   import { makeT } from "~/i18n/astro";
 *   const { t, tList } = makeT(Astro.currentLocale);
 *   ...
 *   <h1>{t("about.title")}</h1>
 *   {tList("about.body").map((p) => <p>{p}</p>)}
 *
 * `makeT` resolves the (possibly undefined) `Astro.currentLocale` to a
 * known locale once, so callers don't repeat `resolveLocale` or thread
 * the locale through every call.
 */

import { resolveLocale } from "~/i18n/config";
import { t as rawT, tList as rawTList } from "~/i18n/t";

export interface BoundT {
	/** Resolve a key to a string, with `{var}` substitution. */
	t: (key: string, vars?: Record<string, string | number>) => string;
	/** Resolve a key to a string array (repeated text blocks). */
	tList: (key: string) => readonly string[];
	/** The resolved locale these helpers are bound to. */
	locale: ReturnType<typeof resolveLocale>;
}

export function makeT(locale: string | undefined): BoundT {
	const resolved = resolveLocale(locale);
	return {
		t: (key, vars) => rawT(key, resolved, vars),
		tList: (key) => rawTList(key, resolved),
		locale: resolved,
	};
}
