import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";

import { isRtl } from "~/i18n/config";
import { localiseUrl } from "~/i18n/localise-url";
import type { PlayerStrings } from "~/islands/PlayerCard";
import { buildDots, neighbourPath, resolveActiveSet } from "~/lib/player-context";
import type { VoiceData, VoiceIndexEntry } from "~/lib/voice-index";
import { loadVoiceData, loadVoiceIndex } from "~/lib/voice-index-client";

// The modal shell pulls the heaviest client graph (Radix Dialog,
// StreamPlayer, PlayerChips, the player card). Load it lazily so it ships
// only when a tile is actually clicked (DEV-76). The overlay mounts on
// every page via BaseLayout (client:idle) but only opens the modal on
// desktop (≥lg) — mobile navigates to /voice — so this keeps ~35KB gz of
// modal JS off every page's initial/idle load, mobile especially.
const PlayerCardModal = lazy(() =>
	import("~/islands/PlayerCardModal").then((m) => ({ default: m.PlayerCardModal })),
);

/**
 * Player card modal overlay — the "intercepted route" island.
 *
 * Mounted once at the `BaseLayout` level (so it's live on every page) and
 * dormant until a tile is clicked. It turns a tile click into a modal
 * opened in place over the current page, while keeping the URL canonical
 * (`/voice/{id}`) so the same link is shareable, bookmarkable, and
 * server-rendered as a standalone page (`Player.astro`) for direct visits
 * and crawlers. The pattern Instagram uses to open a post in a lightbox
 * over the feed.
 *
 * Data (DEV-107): the overlay no longer carries the voice set as inlined
 * props. On a page that has tiles it fetches the lightweight index once
 * (`/voices-index.json`) — enough to find, order, label, and scope the
 * active set — and the heavy per-voice data (`/voice-data/{id}.json`,
 * including the transcript) is fetched on demand when a card opens, with
 * the immediate prev/next neighbours prefetched so traversal stays snappy.
 *
 * Mechanism:
 *   - A delegated click listener intercepts primary clicks on any
 *     `a[data-voice-id]` tile that's a known live voice (desktop only —
 *     mobile is the full-page experience). Fixture tiles on demo pages
 *     aren't in the index, so they fall through to a normal navigation.
 *   - Prev/next + ← / → keys swap the card **in place** within the active
 *     set (DEV-48), resolved from the URL's `from`/filter params, via
 *     `replaceState` so the canonical URL tracks the current voice while
 *     Back still closes the modal in one step.
 *   - `popstate` drives open/close so Back closes and Forward re-opens;
 *     closing (Escape / click-outside / close button) calls `history.back()`.
 */

interface PlayerHistoryState {
	voiceId?: string;
	playerModal?: boolean;
}

export interface PlayerCardOverlayProps {
	/** Localised UI strings for the card (the dictionaries don't ship to the client). */
	strings: PlayerStrings;
	/** Current locale — for localised hrefs + the RTL keyboard/arrow flip. */
	locale: string;
}

