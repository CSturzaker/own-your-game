import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";

import { isRtl } from "~/i18n/config";
import { localiseUrl } from "~/i18n/localise-url";
import { PlayerCardModal } from "~/islands/PlayerCardModal";
import type { PlayerStrings } from "~/islands/PlayerCard";
import { voiceNeighbours, voicePosition } from "~/lib/player";
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
 *     `a[data-voice-id]` (the tiles), calls `preventDefault`, pushes a
 *     `{ voiceId }` history entry at the tile's own href (preserving the
 *     `?from=squad&…` origin), and opens the modal — no network request,
 *     the voice data is already in memory.
 *   - `popstate` drives open/close so Back closes the modal (returning to
 *     the page) and Forward re-opens it.
 *   - Closing (Escape / click-outside / the close button) calls
 *     `history.back()`, so the close path and the Back-button path
 *     converge on one place.
 *
 * Modifier/middle clicks fall through untouched (open-in-new-tab still
 * works), and a click before hydration is a normal navigation to the
 * standalone page — both paths reach the same content. The video pane is
 * stubbed (DEV-46); prev/next are full-list links (DEV-48 adds the
 * active-set-aware in-modal swap).
 */

interface PlayerHistoryState {
	voiceId?: string;
	playerModal?: boolean;
}

export interface PlayerCardOverlayProps {
	/** Every voice, pre-rendered as JSON-in-props so the modal opens with no fetch. */
	voices: readonly Voice[];
	/** Localised UI strings for the card (the dictionaries don't ship to the client). */
	strings: PlayerStrings;
	/** Current locale — for localised prev/next hrefs. */
	locale: string;
}

export function PlayerCardOverlay({
	voices,
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

	// Prefetch the neighbouring voice pages while the modal is open so a
	// prev/next click (a full navigation in DEV-43) feels instant.
	useEffect(() => {
		if (!voice) return;
		const { prev, next } = voiceNeighbours(voice.id, voices);
		const neighbours = [prev, next].filter((v): v is Voice => v !== undefined);
		const links = neighbours.map((v) => {
			const link = document.createElement("link");
			link.rel = "prefetch";
			link.href = localiseUrl(`/voice/${v.id}`, locale);
			document.head.appendChild(link);
			return link;
		});
		return () => {
			for (const link of links) link.remove();
		};
	}, [voice, voices, locale]);

	if (!voice) return null;

	const position = voicePosition(voice.id, voices);
	const { prev, next } = voiceNeighbours(voice.id, voices);
	const prevHref = prev ? localiseUrl(`/voice/${prev.id}`, locale) : undefined;
	const nextHref = next ? localiseUrl(`/voice/${next.id}`, locale) : undefined;

	return (
		<PlayerCardModal
			voice={voice}
			position={position}
			total={voices.length}
			strings={strings}
			open
			onClose={handleClose}
			prevHref={prevHref}
			nextHref={nextHref}
			dir={isRtl(locale) ? "rtl" : "ltr"}
		/>
	);
}
