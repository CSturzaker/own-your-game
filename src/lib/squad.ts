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

import { formatVoiceCount } from "~/lib/header";
import { numberToWords } from "~/lib/number-words";

// i18n: squad page chrome — translate in the i18n epic (DEV-70).
export const SQUAD_COPY = {
	/** Eyebrow above the headline. */
	kicker: "The full squad",
	/** Supporting line beside (desktop) / below (mobile) the headline. */
	subtitle: "Every young person who recorded a video and added their name to the letter.",
} as const;

/**
 * Desktop H1 — the count spelled out, sentence-cased, with a full
 * stop: "Two hundred and forty-seven." Rendered uppercase by CSS, so
 * the casing here only matters to non-visual consumers.
 */
export function squadHeadlineDesktop(count: number): string {
	const words = numberToWords(count);
	const capitalised = words.charAt(0).toUpperCase() + words.slice(1);
	return `${capitalised}.`;
}

/**
 * Mobile H1 — numeral plus "voices.": "247 voices." Uses
 * {@link formatVoiceCount} so counts past 999 carry the thousands
 * separator, matching the header pill and home CTAs.
 */
export function squadHeadlineMobile(count: number): string {
	return `${formatVoiceCount(count)} voices.`;
}
