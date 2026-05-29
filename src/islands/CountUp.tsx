import { useEffect, useRef, useState, type JSX } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DURATION_MS = 800;
/** Visibility fraction that triggers the count — the card has height. */
const THRESHOLD = 0.4;

/** Read the OS reduced-motion preference at call time (not cached). */
function prefersReducedMotion(): boolean {
	return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export interface CountUpProps {
	/** Final value to count up to. */
	value: number;
	/** Classes for the visible (animated) number element. */
	className?: string;
}

/**
 * A number that counts up from 0 to `value` over 800ms (ease-out-cubic)
 * the first time it scrolls into view, then never again.
 *
 * Accessibility:
 * - The animated digits are `aria-hidden` so a screen reader never hears
 *   the intermediate values ticking up.
 * - A visually-hidden span carries the final value as static text, so the
 *   SR announces it once. (Preferred over `aria-label` on a generic span,
 *   which isn't reliably announced — the visible card label, e.g. "Young
 *   voices", supplies the noun.)
 *
 * SSR + first client render show the final value, so no-JS visitors and
 * the initial paint see the real number and hydration matches. The reset
 * to 0 happens inside the IntersectionObserver callback — invisibly,
 * since the cards sit below the fold and only animate as they scroll in.
 *
 * Under `prefers-reduced-motion: reduce` the animation never runs; the
 * final value (already rendered) simply stays.
 */
export function CountUp({ value, className }: CountUpProps): JSX.Element {
	const [display, setDisplay] = useState(value);
	const numberRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const el = numberRef.current;
		if (!el) return;
		// Reduced motion: leave the final value in place, no observer.
		if (prefersReducedMotion()) return;

		let frame = 0;
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry?.isIntersecting) return;
				// Run exactly once.
				observer.unobserve(el);
				const start = performance.now();
				setDisplay(0);
				const tick = (now: number) => {
					const t = Math.min((now - start) / DURATION_MS, 1);
					const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
					setDisplay(Math.round(value * eased));
					if (t < 1) frame = requestAnimationFrame(tick);
				};
				frame = requestAnimationFrame(tick);
			},
			{ threshold: THRESHOLD },
		);
		observer.observe(el);

		return () => {
			observer.disconnect();
			if (frame) cancelAnimationFrame(frame);
		};
	}, [value]);

	return (
		<>
			<span ref={numberRef} aria-hidden="true" className={className}>
				{display}
			</span>
			<span className="sr-only">{value}</span>
		</>
	);
}
