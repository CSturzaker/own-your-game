/**
 * Tile helpers — position padding and accessible-name construction.
 *
 * The Astro component (`src/components/Tile.astro`) is a thin shell
 * over these resolvers, so Vitest can pin the contract Astro itself
 * can't reach.
 */

import { countryName } from "~/lib/countries";
import type { Voice } from "~/lib/voice";

/**
 * Pad a position number to at least 2 digits (or 3 once we cross
 * 100). Matches the prototype: starting eleven shows `01..11`, full
 * squad shows `001..247`.
 */
export function padPosition(num: number): string {
	const pad = num >= 100 ? 3 : 2;
	return String(num).padStart(pad, "0");
}

/**
 * Build the link's accessible name. Screen readers announce
 * "Amara, Nigeria (NG), position 01" — the full country name for
 * comprehension, plus the visible code and padded position verbatim
 * so every visible token is a substring of the accessible name
 * (WCAG 2.5.3 Label in Name).
 */
export function tileAccessibleName(voice: Voice, position: number): string {
	return `${voice.firstName}, ${countryName(voice.countryCode)} (${voice.countryCode}), position ${padPosition(position)}`;
}

/**
 * Tile route. The Player Card epic will finalise the URL shape —
 * could be `/voice/:id`, could be a query parameter that opens as a
 * modal. The Tile just needs a stable URL it can render today.
 */
export function tileHref(voice: Voice): string {
	return `/voice/${voice.id}`;
}
