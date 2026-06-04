/**
 * Lateral swipe gesture — the pure direction resolver.
 *
 * Used by the mobile player card to move between voices (DEV-45). Kept
 * pure and React-free so it's unit-testable in both reading directions;
 * the DOM binder that drives it lives in `~/lib/swipe-bind` (e2e-tested).
 */

export type SwipeDirection = "next" | "previous";

export interface ResolveSwipeOptions {
	/** Reading direction. In RTL, swipe-right is "next" (reading-forward). */
	dir?: "ltr" | "rtl";
	/** Minimum horizontal distance (px) to count as a swipe. */
	threshold?: number;
}

// A swipe must travel more horizontally than vertically by enough to stay
// within ~30° of the horizontal — past that it's a scroll, not a swipe.
const MAX_DRIFT_RATIO = Math.tan((30 * Math.PI) / 180);

/**
 * Classify a completed drag as a next/previous swipe, or `null` when it
 * doesn't qualify (too short, or too vertical).
 *
 * Direction maps to *reading order*: in LTR a swipe left advances to the
 * next voice; in RTL that reverses, so a swipe right advances. This is the
 * `isRtl(locale)` branch the player-card swipe was always going to need
 * (see `docs/ops/i18n.md`).
 */
export function resolveSwipe(
	deltaX: number,
	deltaY: number,
	{ dir = "ltr", threshold = 80 }: ResolveSwipeOptions = {},
): SwipeDirection | null {
	if (Math.abs(deltaX) < threshold) return null;
	if (Math.abs(deltaY) > Math.abs(deltaX) * MAX_DRIFT_RATIO) return null;

	const swipedLeft = deltaX < 0;
	const leftIsNext = dir !== "rtl";
	if (swipedLeft) return leftIsNext ? "next" : "previous";
	return leftIsNext ? "previous" : "next";
}
