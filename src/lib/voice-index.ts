/**
 * Lightweight voice index — the minimal projection of a {@link Voice}
 * needed to *find*, *order*, *label*, *filter*, and *render the tile of* a
 * voice, without the heavy fields a card only needs once it's opened
 * (`pullQuote`, `city`, `videoId`).
 *
 * Why this exists (DEV-107): the player-card overlay mounts on every page
 * (`BaseLayout`) and used to receive the full voice set as inlined island
 * props, so every page carried the whole catalogue — ~245 KB at the
 * campaign's ~350 voices, far past the 100 KB home-HTML budget. The fix is
 * to stop inlining: a page ships nothing voice-shaped, the client fetches
 * this trimmed index once (cached across navigations), and the heavy
 * per-voice data is fetched on demand when a card opens (see
 * `~/lib/voice-index-client`).
 *
 * Field selection rationale:
 *   - `id`            — find, route (`/voice/:id`), React key, portrait seed
 *   - `firstName`     — tile label + accessible name + card heading
 *   - `age`           — squad age filter + card heading
 *   - `countryCode`   — tile flag + accessible name + squad country filter
 *   - `theme`         — squad theme filter + active-set label
 *   - `language`      — squad language filter + caption language
 *   - `publishedAt`   — newest-first sort (the traversal order)
 *   - `portraitImageId` — the tile portrait still
 *
 * Zod-free and DOM-free so it's safe to import from client islands
 * (DEV-76 — Zod must never reach the browser bundle). The `Voice` import is
 * type-only, so it's erased at build time and never pulls the schema in.
 */

import type { Theme } from "~/lib/themes";
import type { Voice } from "~/lib/voice";

export interface VoiceIndexEntry {
	readonly id: string;
	readonly firstName: string;
	readonly age: number;
	readonly countryCode: string;
	readonly theme: Theme;
	readonly language: string;
	readonly publishedAt: string;
	readonly portraitImageId?: string;
}

/**
 * The per-voice payload fetched on demand when a card opens: the full
 * voice plus its transcript (kept out of the index — it can be long and
 * most voices won't have one). `transcript` is omitted when none exists.
 */
export interface VoiceData {
	readonly voice: Voice;
	readonly transcript?: string;
}

/** Project a full voice down to its index entry, dropping the heavy fields. */
export function toVoiceIndexEntry(voice: Voice): VoiceIndexEntry {
	const entry: VoiceIndexEntry = {
		id: voice.id,
		firstName: voice.firstName,
		age: voice.age,
		countryCode: voice.countryCode,
		theme: voice.theme,
		language: voice.language,
		publishedAt: voice.publishedAt,
		...(voice.portraitImageId !== undefined ? { portraitImageId: voice.portraitImageId } : {}),
	};
	return entry;
}

/** Project a full voice list down to the lightweight index. */
export function toVoiceIndex(voices: readonly Voice[]): VoiceIndexEntry[] {
	return voices.map(toVoiceIndexEntry);
}
