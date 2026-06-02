/**
 * Squad page copy + composition helpers.
 *
 * Mirrors `src/lib/letter.ts`: the page shell stays a thin render and
 * the computed strings (the count-templated headlines) live here so
 * Vitest can pin them without rendering Astro. Strings are i18n
 * targets — the translation epic (DEV-70) swaps these literals for
 * translation-key lookups.
 *
 * Source of truth is `design/handoff/project/hifi-squad.jsx`. The
 * prototype's two H1 variants diverge deliberately: desktop spells the
 * count out in words ("Two hundred and forty-seven."), mobile uses the
 * numeral plus "voices." ("247 voices."). We render each at its
 * respective breakpoint — see `squad.astro`.
 */

import { numberToWords } from "~/lib/number-words";

/**
 * Desktop H1 — the count spelled out, sentence-cased, with a full
 * stop: "Two hundred and forty-seven." Rendered uppercase by CSS, so
 * the casing here only matters to non-visual consumers.
 *
 * English only: spelling a number into words is locale-specific (and
 * the translators didn't deliver number words). `Squad.astro` uses this
 * for English and falls back to the numeral form (`squad.headlineMobile`)
 * for other locales — see the note there. The squad kicker/subtitle and
 * the numeral headline live in the translation dictionary.
 */
export function squadHeadlineDesktop(count: number): string {
	const words = numberToWords(count);
	const capitalised = words.charAt(0).toUpperCase() + words.slice(1);
	return `${capitalised}.`;
}
