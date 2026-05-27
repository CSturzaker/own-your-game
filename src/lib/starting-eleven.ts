/**
 * Starting eleven — copy strings and formation slicing.
 *
 * The Astro shell (`src/components/home/StartingEleven.astro`) is a
 * thin render over these constants and the slicing helper; the lib
 * here is the unit-testable surface.
 */

import type { Voice } from "~/lib/voice";

// i18n: starting-eleven copy — translate in DEV-70.
export const STARTING_ELEVEN_COPY = {
	/** Eyebrow above the section heading. */
	kicker: "Today's starting eleven",
	/** Section H2 — display, bold, condensed, uppercase. */
	heading: "New Players. New Stories. Same Question.",
	/** Supporting paragraph — desktop only per the prototype. */
	supporting:
		"Every twelve seconds, another young person enters the game. Watch their videos. Hear why they are asking: whose game is it anyway?",
	/** Pause-rotation ghost button label — stub, DEV-39 wires it. */
	pauseLabel: "Pause rotation",
	/** "Bring on the next eleven" amber CTA — stub, DEV-39 wires it. */
	nextElevenLabel: "Bring on the next eleven",
	/** Pill shown to users with prefers-reduced-motion. */
	reducedMotionPill: "Reduced motion — rotation paused",
} as const;

/**
 * Format the rotation countdown — "Next rotation in 8s". Pulled out
 * so DEV-39 (the timer) and any future i18n pass share one string
 * shape. `seconds` may be zero; we don't pluralise.
 */
export function countdownLabel(seconds: number): string {
	return `Next rotation in ${seconds}s`;
}

/** Tiles shown on desktop — the full 1-4-3-3 formation. */
export const DESKTOP_TILE_COUNT = 11;

/**
 * Tiles shown on mobile — 8 in a 2×4 grid per the prototype, not
 * the full 11. Fewer tiles keeps the above-the-fold density right
 * on a phone without scrolling forever before reaching the rest
 * of the page.
 */
export const MOBILE_TILE_COUNT = 8;

/**
 * Formation row partitions for the desktop 1-4-3-3. The four rows
 * are keeper (1), defenders (4), midfielders (3), forwards (3).
 *
 * Numbering convention is fixed: position 1 = keeper, 2–5 =
 * defenders left→right, 6–8 = midfielders, 9–11 = forwards.
 *
 * When fewer than 11 voices are passed the later rows shrink or
 * disappear — empty rows are filtered out so the layout stays tight
 * rather than leaving phantom gaps.
 */
export interface FormationTile {
	readonly voice: Voice;
	/** 1-indexed position number rendered on the tile. */
	readonly position: number;
}

export interface FormationRows {
	readonly keeper: readonly FormationTile[];
	readonly defenders: readonly FormationTile[];
	readonly midfielders: readonly FormationTile[];
	readonly forwards: readonly FormationTile[];
}

/**
 * Slice a voices array into the four formation rows. The caller
 * is expected to have already sliced to <= 11; anything beyond
 * 11 is dropped (keeps the formation render predictable).
 */
export function formationRows(voices: readonly Voice[]): FormationRows {
	const eleven = voices.slice(0, DESKTOP_TILE_COUNT);
	return {
		keeper: eleven.slice(0, 1).map((voice, i) => ({ voice, position: i + 1 })),
		defenders: eleven.slice(1, 5).map((voice, i) => ({ voice, position: i + 2 })),
		midfielders: eleven.slice(5, 8).map((voice, i) => ({ voice, position: i + 6 })),
		forwards: eleven.slice(8, 11).map((voice, i) => ({ voice, position: i + 9 })),
	};
}
