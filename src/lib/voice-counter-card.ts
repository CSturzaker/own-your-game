/**
 * Voice counter card — copy strings.
 *
 * The Astro shell (`src/components/home/VoiceCounterCard.astro`) is
 * entirely composition; only these strings need pinning so the i18n
 * epic has a single import target.
 */

// i18n: voice counter card copy — translate in DEV-70.
export const VOICE_COUNTER_CARD_COPY = {
	/** Eyebrow above the number. */
	label: "The voice counter",
	/** Live-row text under normal motion on desktop. */
	liveLong: "Young voices — and counting",
	/** Live-row text on mobile and under reduced motion. */
	liveShort: "Voices and counting",
	/** Live-row text when the error fallback renders. */
	liveError: "As of 09:42 GMT — reconnecting",
	/** Description block beneath the live row (desktop only). */
	description:
		"Every voice is a young person aged 11–18 who recorded a video and added their name to the letter.",
	/** Description block when the error fallback renders. */
	descriptionError:
		"Live counter temporarily offline. The number above was correct at 09:42 GMT today.",
	/** sr-only stand-in for the number while voices data is loading. */
	loadingNumber: "Loading voice count",
} as const;
