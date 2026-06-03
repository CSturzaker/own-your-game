/**
 * Player-card helpers — position, neighbours, and SEO metadata.
 *
 * Pure functions, no React or DOM access, so Vitest can pin the contract
 * the `PlayerCard` island and `Player.astro` page are thin shells over.
 *
 * Ordering: the player card numbers and traverses voices in the same
 * newest-first order the squad grid uses (`sortByNewest`), so a voice's
 * "№ 03" on a direct visit matches its position in the full squad. The
 * active-set-aware traversal (filtered subsets reached via
 * `?from=squad&theme=…`) is DEV-48; DEV-43 walks the whole list.
 */

import { countryName } from "~/lib/countries";
import { portraitUrl } from "~/lib/portrait-url";
import { sortByNewest } from "~/lib/squad-grid";
import type { Voice } from "~/lib/voice";

export interface VoiceNeighbours {
	/** The previous voice in newest-first order, or undefined at the start. */
	readonly prev: Voice | undefined;
	/** The next voice in newest-first order, or undefined at the end. */
	readonly next: Voice | undefined;
}

/**
 * 1-indexed position of a voice within the full newest-first list. Returns
 * 0 when the id isn't found (which shouldn't happen — the route only
 * renders ids that exist).
 */
export function voicePosition(voiceId: string, voices: readonly Voice[]): number {
	const index = sortByNewest(voices).findIndex((v) => v.id === voiceId);
	return index === -1 ? 0 : index + 1;
}

/**
 * The voices immediately before and after the given one in newest-first
 * order. Either side is undefined at the ends of the list, so callers can
 * disable the corresponding prev/next control.
 */
export function voiceNeighbours(voiceId: string, voices: readonly Voice[]): VoiceNeighbours {
	const ordered = sortByNewest(voices);
	const index = ordered.findIndex((v) => v.id === voiceId);
	if (index === -1) return { prev: undefined, next: undefined };
	return { prev: ordered[index - 1], next: ordered[index + 1] };
}

/**
 * The page `<title>` body for a player card: `"Amina, 14 · Kenya"`.
 * `BaseLayout` appends ` · Own Your Game`, so this omits the suffix.
 */
export function playerTitle(voice: Voice): string {
	return `${voice.firstName}, ${voice.age} · ${countryName(voice.countryCode)}`;
}

/**
 * The Open Graph image for a player card — the portrait, sized for the
 * card hero.
 *
 * `portraitUrl` returns a bare `filename?query` when
 * `PUBLIC_PORTRAIT_BASE_URL` is unset (local dev, and everywhere until
 * the R2 bucket is provisioned), which isn't a resolvable social image.
 * In that case we return undefined so `BaseLayout` falls back to the site
 * default OG image. A proper per-voice OG generator is DEV-81.
 */
export function playerOgImage(voice: Voice): string | undefined {
	const url = portraitUrl(voice.portraitFile, "card");
	return /^https?:\/\//i.test(url) ? url : undefined;
}
