/**
 * Builder for the player card's localised string bundle.
 *
 * `PlayerCard` (rendered both server-side on the standalone page and
 * client-side inside the modal overlay) takes its UI strings as a prop —
 * the dictionaries must not ship to the client. The bundle is shared by
 * `Player.astro`, `BaseLayout.astro` (the overlay host), and the
 * component tests, so it's assembled here from a bound `t` rather than
 * duplicated at each call site (the `squad-strings.ts` pattern).
 */

import type { BoundT } from "~/i18n/astro";
import type { PlayerStrings } from "~/islands/PlayerCard";

export function buildPlayerStrings(t: BoundT["t"]): PlayerStrings {
	return {
		aged: t("player.aged"),
		position: t("player.position"),
		languageOriginal: t("player.languageOriginal"),
		previous: t("player.previous"),
		next: t("player.next"),
		indicator: t("player.indicator"),
		video: {
			play: t("player.video.play"),
			tapToPlay: t("player.video.tapToPlay"),
			nowPlaying: t("player.video.nowPlaying"),
			unavailable: t("player.video.unavailable"),
			errorHeading: t("player.video.errorHeading"),
			errorBody: t("player.video.errorBody"),
			retry: t("player.video.retry"),
		},
		videoTitle: t("player.video.title"),
		chips: {
			captionsLabel: t("player.chips.captionsLabel"),
			captionsOff: t("player.chips.captionsOff"),
			captionsAvailable: t("player.chips.captionsAvailable"),
			share: t("player.chips.share"),
			shareCopy: t("player.chips.shareCopy"),
			shareCopied: t("player.chips.shareCopied"),
			shareNative: t("player.chips.shareNative"),
		},
		shareTitle: t("player.chips.shareTitle"),
		close: t("player.close"),
		swipeHint: t("player.swipeHint"),
		swipeHintSub: t("player.swipeHintSub"),
	};
}
