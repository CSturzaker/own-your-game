import { useEffect, useState, type JSX } from "react";

export interface LetterRailWaypoint {
	/** Matches a `<span id="waypoint-${id}">` anchor in the letter body. */
	id: string;
	/** Display label, e.g. "The question". */
	label: string;
}

/** Localised rail chrome, resolved by `Letter.astro` and threaded in. */
export interface LetterRailStrings {
	ariaLabel: string;
	header: string;
	jumpToTop: string;
}

export interface LetterRailProps {
	waypoints: readonly LetterRailWaypoint[];
	strings: LetterRailStrings;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Read the OS reduced-motion preference at call time (not cached). */
function prefersReducedMotion(): boolean {
	return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function scrollToWaypoint(id: string): void {
	const el = document.getElementById(`waypoint-${id}`);
	if (!el) return;
	// `scroll-mt-*` on the anchor clears the sticky header; scrollIntoView
	// honours that scroll-margin. Smooth unless the visitor opted out.
	el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

const CIRCLE_BASE =
	"font-display inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums";
const CIRCLE_ACTIVE = "bg-fn-orange text-white";
const CIRCLE_INACTIVE = "border-rule text-ink-3 bg-paper border";

const LABEL_BASE = "font-display text-[12px] tracking-[0.02em] whitespace-nowrap";
const LABEL_ACTIVE = "text-ink font-bold";
const LABEL_INACTIVE = "text-ink-3 font-medium";

/**
 * The letter's right-rail waypoint navigator (desktop ≥1024px only).
 *
 * Reference: `design/handoff/project/hifi-letter.jsx` — numbered-circle
 * rail. The active circle uses the AA-safe Functional Orange fill rather
 * than brand amber, per the project's white-on-amber contrast precedent.
 *
 * Behaviour (DEV-52):
 * - An IntersectionObserver watches each `#waypoint-${id}` anchor with a
 *   `-30% 0px -50% 0px` root margin, so the active waypoint is whatever
 *   sits in roughly the top third of the viewport.
 * - Clicking a waypoint smooth-scrolls to it and writes `#${id}` to the
 *   URL so the anchor is shareable. Under `prefers-reduced-motion` the
 *   scroll is instant.
 * - On load with a matching hash, it scrolls to that waypoint.
 *
 * The active-state highlighting is kept regardless of reduced motion —
 * it's not motion, just a colour change.
 */
export function LetterRail({ waypoints, strings }: LetterRailProps): JSX.Element {
	const [activeId, setActiveId] = useState<string>(() => waypoints[0]?.id ?? "");

	// Scroll-spy: the active waypoint is the last one whose anchor has
	// scrolled past the active line (~40% down the viewport). A
	// rAF-throttled passive scroll listener rather than an
	// IntersectionObserver: the waypoint anchors are zero-height (so they
	// don't disturb the prose rhythm), and IO's enter/exit firing on a
	// thin rootMargin band is unreliable for zero-height targets —
	// reading positions on scroll is robust and still cheap (one rAF per
	// frame, passive). Re-runs only if the waypoint set changes.
	useEffect(() => {
		let frame = 0;
		const compute = () => {
			frame = 0;
			const line = window.innerHeight * 0.4;
			let current = waypoints[0]?.id ?? "";
			for (const w of waypoints) {
				const el = document.getElementById(`waypoint-${w.id}`);
				if (el && el.getBoundingClientRect().top <= line) current = w.id;
			}
			setActiveId(current);
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(compute);
		};
		frame = requestAnimationFrame(compute);
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (frame) cancelAnimationFrame(frame);
		};
	}, [waypoints]);

	// On load, honour a shareable hash like `/letter#ask`. The scroll +
	// active update run in a rAF so layout is settled first (and so the
	// setState isn't synchronous in the effect). First paint still
	// matches SSR — the highlight catches up a frame later. A
	// top-aligned target sits above the observer's active band, so we
	// set it explicitly rather than relying on the observer.
	useEffect(() => {
		const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
		if (!hash || !waypoints.some((w) => w.id === hash)) return;
		const frame = requestAnimationFrame(() => {
			scrollToWaypoint(hash);
			setActiveId(hash);
		});
		return () => cancelAnimationFrame(frame);
	}, [waypoints]);

	const handleWaypointClick = (event: React.MouseEvent, id: string) => {
		event.preventDefault();
		scrollToWaypoint(id);
		setActiveId(id);
		history.replaceState(null, "", `#${id}`);
	};

	const handleJumpToTop = () => {
		window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
		setActiveId(waypoints[0]?.id ?? "");
		history.replaceState(null, "", window.location.pathname + window.location.search);
	};

	return (
		<div className="pointer-events-none absolute inset-y-0 inset-e-0 hidden lg:block">
			<nav
				aria-label={strings.ariaLabel}
				className="border-rule-soft bg-paper rounded-card pointer-events-auto sticky top-[120px] flex min-w-[180px] flex-col gap-1 border py-5 ps-3.5 pe-[18px]"
			>
				<p className="font-display text-ink-3 mb-2.5 ps-[30px] text-[10px] font-bold tracking-[0.18em] uppercase">
					{strings.header}
				</p>

				<ul className="flex flex-col">
					{waypoints.map((w, i) => {
						const active = w.id === activeId;
						return (
							<li key={w.id}>
								<a
									href={`#${w.id}`}
									aria-current={active ? "true" : undefined}
									onClick={(event) => handleWaypointClick(event, w.id)}
									className="rounded-field flex items-center gap-3 px-1.5 py-[7px]"
								>
									<span
										aria-hidden="true"
										className={`${CIRCLE_BASE} ${active ? CIRCLE_ACTIVE : CIRCLE_INACTIVE}`}
									>
										{i + 1}
									</span>
									<span className={`${LABEL_BASE} ${active ? LABEL_ACTIVE : LABEL_INACTIVE}`}>
										{w.label}
									</span>
								</a>
							</li>
						);
					})}
				</ul>

				<button
					type="button"
					onClick={handleJumpToTop}
					className="font-display text-ink-3 hover:text-ink text-kicker mt-2.5 flex items-center gap-2 ps-1.5 font-medium"
				>
					{strings.jumpToTop}
					<span aria-hidden="true">↑</span>
				</button>
			</nav>
		</div>
	);
}
