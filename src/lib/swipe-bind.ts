/**
 * DOM binder for the lateral swipe gesture (DEV-45).
 *
 * Split from `~/lib/swipe` (which holds the pure, unit-tested
 * `resolveSwipe`) because this part is pointer/DOM plumbing exercised in
 * `tests/e2e/player-mobile.spec.ts`, not in jsdom — the same reason the
 * rotation island lives outside the unit-coverage net.
 */

import { resolveSwipe, type ResolveSwipeOptions } from "~/lib/swipe";

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
 * Pointer-type agnostic by design — the caller (`PlayerControls`) only binds
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
