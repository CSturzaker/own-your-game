/**
 * Minimal Voice type — placeholder until DEV-29 ships the
 * Zod-derived schema in `schemas/voice.ts`.
 *
 * The shape here is intentionally small: just the fields the Tile
 * (and the Portrait inside it) need to render. The pipeline will
 * extend this with theme tags, transcripts, video IDs, age band,
 * etc. — keep callers narrow until then.
 *
 * Safeguarding: `firstName` only — never `lastName`. Surnames don't
 * exist on the public schema; do not add them in any future revision.
 */

import type { TagTheme } from "~/lib/primitives";

export interface Voice {
	/** Stable id used as the portrait seed and the player-card route. */
	readonly id: string;
	/** First name only — surnames are never stored. */
	readonly firstName: string;
	/** Country name in the campaign's display language (English at launch). */
	readonly country: string;
	/** ISO 3166-1 alpha-3 country code, e.g. "NGA". */
	readonly countryCode: string;
	/** Optional theme tag — may be unassigned during early collection. */
	readonly theme?: TagTheme;
}
