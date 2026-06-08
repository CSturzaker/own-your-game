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
 * `?from=squad&country=…`) is DEV-48; DEV-43 walks the whole list.
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
 * The page `<title>` body for a player card: `"Amina · Kenya"`.
 * `BaseLayout` appends ` · Own Your Game`, so this omits the suffix.
 *
 * Age is deliberately omitted (DEV-112): the title appears in the tab,
 * search results, and social shares, so dropping it keeps a minor's age
 * out of public, indexable metadata — a safeguarding gain.
 */
export function playerTitle(voice: Voice): string {
	return `${voice.firstName} · ${countryName(voice.countryCode)}`;
}

/**
 * The Open Graph image for a player card — the portrait, sized for the
 * card hero.
 *
 * Undefined when the voice has no `portraitImageId` (use the silhouette,
 * so there's nothing to share) or when `portraitUrl` returns a
 * non-absolute string — which it does when `PUBLIC_CF_IMAGES_ACCOUNT_HASH`
 * is unset (local dev before `.env.local` carries it). Either way
 * `BaseLayout` falls back to the site default OG image (`/og/default.png`).
 *
 * The voice's share image is its real Cloudflare Images portrait — there
 * is deliberately no generated per-voice card. The old "name + theme +
 * age + city" card was dropped in the DEV-108 trim (theme/age are no
 * longer surfaced, and DEV-114 removed share-as-image), so DEV-81 only
 * generates the generic page/fallback cards, not per-voice ones.
 */
export function playerOgImage(voice: Voice): string | undefined {
	if (!voice.portraitImageId) return undefined;
	const url = portraitUrl(voice.portraitImageId, "card");
	return /^https?:\/\//i.test(url) ? url : undefined;
}
