/**
 * Portrait URL helper.
 *
 * Real portraits live in Cloudflare Images (DEV-95), reached through
 * **flexible variants** — the transform is encoded as a path segment in
 * the delivery URL rather than defined as a named variant in the
 * dashboard. The single reason to do this: face-detection cropping
 * (`gravity=face`) is only available on transform parameters, not on
 * named variants, and it is the most important setting for our
 * phone-orientation source photos.
 *
 * The account hash (the segment after `imagedelivery.net/`) is public —
 * it ships to browsers — and lives in `PUBLIC_CF_IMAGES_ACCOUNT_HASH`.
 *
 * Delivery URL shape:
 *   https://imagedelivery.net/{accountHash}/{imageId}/{transform}
 *
 * `format=auto` lets Cloudflare negotiate AVIF/WebP/JPEG per request, so
 * the helper no longer hard-codes a format. The size argument selects a
 * fixed transform string below.
 *
 * Missing hash: the helper degrades gracefully to a non-absolute string
 * rather than throwing. That is deliberate — the silhouette fallback
 * (DEV-26) is a safeguarding safety net that must survive a missing or
 * misconfigured hash, and both `playerOgImage` and `StreamPlayer` rely
 * on a non-absolute return to fall back (to the default OG image / a
 * flat poster). Throwing at SSR/render time would crash whole pages.
 */

export type PortraitSize = "tile" | "card" | "public";

/**
 * Cloudflare Images flexible-variant transform strings (comma-separated
 * parameters). `tile` and `card` cover-crop with face detection; `public`
 * is a full-resolution, format-negotiated original (reserved for the
 * per-voice OG generator, DEV-81 — no live consumer yet).
 *
 * `card` is 800×800 square (confirmed with the designer): it's the video
 * poster (filled into a 3:4 mobile / 16:9 desktop pane) and the
 * social-share image (~1.91:1), not the 4:5 grid tile. Square loses a
 * symmetric amount on each axis when filled into either orientation, so
 * gravity=face stays centred; a 4:5 source would guillotine the head and
 * shoulders on the wide share crop. If the mobile poster ever reads loose,
 * the cheap fix is a 4:5 variant for that pane only.
 */
const SIZE_TRANSFORM: Record<PortraitSize, string> = {
	tile: "w=160,h=160,fit=cover,gravity=face,format=auto,quality=80",
	card: "w=800,h=800,fit=cover,gravity=face,format=auto,quality=80",
	public: "format=auto,quality=85",
};

/**
 * The public Cloudflare Images account hash, or undefined when unset
 * (tests, and local dev before `.env.local` carries it). Mirrors the
 * soft accessor in `src/lib/stream.ts`.
 */
function defaultAccountHash(): string | undefined {
	const value = (import.meta.env as Record<string, string | undefined>)
		.PUBLIC_CF_IMAGES_ACCOUNT_HASH;
	return value && value.length > 0 ? value : undefined;
}

/**
 * Resolve a Cloudflare Images ID to its full flexible-variant delivery
 * URL for the requested size. Returns a non-absolute fallback
 * (`{imageId}/{transform}`) when the account hash is unset, so callers
 * that test for absoluteness degrade to the silhouette / default OG.
 */
export function portraitUrl(
	imageId: string,
	size: PortraitSize,
	accountHash: string | undefined = defaultAccountHash(),
): string {
	const transform = SIZE_TRANSFORM[size];
	if (!accountHash) return `${imageId}/${transform}`;
	const trimmed = accountHash.replace(/\/$/, "");
	return `https://imagedelivery.net/${trimmed}/${imageId}/${transform}`;
}
