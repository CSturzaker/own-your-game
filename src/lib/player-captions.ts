/**
 * Caption coordination between the player card's captions chip (DEV-47)
 * and the Stream player (DEV-46).
 *
 * The chip and the player are separate React islands in both surfaces —
 * adjacent grid cells in the desktop modal, and two independent nested
 * islands on the standalone page (no shared React tree). So the chip
 * tells the player to change caption track via a window `CustomEvent`,
 * the same event-bus pattern the squad uses across its three islands.
 * `StreamPlayer` listens and re-mounts its iframe with the new
 * `defaultTextTrack`; `null` turns captions off.
 *
 * Available caption languages: we have no per-voice caption-track metadata
 * on the schema, so MVP assumes the campaign-team convention that every
 * video carries a track in the voice's spoken language (`voice.language`).
 * That yields a single language → the chip is an on/off toggle. The
 * multi-language dropdown path exists for when richer metadata lands; for
 * now Stream's native CC button still exposes whatever tracks a video
 * actually has. (See docs/ops/stream.md.)
 */

import type { Voice } from "~/lib/voice";

/** Window event the captions chip dispatches and StreamPlayer listens for. */
export const CAPTION_CHANGE_EVENT = "oyg:player-caption-change";

export interface CaptionChangeDetail {
	/** The player this targets — a player ignores events for other videos. */
	readonly videoId: string;
	/** BCP-47 caption track to default on, or `null` to turn captions off. */
	readonly lang: string | null;
}

/**
 * The caption languages available for a voice. MVP: the spoken language
 * only (the documented campaign-team convention). Returns `[]` for a voice
 * with no language (defensive — the chip hides), so the three-way
 * hidden / toggle / dropdown behaviour all flows from this one list.
 */
export function availableCaptions(voice: Pick<Voice, "language">): readonly string[] {
	return voice.language ? [voice.language] : [];
}

/** Dispatch a caption-change request to the player for `videoId`. */
export function dispatchCaptionChange(videoId: string, lang: string | null): void {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent<CaptionChangeDetail>(CAPTION_CHANGE_EVENT, {
			detail: { videoId, lang },
		}),
	);
}

/**
 * Subscribe to caption-change requests for a specific player; returns an
 * unsubscribe function. Events targeting a different `videoId` are ignored.
 */
export function onCaptionChange(
	videoId: string,
	handler: (lang: string | null) => void,
): () => void {
	if (typeof window === "undefined") return () => {};
	const listener = (event: Event) => {
		const detail = (event as CustomEvent<CaptionChangeDetail>).detail;
		if (detail && detail.videoId === videoId) handler(detail.lang);
	};
	window.addEventListener(CAPTION_CHANGE_EVENT, listener);
	return () => window.removeEventListener(CAPTION_CHANGE_EVENT, listener);
}
