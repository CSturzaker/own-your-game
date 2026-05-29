/**
 * About page copy + composition helpers.
 *
 * Strings live here so the page shell (`src/pages/about.astro`) stays a
 * thin render, matching the home/letter convention. Marked for i18n —
 * the translation epic (DEV-70) swaps these literals for key lookups;
 * until then the English copy is the source of truth.
 *
 * Copy follows the prototype's "Replacement copy pass · May 2026"
 * (`design/handoff/project/hifi-about.jsx`), chosen over the DEV-64/65/66
 * issue prose where the two diverged in kind — the divergence is noted
 * in each PR. Apostrophes are the typographic form (’) to match the
 * prototype.
 */

// i18n: about page copy — translate in DEV-70 (i18n lookups).
export const ABOUT_COPY = {
	/** Eyebrow above the page title. */
	kicker: "A youth-led campaign · 2026 World Cup",
	/** Page title (display, hero-about size). */
	title: "About Own Your Game.",
	/** Supporting line beneath the title, leading into the question. */
	lede: "Own Your Game is a youth-led global campaign built around one simple question:",
	/** The campaign's central question — the call half of the moment. */
	question: "Whose game is it anyway?",
	/** Bridge line between the question and the answer. */
	questionBridge:
		"The power of the question is not the question itself, but the answer young people give back:",
	/** The answer — the response half of the designed moment. */
	answer: "It’s ours.",
} as const;
