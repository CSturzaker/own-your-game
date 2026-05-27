/**
 * Portrait URL helper.
 *
 * Real portraits live in Cloudflare R2 behind a Cloudflare Image
 * Resizing endpoint. The base URL lives in `PUBLIC_PORTRAIT_BASE_URL`
 * (a public env var because the bucket is served to browsers).
 *
 * The size-to-width mapping is conservative: `tile` requests 2× the
 * rendered size on standard DPI grids (~80 CSS px × 2 = 160), `card`
 * does the same for the larger player-card hero (~400 × 2 = 800).
 * Cloudflare serves WebP everywhere modern browsers ask for it.
 */

export type PortraitSize = "tile" | "card";

const SIZE_WIDTH: Record<PortraitSize, number> = {
	tile: 160,
	card: 800,
};

/**
 * Resolve a portrait filename to its full hosted URL with the
 * Image Resizing query string applied. Returns the bare filename if
 * `PUBLIC_PORTRAIT_BASE_URL` is unset — useful in tests and during
 * local dev before the R2 bucket exists.
 */
function defaultBaseUrl(): string | undefined {
	const value = (import.meta.env as Record<string, string | undefined>).PUBLIC_PORTRAIT_BASE_URL;
	return value && value.length > 0 ? value : undefined;
}

export function portraitUrl(
	filename: string,
	size: PortraitSize,
	baseUrl: string | undefined = defaultBaseUrl(),
): string {
	const width = SIZE_WIDTH[size];
	const query = `?width=${width}&format=webp`;
	if (!baseUrl) return `${filename}${query}`;
	const trimmed = baseUrl.replace(/\/$/, "");
	return `${trimmed}/${filename}${query}`;
}
