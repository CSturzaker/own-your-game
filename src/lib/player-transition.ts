/**
 * Player-card next/previous transition — the pure offset resolver (DEV-98).
 *
 * The desktop modal animates a voice swap as a horizontal slide + paper
 * cross-fade (`design/handoff/project/hifi-player.jsx`, the
 * `variant === "transition"` overlay). This computes the starting X offset
 * the incoming card slides in *from*: a "next" swap enters from the
 * trailing edge, a "previous" swap from the leading edge — and that flips
 * under RTL, exactly as the swipe gesture (`~/lib/swipe`) and the arrow-key
 * traversal already reverse.
 *
 * Kept pure and React-free so it's unit-testable in both reading
 * directions; the layout effect that drives it lives in `PlayerCard`.
 */

export interface SlideOffsetOptions {
	/** Reading direction. In RTL the entering edges swap. */
	rtl?: boolean;
	/** Slide distance in px (the magnitude of the offset). */
	distance?: number;
}

/**
 * The signed X offset (px) the incoming card starts at before settling to
 * 0. `forward` is a "next" swap (advancing in reading order).
 *
 * LTR: next enters from the right (+), previous from the left (−).
 * RTL: reversed — next enters from the left (−), previous from the right (+).
 */
export function slideOffset(
	forward: boolean,
	{ rtl = false, distance = 24 }: SlideOffsetOptions = {},
): number {
	const enterFromRight = forward !== rtl;
	return enterFromRight ? distance : -distance;
}
