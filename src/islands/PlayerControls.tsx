import { useEffect, type JSX } from "react";

import { isRtl } from "~/i18n/config";
import { localiseUrl } from "~/i18n/localise-url";
import type { PlayerStrings } from "~/islands/PlayerCard";
import {
	activeSetLabel,
	buildDots,
	neighbourPath,
	resolveActiveSet,
	type DotItem,
} from "~/lib/player-context";
import { attachSwipe } from "~/lib/swipe-bind";
import type { VoiceIndexEntry } from "~/lib/voice-index";
import { loadVoiceIndex } from "~/lib/voice-index-client";

/**
 * Client behaviour for the standalone player page (DEV-45 + DEV-48).
 *
 * The card is server-rendered (SEO / no-JS), so this island progressively
 * enhances it once the active set is known (it depends on the URL's
 * `from`/filter params, which a static page can't read at build time). It
 * renders nothing; it:
 *
 *  - **Scopes prev/next to the active set** — rewrites the `[data-player-prev]`
 *    / `[data-player-next]` anchors' href (or disables them at the
 *    boundaries), updates the `[data-player-indicator]` label, and fills
 *    `[data-player-dots]`.
 *  - **Swipe** (mobile viewports only) on `[data-player-card]` →
 *    previous/next within the active set.
 *  - **Arrow keys** → previous/next (reversed under RTL), ignored while a
 *    form control has focus.
 *  - **The close button** (`[data-player-close]`) → previous same-origin
 *    page, else the `from=`-derived fallback.
 *
 * The active set is resolved against the lightweight index fetched at
 * runtime (DEV-107) rather than the full set inlined into the page — so a
 * direct-visit page ships no catalogue. The no-JS baseline is the SSR
 * full-list prev/next (correct for the common direct visit, whose active
 * set _is_ all voices); the enhancement rescopes once the index arrives.
 */
export interface PlayerControlsProps {
	/** The voice this page shows. */
	voiceId: string;
	/** Localised strings (indicator templates + theme labels for the label). */
	strings: PlayerStrings;
	/** Current locale — localised hrefs + the RTL key/swipe flip. */
	locale: string;
	/** Localised `/squad` — close fallback when the origin was the squad. */
	squadHref: string;
	/** Localised `/` — the default close fallback. */
	homeHref: string;
}

function setNav(el: HTMLAnchorElement | null, href: string | undefined): void {
	if (!el) return;
	if (href) {
		el.setAttribute("href", href);
		el.removeAttribute("aria-disabled");
		el.classList.remove("pointer-events-none", "opacity-50");
	} else {
		el.removeAttribute("href");
		el.setAttribute("aria-disabled", "true");
		el.classList.add("pointer-events-none", "opacity-50");
	}
}

function renderDots(container: HTMLElement | null, dots: DotItem[]): void {
	if (!container) return;
	const nodes = dots.map((dot) => {
		const span = document.createElement("span");
		if (dot.kind === "ellipsis") {
			span.className = "text-ink-3 text-[10px] leading-none";
			span.textContent = "…";
		} else {
			span.className = `block size-[5px] rounded-pill ${dot.active ? "bg-brand-orange" : "bg-rule"}`;
		}
		return span;
	});
	container.replaceChildren(...nodes);
}

export function PlayerControls({
	voiceId,
	strings,
	locale,
	squadHref,
	homeHref,
}: PlayerControlsProps): JSX.Element | null {
	useEffect(() => {
		let cancelled = false;
		let teardown: (() => void) | null = null;

		loadVoiceIndex()
			.then((index) => {
				if (!cancelled) teardown = bind(index);
			})
			.catch(() => {
				/* SSR full-list prev/next stays as the baseline */
			});

		return () => {
			cancelled = true;
			teardown?.();
		};

		function bind(index: readonly VoiceIndexEntry[]): () => void {
			const dir = isRtl(locale) ? "rtl" : "ltr";
			const hrefFor = (id: string, search: URLSearchParams) =>
				localiseUrl(neighbourPath(id, search), locale);

			// Enhance the server-rendered footer to the active set.
			const search = new URLSearchParams(window.location.search);
			const set = resolveActiveSet(voiceId, index, search);
			const prevHref = set.prev ? hrefFor(set.prev.id, search) : undefined;
			const nextHref = set.next ? hrefFor(set.next.id, search) : undefined;

			setNav(document.querySelector<HTMLAnchorElement>("[data-player-prev]"), prevHref);
			setNav(document.querySelector<HTMLAnchorElement>("[data-player-next]"), nextHref);

			const themeLabel = set.filters.theme ? strings.themes[set.filters.theme] : "";
			const indicator = document.querySelector<HTMLElement>("[data-player-indicator]");
			if (indicator) {
				indicator.textContent = activeSetLabel(set.index + 1, set.total, themeLabel, {
					indicator: strings.indicator,
					setIndicator: strings.setIndicator,
				});
			}
			renderDots(
				document.querySelector<HTMLElement>("[data-player-dots]"),
				buildDots(set.index, set.total),
			);

			// Swipe (mobile viewports) → active-set neighbour.
			const card = document.querySelector<HTMLElement>("[data-player-card]");
			const mobile = window.matchMedia("(max-width: 1023px)");
			const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
			let detach: (() => void) | null = null;
			const syncSwipe = () => {
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
			syncSwipe();
			mobile.addEventListener("change", syncSwipe);
			motion.addEventListener("change", syncSwipe);

			// Arrow-key traversal (reversed under RTL), ignored in form fields.
			const onKeyDown = (event: KeyboardEvent) => {
				if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
				const el = document.activeElement;
				if (
					el instanceof HTMLElement &&
					(el.tagName === "INPUT" ||
						el.tagName === "TEXTAREA" ||
						el.tagName === "SELECT" ||
						el.isContentEditable)
				) {
					return;
				}
				const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
				const backward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
				const href =
					event.key === forward ? nextHref : event.key === backward ? prevHref : undefined;
				if (!href) return;
				event.preventDefault();
				window.location.assign(href);
			};
			window.addEventListener("keydown", onKeyDown);

			// Close → previous same-origin page, else the from-derived fallback.
			const onCloseClick = (event: Event) => {
				const target = event.target instanceof Element ? event.target : null;
				if (!target?.closest("[data-player-close]")) return;
				event.preventDefault();
				const sameOrigin = (): boolean => {
					try {
						return (
							document.referrer !== "" &&
							new URL(document.referrer).origin === window.location.origin
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
				mobile.removeEventListener("change", syncSwipe);
				motion.removeEventListener("change", syncSwipe);
				window.removeEventListener("keydown", onKeyDown);
				document.removeEventListener("click", onCloseClick);
			};
		}
	}, [voiceId, strings, locale, squadHref, homeHref]);

	return null;
}
