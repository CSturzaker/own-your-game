/**
 * Letter page structural constants.
 *
 * The letter prose itself is canonical content in
 * `content/letter/{lang}.md` (loaded via `getLetter()`). The page chrome
 * strings (kicker, headline, subtitle, waypoint labels, share copy) moved
 * into the translation dictionary in DEV-70 — `Letter.astro` and
 * `ShareSection.astro` resolve them via `t()`. Only the structural bits
 * that aren't display copy live here.
 */

/**
 * The four rhetorical waypoints the right-rail navigator (DEV-52)
 * exposes, in order. Each id must match a `<!-- waypoint:ID -->` anchor
 * in every `content/letter/{lang}.md` (and therefore `WAYPOINT_NAMES` in
 * `src/lib/letter-render.ts`) — the rail observes `#waypoint-${id}`.
 * Display labels are resolved per-locale via `t("letter.waypoints.<id>")`.
 */
export const LETTER_WAYPOINT_IDS = ["opening", "question", "ask", "signoff"] as const;

export type LetterWaypointId = (typeof LETTER_WAYPOINT_IDS)[number];

/** A waypoint as the rail consumes it: stable id + resolved label. */
export interface LetterWaypoint {
	readonly id: LetterWaypointId;
	readonly label: string;
}

/**
 * Canonical, shareable letter URL — copied to the clipboard by the
 * share section. Hard-coded because Astro `site` isn't configured yet
 * (the Cloudflare account isn't provisioned — same standing debt as the
 * OG images). When `site` lands, derive this from `Astro.site` instead.
 */
export const LETTER_SHARE_URL = "https://own-your-game.org/letter";

/**
 * Open Graph image for the letter, opened by "Share as image".
 *
 * TODO(DEV-81): placeholder — the launch-readiness OG image generator
 * produces this asset; the path 404s until then.
 */
export const LETTER_OG_IMAGE_URL = "https://own-your-game.org/og/letter.png";
