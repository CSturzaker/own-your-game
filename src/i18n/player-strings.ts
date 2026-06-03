/**
 * Builder for the player card's localised string bundle.
 *
 * `PlayerCard` (rendered both server-side on the standalone page and
 * client-side inside the modal overlay) takes its UI strings as a prop —
 * the dictionaries must not ship to the client. The bundle is shared by
 * `Player.astro`, `BaseLayout.astro` (the overlay host), and the
 * component tests, so it's assembled here from a bound `t` rather than
 * duplicated at each call site (the `squad-strings.ts` pattern).
 *
 * Theme labels are reused from `squad.themes.*` so the tag wording stays
 * in lockstep with the squad filter chips.
 */

import type { BoundT } from "~/i18n/astro";
import type { PlayerStrings } from "~/islands/PlayerCard";

export function buildPlayerStrings(t: BoundT["t"]): PlayerStrings {
	return {
		themes: {
			fairness: t("squad.themes.fairness"),
			belonging: t("squad.themes.belonging"),
			friendship: t("squad.themes.friendship"),
			confidence: t("squad.themes.confidence"),
			family: t("squad.themes.family"),
			community: t("squad.themes.community"),
		},
		aged: t("player.aged"),
		position: t("player.position"),
		languageOriginal: t("player.languageOriginal"),
		previous: t("player.previous"),
		next: t("player.next"),
		indicator: t("player.indicator"),
		videoComingSoon: t("player.videoComingSoon"),
		close: t("player.close"),
	};
}
