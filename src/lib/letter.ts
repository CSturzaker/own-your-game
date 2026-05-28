/**
 * Letter page copy + composition helpers.
 *
 * Mirrors `src/lib/home.ts`: the page shell stays a thin render and the
 * computed strings (the count-templated headline) live here so Vitest
 * can pin them without rendering Astro. Strings are marked for i18n —
 * the translation epic swaps these literals for translation-key lookups.
 *
 * The letter prose itself is NOT here — that's canonical content in
 * `content/letter/{lang}.md`, loaded via `getLetter()`. This module is
 * only the surrounding page chrome (kicker, date, headline, subtitle).
 */

import { formatVoiceCount } from "~/lib/header";

// i18n: letter page chrome — translate in the i18n epic (DEV-70).
export const LETTER_COPY = {
	/** Eyebrow above the headline. */
	kicker: "An open letter",
	/**
	 * Publication date, human-readable. The campaign team sets the final
	 * date at launch; this is a placeholder per DEV-51. Keep `dateISO` in
	 * sync — it feeds the `<time datetime>` machine-readable attribute.
	 */
	date: "26 May 2026",
	dateISO: "2026-05-26",
	/** Supporting subtitle beneath the headline. */
	subtitle:
		"A youth-led letter, written ahead of the 2026 World Cup. About fairness, belonging, friendship — and the games we share.",
} as const;

/**
 * "From 247 young people to FIFA" — the letter page H1.
 *
 * Uses {@link formatVoiceCount} so counts past 999 carry the en-US
 * thousands separator, matching the Header pill and home CTAs.
 */
export function letterHeadline(count: number): string {
	return `From ${formatVoiceCount(count)} young people to FIFA`;
}

/**
 * The four rhetorical waypoints the right-rail navigator (DEV-52)
 * exposes. Each `id` must match a `<!-- waypoint:ID -->` anchor in
 * `content/letter/en.md` (and therefore `WAYPOINT_NAMES` in
 * `src/lib/letter-render.ts`) — the rail observes `#waypoint-${id}`.
 * Labels are i18n targets (DEV-70).
 */
export const LETTER_WAYPOINTS = [
	{ id: "opening", label: "Opening" },
	{ id: "question", label: "The question" },
	{ id: "ask", label: "The ask" },
	{ id: "signoff", label: "Sign-off" },
] as const;

export type LetterWaypoint = (typeof LETTER_WAYPOINTS)[number];
