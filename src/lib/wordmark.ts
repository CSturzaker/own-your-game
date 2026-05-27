/**
 * Wordmark variant resolution.
 *
 * The Astro component (`src/components/Wordmark.astro`) is a thin
 * shell over the values returned here. Keeping the size-to-shape
 * mapping in a pure function means Vitest can pin the contract for
 * each variant — Astro components themselves are excluded from
 * unit-test coverage and rely on Playwright for whole-page assertions.
 *
 * Sizes mirror `design/handoff/project/hifi-tokens.css`:
 *   header → 36px mobile, 48px on `lg` (≥1024px)
 *   footer → 64px
 *   hero   → consumer-set, default 200px
 */

/** Path to the agency-supplied wordmark SVG (lives in `public/`). */
export const LOGO_SRC = "/assets/own-your-game-logo.svg";

/** Image `alt` text — used on every variant. */
export const LOGO_ALT = "Own Your Game";

/** Accessible name for the linked variants. */
export const LOGO_LINK_LABEL = "Own Your Game — home";

export type WordmarkSize = "header" | "footer" | "hero";

export interface WordmarkVariant {
	/** When true, render as `<a href="/">`; when false, plain `<img>`. */
	readonly isLink: boolean;
	/** Tailwind utility classes applied to the `<img>`. */
	readonly imgClass: string;
	/**
	 * Explicit pixel height for `hero`. Header and footer drive height
	 * from `imgClass` (Tailwind utilities) and leave this undefined.
	 */
	readonly height?: number;
}

/**
 * Map a wordmark size (and an optional consumer-set hero height) to
 * the rendering shape used by the Astro component.
 *
 * `height` is intentionally only honoured for the `hero` variant —
 * header and footer take their height from CSS utilities so they
 * stay locked to the design tokens.
 */
export function wordmarkVariant(size: WordmarkSize, height?: number): WordmarkVariant {
	switch (size) {
		case "header":
			return { isLink: true, imgClass: "block h-9 w-auto lg:h-12" };
		case "footer":
			return { isLink: true, imgClass: "block h-16 w-auto" };
		case "hero":
			return { isLink: false, imgClass: "block w-auto", height: height ?? 200 };
	}
}
