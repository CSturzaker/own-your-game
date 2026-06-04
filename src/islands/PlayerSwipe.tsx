import { useEffect, type JSX } from "react";

import { attachSwipe } from "~/lib/swipe";

/**
 * Mobile behaviour for the standalone player page (DEV-45).
 *
 * On mobile, the player card is a full-page experience (the overlay skips
 * interception below `lg`, so a tile click navigates here), so the swipe
 * gesture and the close button need client behaviour the server-rendered
 * `PlayerCard` can't carry. This island renders nothing — it binds:
 *
 *  - **Swipe** to the `[data-player-card]` element (only on mobile
 *    viewports — it's the touch experience), navigating to the
 *    previous/next voice. The pure gesture logic lives in `~/lib/swipe`;
 *    the active-set scoping + in-modal swap are DEV-48.
 *  - **The close button** (`[data-player-close]`) → `history.back()` to
 *    return to the previous page, falling back to `closeHref` (derived
 *    from the `from=` origin) on a direct visit with no history.
 */
export interface PlayerSwipeProps {
	/** Previous-voice href, or undefined at the start of the list. */
	prevHref?: string;
	/** Next-voice href, or undefined at the end of the list. */
	nextHref?: string;
	/** Localised `/squad` — the close fallback when the origin was the squad. */
	squadHref: string;
	/** Localised `/` — the default close fallback. */
	homeHref: string;
	/** Reading direction — flips the swipe-to-next mapping under RTL. */
	dir?: "ltr" | "rtl";
}

export function PlayerSwipe({
	prevHref,
	nextHref,
	squadHref,
	homeHref,
	dir = "ltr",
}: PlayerSwipeProps): JSX.Element | null {
	useEffect(() => {
		const card = document.querySelector<HTMLElement>("[data-player-card]");
		const mobile = window.matchMedia("(max-width: 1023px)");
		const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

		let detach: (() => void) | null = null;
		const sync = () => {
			detach?.();
			detach = null;
			if (card && mobile.matches) {
				detach = attachSwipe(
					card,
					{
						onNext: () => nextHref && window.location.assign(nextHref),
						onPrevious: () => prevHref && window.location.assign(prevHref),
					},
					{ dir, reducedMotion: motion.matches },
				);
			}
		};
		sync();
		mobile.addEventListener("change", sync);
		motion.addEventListener("change", sync);

		const onCloseClick = (event: Event) => {
			const target = event.target instanceof Element ? event.target : null;
			if (!target?.closest("[data-player-close]")) return;
			event.preventDefault();
			// Return to the previous page when we came from one on this site;
			// on a direct visit (no same-origin referrer) fall back to the
			// `from=` origin (read client-side — a static page has no query at
			// build time). `history.length` is unreliable: a fresh tab already
			// carries the blank entry.
			const sameOrigin = (): boolean => {
				try {
					return (
						document.referrer !== "" && new URL(document.referrer).origin === window.location.origin
					);
				} catch {
					return false;
				}
			};
			if (sameOrigin()) {
				window.history.back();
			} else {
				const from = new URLSearchParams(window.location.search).get("from");
				window.location.assign(from === "squad" ? squadHref : homeHref);
			}
		};
		document.addEventListener("click", onCloseClick);

		return () => {
			detach?.();
			mobile.removeEventListener("change", sync);
			motion.removeEventListener("change", sync);
			document.removeEventListener("click", onCloseClick);
		};
	}, [prevHref, nextHref, squadHref, homeHref, dir]);

	return null;
}
