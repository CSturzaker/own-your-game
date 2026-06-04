/**
 * Lateral swipe gesture — pure resolver + a framework-agnostic DOM binder.
 *
 * Used by the mobile player card (`PlayerSwipe`) to move between voices
 * (DEV-45). Kept out of React so the resolver is unit-testable in both
 * reading directions and the binder can attach to a server-rendered
 * element with no hydration cost beyond the small island that calls it.
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

export interface SwipeCallbacks {
	onNext?: () => void;
	onPrevious?: () => void;
}

export interface AttachSwipeOptions extends ResolveSwipeOptions {
	/** Skip the rubberband follow + slide-out (honours prefers-reduced-motion). */
	reducedMotion?: boolean;
	/** Max rubberband follow as a fraction of the element's width. */
	maxFollow?: number;
	/** Slide-out duration (ms) before the success callback fires. */
	slideMs?: number;
}

const SLIDE_EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
// Below this horizontal movement a gesture is still a tap/click, not a drag.
const DRAG_START_PX = 10;

/**
 * Bind lateral swipe handling to an element. Returns a cleanup function.
 *
 * - Tracks pointer drags; a mostly-vertical gesture is abandoned so the
 *   page can scroll (`touch-action: pan-y` should be set on the element).
 * - During a horizontal drag the element follows the finger with a
 *   diminishing-return rubberband (disabled under reduced motion).
 * - On release past `threshold` it slides out and fires `onNext` /
 *   `onPrevious`; otherwise it snaps back.
 *
 * Pointer-type agnostic by design — the caller (`PlayerSwipe`) only binds
 * it on mobile viewports, which keeps it touch-only in practice while
 * staying drivable by a synthetic pointer in tests.
 */
export function attachSwipe(
	element: HTMLElement,
	callbacks: SwipeCallbacks,
	options: AttachSwipeOptions = {},
): () => void {
	const {
		dir = "ltr",
		threshold = 80,
		reducedMotion = false,
		maxFollow = 0.3,
		slideMs = 240,
	} = options;

	let pointerId: number | null = null;
	let startX = 0;
	let startY = 0;
	let dragging = false;
	let abandoned = false;

	const clearTransform = (animate: boolean) => {
		element.style.transition =
			animate && !reducedMotion ? `transform ${slideMs}ms ${SLIDE_EASE}` : "";
		element.style.transform = "";
	};

	// Diminishing-return follow: asymptotes to `max`, so the card never
	// runs away from the finger.
	const follow = (dx: number): number => {
		const max = element.offsetWidth * maxFollow;
		if (max <= 0) return 0;
		return Math.sign(dx) * max * (1 - Math.exp(-Math.abs(dx) / max));
	};

	const reset = () => {
		pointerId = null;
		dragging = false;
		abandoned = false;
	};

	function onPointerDown(event: PointerEvent) {
		if (pointerId !== null) return;
		pointerId = event.pointerId;
		startX = event.clientX;
		startY = event.clientY;
		dragging = false;
		abandoned = false;
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerId !== pointerId || abandoned) return;
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;

		if (!dragging) {
			if (Math.abs(dy) > DRAG_START_PX && Math.abs(dy) >= Math.abs(dx)) {
				abandoned = true; // vertical → let the page scroll
				return;
			}
			if (Math.abs(dx) <= DRAG_START_PX) return;
			dragging = true;
			element.setPointerCapture(event.pointerId);
			element.style.transition = "";
		}

		event.preventDefault();
		if (!reducedMotion) element.style.transform = `translateX(${follow(dx)}px)`;
	}

	function onPointerUp(event: PointerEvent) {
		if (event.pointerId !== pointerId) return;
		const wasDragging = dragging;
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;
		if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
		reset();
		if (!wasDragging) return;

		const result = resolveSwipe(dx, dy, { dir, threshold });
		if (!result) {
			clearTransform(true); // snap back
			return;
		}

		const go = result === "next" ? callbacks.onNext : callbacks.onPrevious;
		if (!go) {
			clearTransform(true);
			return;
		}

		if (reducedMotion) {
			clearTransform(false);
			go();
			return;
		}

		// Slide the card out in the swipe direction, then navigate.
		element.style.transition = `transform ${slideMs}ms ${SLIDE_EASE}`;
		element.style.transform = `translateX(${dx < 0 ? "-100%" : "100%"})`;
		window.setTimeout(go, slideMs);
	}

	function onPointerCancel(event: PointerEvent) {
		if (event.pointerId !== pointerId) return;
		if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
		reset();
		clearTransform(true);
	}

	element.addEventListener("pointerdown", onPointerDown);
	element.addEventListener("pointermove", onPointerMove);
	element.addEventListener("pointerup", onPointerUp);
	element.addEventListener("pointercancel", onPointerCancel);

	return () => {
		element.removeEventListener("pointerdown", onPointerDown);
		element.removeEventListener("pointermove", onPointerMove);
		element.removeEventListener("pointerup", onPointerUp);
		element.removeEventListener("pointercancel", onPointerCancel);
		clearTransform(false);
	};
}
