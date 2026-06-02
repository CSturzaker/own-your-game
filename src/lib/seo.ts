/**
 * SEO helpers shared by every page through `BaseLayout`.
 *
 * Kept as pure functions so the layout's Astro frontmatter (which we
 * can't unit-test directly) stays trivial and the interesting
 * behaviour lives somewhere Vitest can reach.
 */

/**
 * The default campaign meta description now lives in the translation
 * dictionary (`meta.description`) so it localises with the page; see
 * `src/i18n/dictionaries/en.json`. `BaseLayout` reads it via `t()`.
 */

/**
 * Default Open Graph image path, relative to the site root. The actual
 * PNG asset is supplied separately as part of the brand handoff; until
 * it lands, link previews fall back to whatever the host serves at
 * this path (a placeholder during local dev is fine).
 */
export const DEFAULT_OG_IMAGE = "/og/default.png";

/**
 * Resolve an Open Graph image URL.
 *
 * - When `input` is undefined, falls back to {@link DEFAULT_OG_IMAGE}.
 * - When the path is already absolute (`http(s)://…`), returns it
 *   verbatim — useful for CMS-provided social images.
 * - When `site` is provided, root-relative paths are upgraded to
 *   absolute URLs. Social crawlers (Facebook, Twitter/X, Slack) require
 *   absolute `og:image` URLs to scrape reliably; root-relative paths
 *   work in browsers but break previews.
 */
export function resolveOgImage(input: string | undefined, site?: URL): string {
	const path = input ?? DEFAULT_OG_IMAGE;
	if (/^https?:\/\//i.test(path)) return path;
	if (!site) return path;
	return new URL(path, site).toString();
}