export function PlayerCardOverlay({ strings, locale }: PlayerCardOverlayProps): JSX.Element | null {
	const [index, setIndex] = useState<readonly VoiceIndexEntry[] | null>(null);
	const [loaded, setLoaded] = useState<ReadonlyMap<string, VoiceData>>(() => new Map());
	const [activeId, setActiveId] = useState<string | null>(null);
	// The tile that opened the modal — focus returns here on close. The
	// modal unmounts (rather than toggling `open`) when it closes, so this
	// is the overlay's analogue of PlayerCardModal's `onCloseAutoFocus`.
	const openerRef = useRef<HTMLElement | null>(null);

	// Fetch the index, but only on pages that actually have voice tiles —
	// no point pulling the catalogue onto /about or /letter. Tiles may be
	// rendered by a sibling island that hydrates after us (the squad grid),
	// so if there are none yet, watch for the first one before fetching.
	useEffect(() => {
		let cancelled = false;
		const fetchIndex = () => {
			loadVoiceIndex()
				.then((idx) => {
					if (!cancelled) setIndex(idx);
				})
				.catch(() => {
					/* interception simply stays off; tiles navigate normally */
				});
		};

		if (document.querySelector("a[data-voice-id]")) {
			fetchIndex();
			return () => {
				cancelled = true;
			};
		}

		const observer = new MutationObserver(() => {
			if (document.querySelector("a[data-voice-id]")) {
				observer.disconnect();
				fetchIndex();
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
		return () => {
			cancelled = true;
			observer.disconnect();
		};
	}, []);

	const indexById = useMemo(() => {
		const map = new Map<string, VoiceIndexEntry>();
		for (const v of index ?? []) map.set(v.id, v);
		return map;
	}, [index]);

	// Fetch a voice's heavy data into the cache (idempotent — `loadVoiceData`
	// memoises the request, and we skip the state update once it's present).
	const ensureData = useCallback((id: string) => {
		loadVoiceData(id)
			.then((data) => {
				setLoaded((prev) => (prev.has(id) ? prev : new Map(prev).set(id, data)));
			})
			.catch(() => {
				/* a failed open just shows no card; Back still closes cleanly */
			});
	}, []);

	// Swap the modal to another voice in place, keeping the URL canonical
	// (replaceState, so Back still closes in one step) and the active-set
	// params intact.
	const swapTo = useCallback(
		(targetId: string) => {
			const search = new URLSearchParams(window.location.search);
			const href = localiseUrl(neighbourPath(targetId, search), locale);
			window.history.replaceState({ voiceId: targetId, playerModal: true }, "", href);
			setActiveId(targetId);
		},
		[locale],
	);

	// Delegated tile-click interception.
	useEffect(() => {
		function onClick(event: MouseEvent) {
			if (
				event.defaultPrevented ||
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) {
				return;
			}
			// Below `lg`, the card is a full-page experience, not a modal
			// (DEV-45) — let the click navigate to the standalone page.
			if (window.matchMedia("(max-width: 1023px)").matches) return;
			const target = event.target instanceof Element ? event.target : null;
			const link = target?.closest<HTMLAnchorElement>("a[data-voice-id]");
			if (!link) return;
			const id = link.getAttribute("data-voice-id");
			// Unknown id (index not loaded yet, or a demo fixture tile) → let
			// the click navigate to the standalone page.
			if (!id || !indexById.has(id)) return;

			event.preventDefault();
			openerRef.current = link;
			const href = link.getAttribute("href") ?? `/voice/${id}`;
			const state: PlayerHistoryState = { voiceId: id, playerModal: true };
			window.history.pushState(state, "", href);
			setActiveId(id);
		}

		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [indexById]);

	// Back/forward: a modal entry re-opens; anything else closes.
	useEffect(() => {
		function onPopState(event: PopStateEvent) {
			const state = event.state as PlayerHistoryState | null;
			setActiveId(state?.voiceId ?? null);
		}

		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	// Escape / click-outside / close button → step back, so the close path
	// and the Back-button path both resolve through `popstate`.
	const handleClose = useCallback(() => {
		window.history.back();
	}, []);

	// When the modal closes (here or via the Back button), return focus to
	// the tile that opened it — the modal unmounts rather than toggling
	// `open`, so Radix's own focus restore doesn't reliably fire.
	useEffect(() => {
		if (activeId === null && openerRef.current?.isConnected) {
			openerRef.current.focus();
			openerRef.current = null;
		}
	}, [activeId]);

	// Load the active voice's heavy data + prefetch its neighbours so a
	// prev/next/swipe lands instantly. Re-runs when the index arrives or the
	// active voice changes.
	useEffect(() => {
		if (!activeId || !index) return;
		ensureData(activeId);
		const set = resolveActiveSet(activeId, index, new URLSearchParams(window.location.search));
		if (set.prev) ensureData(set.prev.id);
		if (set.next) ensureData(set.next.id);
	}, [activeId, index, ensureData]);

	const data = activeId ? loaded.get(activeId) : undefined;
	const voice = data?.voice ?? null;

	// Arrow-key traversal within the active set (reversed under RTL),
	// ignored while a form control has focus.
	useEffect(() => {
		if (!voice || !index) return;
		function onKeyDown(event: KeyboardEvent) {
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
			const forward = isRtl(locale) ? "ArrowLeft" : "ArrowRight";
			const backward = isRtl(locale) ? "ArrowRight" : "ArrowLeft";
			const set = resolveActiveSet(voice!.id, index!, new URLSearchParams(window.location.search));
			const target =
				event.key === forward ? set.next : event.key === backward ? set.prev : undefined;
			if (!target) return;
			event.preventDefault();
			swapTo(target.id);
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [voice, index, locale, swapTo]);

	// activeId set but data still loading (the brief first-open fetch) →
	// render nothing yet; the canonical URL is already pushed, so Back closes.
	if (!voice || !index) return null;

	const activeSet = resolveActiveSet(voice.id, index, new URLSearchParams(window.location.search));

	return (
		// fallback={null}: the chunk loads on the first tile click (desktop).
		// Until it resolves the scrim/card simply isn't there yet — a brief,
		// one-time gap on a warm desktop connection; the click handler has
		// already pushed the canonical URL, so Back still closes cleanly.
		<Suspense fallback={null}>
			<PlayerCardModal
				voice={voice}
				position={activeSet.index + 1}
				total={activeSet.total}
				strings={strings}
				open
				onClose={handleClose}
				onPrev={activeSet.prev ? () => swapTo(activeSet.prev!.id) : undefined}
				onNext={activeSet.next ? () => swapTo(activeSet.next!.id) : undefined}
				dots={buildDots(activeSet.index, activeSet.total)}
				voicePath={localiseUrl(`/voice/${voice.id}`, locale)}
				transcript={data?.transcript}
				dir={isRtl(locale) ? "rtl" : "ltr"}
			/>
		</Suspense>
	);
}
