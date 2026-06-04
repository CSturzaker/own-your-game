import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";

import { isRtl } from "~/i18n/config";
import { localiseUrl } from "~/i18n/localise-url";
import type { PlayerStrings } from "~/islands/PlayerCard";
import { PlayerCardModal } from "~/islands/PlayerCardModal";
import { activeSetLabel, buildDots, neighbourPath, resolveActiveSet } from "~/lib/player-context";
import type { Voice } from "~/lib/voice";

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
 * Mechanism:
 *   - A delegated click listener intercepts primary clicks on any
 *     `a[data-voice-id]` tile (desktop only — mobile is the full-page
 *     experience), `pushState`s the tile's origin-tagged href, and opens
 *     the modal — no fetch, the voice data is already in memory.
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
	/** Every voice, pre-rendered as JSON-in-props so the modal opens with no fetch. */
	voices: readonly Voice[];
	/** Transcripts keyed by voice id, for the "Read transcript" chip (DEV-47). */
	transcripts?: Record<string, string>;
	/** Localised UI strings for the card (the dictionaries don't ship to the client). */
	strings: PlayerStrings;
	/** Current locale — for localised hrefs + the RTL keyboard/arrow flip. */
	locale: string;
}

export function PlayerCardOverlay({
	voices,
	transcripts,
	strings,
	locale,
}: PlayerCardOverlayProps): JSX.Element | null {
	const [activeId, setActiveId] = useState<string | null>(null);
	// The tile that opened the modal — focus returns here on close. The
	// modal unmounts (rather than toggling `open`) when it closes, so this
	// is the overlay's analogue of PlayerCardModal's `onCloseAutoFocus`.
	const openerRef = useRef<HTMLElement | null>(null);

	const voicesById = useMemo(() => {
		const map = new Map<string, Voice>();
		for (const v of voices) map.set(v.id, v);
		return map;
	}, [voices]);

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
			if (!id || !voicesById.has(id)) return;

			event.preventDefault();
			openerRef.current = link;
			const href = link.getAttribute("href") ?? `/voice/${id}`;
			const state: PlayerHistoryState = { voiceId: id, playerModal: true };
			window.history.pushState(state, "", href);
			setActiveId(id);
		}

		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [voicesById]);

	// Back/forward: a modal entry re-opens; anything else closes.
	useEffect(() => {
		function onPopState(event: PopStateEvent) {
			const state = event.state as PlayerHistoryState | null;
			const id = state?.voiceId;
			setActiveId(id && voicesById.has(id) ? id : null);
		}

		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, [voicesById]);

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

	const voice = activeId ? (voicesById.get(activeId) ?? null) : null;

	// Arrow-key traversal within the active set (reversed under RTL),
	// ignored while a form control has focus.
	useEffect(() => {
		if (!voice) return;
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
			const set = resolveActiveSet(voice!.id, voices, new URLSearchParams(window.location.search));
			const target =
				event.key === forward ? set.next : event.key === backward ? set.prev : undefined;
			if (!target) return;
			event.preventDefault();
			swapTo(target.id);
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [voice, voices, locale, swapTo]);

	if (!voice) return null;

	const activeSet = resolveActiveSet(voice.id, voices, new URLSearchParams(window.location.search));
	const themeLabel = activeSet.filters.theme ? strings.themes[activeSet.filters.theme] : "";
	const indicatorLabel = activeSetLabel(activeSet.index + 1, activeSet.total, themeLabel, {
		indicator: strings.indicator,
		setIndicator: strings.setIndicator,
	});

	return (
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
			indicatorLabel={indicatorLabel}
			voicePath={localiseUrl(`/voice/${voice.id}`, locale)}
			transcript={transcripts?.[voice.id]}
			dir={isRtl(locale) ? "rtl" : "ltr"}
		/>
	);
}
