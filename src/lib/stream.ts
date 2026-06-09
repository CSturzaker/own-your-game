/**
 * Cloudflare Stream configuration accessor.
 *
 * Scaffolded in DEV-43, consumed in DEV-46 (the Stream iframe player).
 * The customer subdomain is the `customer-{subdomain}` portion of the
 * Cloudflare Stream iframe URL, e.g. a value of `abc123def` yields
 * `https://customer-abc123def.cloudflarestream.com/{videoId}/iframe`.
 *
 * It lives in `PUBLIC_STREAM_CUSTOMER_SUBDOMAIN` — a public env var
 * because the resulting iframe URL is served to browsers. Cloudflare is
 * not provisioned yet (the agency has been paid to set up the account),
 * so the value does not exist today and nothing calls these helpers at
 * build time. They're scaffolding: when credentials land, DEV-46 becomes
 * a config drop rather than a code change.
 */

function rawSubdomain(): string | undefined {
	const value = (import.meta.env as Record<string, string | undefined>)
		.PUBLIC_STREAM_CUSTOMER_SUBDOMAIN;
	return value && value.length > 0 ? value : undefined;
}

/**
 * Whether Cloudflare Stream is configured. Lets callers (DEV-46) render
 * the video iframe when credentials exist and fall back to the stub
 * otherwise, without triggering the throw in {@link streamCustomerSubdomain}.
 */
export function hasStreamConfig(): boolean {
	return rawSubdomain() !== undefined;
}

/**
 * The Cloudflare Stream customer subdomain.
 *
 * Throws a loud, actionable error when unset rather than returning
 * `undefined` and letting a broken iframe URL render — until Cloudflare
 * is provisioned, any code that reaches for this value is a bug that
 * should fail fast. Guard with {@link hasStreamConfig} when a missing
 * value is an expected, non-fatal state.
 */
export function streamCustomerSubdomain(): string {
	const value = rawSubdomain();
	if (value === undefined) {
		throw new Error(
			"PUBLIC_STREAM_CUSTOMER_SUBDOMAIN is not set. It is required to build " +
				"Cloudflare Stream iframe URLs (DEV-46). Set it in .env.local (see " +
				".env.example) or in the deploy environment. Cloudflare is not " +
				"provisioned yet, so this value does not exist — the video pane stays " +
				"a stub until it does.",
		);
	}
	return value;
}

/**
 * The Stream UID of the campaign montage film on the home page
 * (DEV-124), or undefined while the asset is still in production. The
 * montage is another video on the same Stream account, so it reuses
 * {@link streamCustomerSubdomain} — only the UID is new. Soft (no
 * throw): an unset UID is an expected state — `CampaignFilm` renders
 * the poster regardless and `StreamPlayer`'s empty-videoId guard turns
 * a play press into the unavailable state.
 */
export function streamMontageUid(): string | undefined {
	const value = (import.meta.env as Record<string, string | undefined>).PUBLIC_STREAM_MONTAGE_UID;
	return value && value.length > 0 ? value : undefined;
}

/**
 * The origin a configured Stream account serves from
 * (`https://customer-{subdomain}.cloudflarestream.com`). Pure — takes the
 * subdomain explicitly so it's unit-testable without the env; the
 * env-reading convenience wrappers compose it with
 * {@link streamCustomerSubdomain}.
 */
export function streamOrigin(subdomain: string): string {
	return `https://customer-${subdomain}.cloudflarestream.com`;
}

/**
 * The auto-generated poster thumbnail for a video — used as the iframe's
 * `poster` when no portrait still is available (the portrait, already in
 * the user's cache from the tile, is preferred; see {@link streamIframeUrl}).
 */
export function streamThumbnailUrl(subdomain: string, videoId: string): string {
	return `${streamOrigin(subdomain)}/${videoId}/thumbnails/thumbnail.jpg`;
}

export interface StreamIframeOptions {
	/**
	 * Absolute URL of the poster image the player shows before the first
	 * frame decodes. Prefer the R2 portrait (cache-warm from the tile);
	 * fall back to {@link streamThumbnailUrl} when there's no portrait URL.
	 */
	poster?: string;
	/** Start playback as soon as the iframe mounts. Default `true` — the
	 * iframe only ever mounts on an explicit user play, so autoplay is the
	 * expected behaviour, not an unsolicited one. */
	autoplay?: boolean;
	/** Start muted. Default `false` — the user asked for sound by pressing play. */
	muted?: boolean;
	/** Show Stream's native controls (the iframe owns play/pause/scrub/CC). Default `true`. */
	controls?: boolean;
	/**
	 * Default caption track language (BCP-47), e.g. `"es"`. Drives the
	 * captions chip in DEV-47 — changing it re-mounts the iframe with a
	 * different default track. Omitted → no caption forced on.
	 */
	defaultTextTrack?: string;
	/** Letterbox bar colour. Default `"transparent"` so the ink pane shows through. */
	letterboxColor?: string;
}

/**
 * Build the Cloudflare Stream iframe-player URL for a video.
 *
 * Pure: the `subdomain` is passed in (the env wrapper is the caller's job)
 * so the URL shape is unit-testable without provisioning. Encodes every
 * param via `URLSearchParams`, so the `poster` URL is escaped correctly.
 *
 * Pattern (per DEV-46 / the Stream iframe API):
 *   https://customer-{subdomain}.cloudflarestream.com/{videoId}/iframe
 *     ?poster=…&autoplay=true&muted=false&controls=true
 *     &letterboxColor=transparent&defaultTextTrack={lang}
 */
export function streamIframeUrl(
	subdomain: string,
	videoId: string,
	options: StreamIframeOptions = {},
): string {
	const {
		poster,
		autoplay = true,
		muted = false,
		controls = true,
		defaultTextTrack,
		letterboxColor = "transparent",
	} = options;

	const url = new URL(`${streamOrigin(subdomain)}/${videoId}/iframe`);
	const params = url.searchParams;
	if (poster) params.set("poster", poster);
	params.set("autoplay", String(autoplay));
	params.set("muted", String(muted));
	params.set("controls", String(controls));
	params.set("letterboxColor", letterboxColor);
	if (defaultTextTrack) params.set("defaultTextTrack", defaultTextTrack);
	return url.toString();
}
