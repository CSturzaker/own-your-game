/**
 * Tile helpers — position padding and accessible-name construction.
 *
 * The Astro component (`src/components/Tile.astro`) is a thin shell
 * over these resolvers, so Vitest can pin the contract Astro itself
 * can't reach.
 */

import { interpolate } from "~/i18n/interpolate";
import { countryName } from "~/lib/countries";
import type { VoiceIndexEntry } from "~/lib/voice-index";

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
 * Build the link's accessible name from a locale template. Screen
 * readers announce "Amara, Nigeria (NG), position 01" — the full
 * country name for comprehension, plus the visible code and padded
 * position verbatim so every visible token is a substring of the
 * accessible name (WCAG 2.5.3 Label in Name).
 *
 * Takes the `tile.accessibleName` template (`"{name}, {country} ({code}),
 * position {position}"`) so the wording localises: Astro callers pass
 * `t("tile.accessibleName")`; React tiles receive the template as a prop
 * (the dictionaries never ship to the client). Country names stay in
 * English for now — localising them is a separate refinement.
 */
export function tileAccessibleName(
	template: string,
	voice: Pick<VoiceIndexEntry, "firstName" | "countryCode">,
	position: number,
): string {
	return interpolate(template, {
		name: voice.firstName,
		country: countryName(voice.countryCode),
		code: voice.countryCode,
		position: padPosition(position),
	});
}

/**
 * Tile route. The Player Card epic will finalise the URL shape —
 * could be `/voice/:id`, could be a query parameter that opens as a
 * modal. The Tile just needs a stable URL it can render today.
 */
export function tileHref(voice: Pick<VoiceIndexEntry, "id">): string {
	return `/voice/${voice.id}`;
}
