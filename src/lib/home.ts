/**
 * Home page copy + tiny composition helpers.
 *
 * Strings live here so the page shell stays a thin render. They're
 * marked for i18n — the translation epic will swap these literals
 * for translation-key lookups; until then the English copy is the
 * source of truth.
 *
 * The shape of this module is intentionally small: the home page is
 * mostly composition of design-system primitives, and the only
 * computed strings are the two CTA labels (one templated with the
 * voice count). Anything more page-shaped (rotation logic, counter
 * card content) ships with the issue that owns it.
 */

import { formatVoiceCount } from "~/lib/header";

// i18n: home hero copy — translate in DEV-70 (i18n lookups).
export const HOME_COPY = {
	/** Kicker above the hero wordmark — desktop variant. */
	kickerDesktop: "An open letter · 2026 World Cup",
	/** Kicker above the hero wordmark — mobile variant, shorter. */
	kickerMobile: "An open letter · 2026",
	/** Hero tagline (display-italic), 1 of 3 placements site-wide. */
	tagline: "Whose game is it anyway?",
	/** Supporting paragraph beneath the tagline. */
	supportingParagraph:
		"Young people across dozens of countries. One open letter to FIFA. About community, friendship, confidence, joy, belonging — and the future of the game we love.",
	/** Primary CTA label (left-aligned, before the arrow icon). */
	ctaLetter: "Read the letter",
	/** Ghost CTA prefix; suffix is the live voice count from the loader. */
	ctaSquadPrefix: "Meet all",
} as const;

/**
 * "Meet all 247" — used as the ghost CTA label on the hero.
 *
 * Uses {@link formatVoiceCount} so counts that pass 999 render with
 * the en-US thousands separator, matching how the Header pill and
 * Footer description format the same number.
 */
export function ctaSquadLabel(count: number): string {
	return `${HOME_COPY.ctaSquadPrefix} ${formatVoiceCount(count)}`;
}
