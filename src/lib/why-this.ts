/**
 * "Why this letter" band — copy + the count-templated paragraph.
 *
 * The Astro shell (`src/components/home/WhyThisBand.astro`) is pure
 * composition; only paragraph 2 computes (it templates the live
 * voice + country counts). Both live here so Vitest can pin the
 * string shape and the i18n epic has a single import target.
 */

import { formatVoiceCount } from "~/lib/header";

// i18n: why-this band copy — translate in DEV-70.
export const WHY_THIS_COPY = {
	/** Eyebrow above the band heading. */
	kicker: "Why this letter",
	/** Band H2 — display, bold, condensed, uppercase. */
	heading: "The biggest stage. The youngest authors.",
	/** First paragraph (ink) — the "why now" framing. */
	paragraph1:
		"Every four years the planet turns its attention to one sport for one month. We thought that was a good time to ask the next generation what the game looks like from where they stand.",
	/** Link to the About page. */
	aboutLinkLabel: "Read more about the project",
} as const;

/**
 * Second paragraph (ink-2), templated with the live voice count and
 * country count. Counts route through `formatVoiceCount` so they
 * group with the en-US thousands separator consistently with the
 * Header pill, the hero CTA, and the voice counter card.
 *
 * `countryCount` is small (tens, not thousands) so it's rendered
 * raw — no formatter needed.
 */
export function whyThisParagraph2(count: number, countryCount: number): string {
	return `${formatVoiceCount(count)} young people across ${countryCount} countries wrote, recorded, and signed the letter you're about to read. They speak about fairness on the pitch and off it, about who gets to belong, about why we keep playing.`;
}
