/**
 * Portrait placeholder variant resolution.
 *
 * When a voice has no real portrait (yet, or because the image
 * failed to load), we render a deterministic warm-grey silhouette.
 * The same `seed` always selects the same silhouette + tone +
 * framing so the same person looks consistent across visits.
 *
 * Source: design/handoff/project/hifi-shared.jsx lines 134–207.
 */

/**
 * Stable string hash. Lifted verbatim from the prototype so the same
 * voice id resolves to the same fallback in both worlds during the
 * pre-launch design QA pass.
 */
export function hashSeed(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = ((h << 5) - h + s.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

export interface PortraitTone {
	/** Gradient stop A (top). */
	readonly a: string;
	/** Gradient stop B (bottom). */
	readonly b: string;
	/** Silhouette fill colour. */
	readonly s: string;
}

/**
 * Warm-grey palette pairs. Eight tones keeps the fallback grid
 * feeling varied without straying outside the brand neutrals. The
 * silhouette colour in each tone is deliberately darker than the
 * bottom gradient stop so the figure reads at a glance.
 */
export const TONES: readonly PortraitTone[] = [
	{ a: "#C2B6A2", b: "#A89D8A", s: "#6E6357" },
	{ a: "#D6CABA", b: "#B3A593", s: "#7A6E60" },
	{ a: "#B8AC97", b: "#9A8E7A", s: "#5E5347" },
	{ a: "#CDC1AD", b: "#A99D88", s: "#74685B" },
	{ a: "#C8BDA8", b: "#A3987F", s: "#665B4E" },
	{ a: "#D2C6B0", b: "#AEA28C", s: "#7F7466" },
	{ a: "#BFB29A", b: "#9C8F76", s: "#5A4E42" },
	{ a: "#DAC9B1", b: "#B5A48D", s: "#6E6052" },
];

/**
 * Seven silhouette shapes — bald, ellipsoid head, head with hair,
 * head with bun, head with cap, head with hijab/scarf — chosen by
 * the agency to span the visual breadth of the campaign cohort so
 * the fallback never feels like a single placeholder.
 *
 * Each entry is the inner markup for an `<svg viewBox="0 0 100 120"
 * preserveAspectRatio="xMidYMax meet">`. Components render the
 * wrapper and use `set:html` for the body so the SVG vocabulary
 * stays in one place.
 */
export const SILHOUETTES: readonly string[] = [
	// 0 — simple bust
	`<circle cx="50" cy="42" r="20"/><path d="M14 120 C 16 85, 38 70, 50 70 C 62 70, 84 85, 86 120 Z"/>`,
	// 1 — ellipse head
	`<ellipse cx="50" cy="40" rx="19" ry="22"/><path d="M12 120 C 14 82, 36 66, 50 66 C 64 66, 86 82, 88 120 Z"/>`,
	// 2 — head with hair
	`<path d="M30 38 C 30 22, 70 22, 70 40 C 70 50, 70 58, 70 58 L 30 58 C 30 56, 30 50, 30 38 Z"/><circle cx="50" cy="44" r="18"/><path d="M14 120 C 16 84, 38 68, 50 68 C 62 68, 84 84, 86 120 Z"/>`,
	// 3 — head with bun
	`<circle cx="50" cy="30" r="6"/><circle cx="50" cy="44" r="20"/><path d="M16 120 C 18 86, 38 70, 50 70 C 62 70, 82 86, 84 120 Z"/>`,
	// 4 — head with cap
	`<path d="M28 36 C 28 22, 72 22, 72 36 L 76 40 L 24 40 Z"/><circle cx="50" cy="48" r="18"/><path d="M16 120 C 18 84, 38 70, 50 70 C 62 70, 82 84, 84 120 Z"/>`,
	// 5 — head with hijab/scarf
	`<path d="M22 42 C 22 18, 78 18, 78 42 C 78 56, 74 70, 70 76 L 30 76 C 26 70, 22 56, 22 42 Z"/><circle cx="50" cy="48" r="16"/><path d="M16 120 C 18 90, 38 74, 50 74 C 62 74, 82 90, 84 120 Z"/>`,
	// 6 — short cropped (variant of 0 with a denser jawline)
	`<circle cx="50" cy="42" r="19"/><path d="M30 32 C 32 24, 68 24, 70 34 L 70 44 L 30 44 Z"/><path d="M14 120 C 16 86, 38 72, 50 72 C 62 72, 84 86, 86 120 Z"/>`,
];

export interface PortraitVariant {
	readonly toneIndex: number;
	readonly silhouetteIndex: number;
	/** Horizontal offset in -2..2 (translated to % in the renderer). */
	readonly offsetX: number;
	/** Vertical offset in 0..3 (translated to negative % in the renderer). */
	readonly offsetY: number;
	/** Silhouette width as %: 72..83. */
	readonly silWidth: number;
}

/**
 * Pick a deterministic placeholder treatment for a given seed
 * (typically the voice's stable id). The same seed always returns
 * the same variant — call sites can rely on visual continuity
 * across renders and across sessions.
 */
export function pickPortraitVariant(seed: string): PortraitVariant {
	const h = hashSeed(seed);
	return {
		toneIndex: h % TONES.length,
		silhouetteIndex: h % SILHOUETTES.length,
		offsetX: ((h >> 3) % 5) - 2,
		offsetY: (h >> 6) % 4,
		silWidth: 72 + (h % 12),
	};
}
