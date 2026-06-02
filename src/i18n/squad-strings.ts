/**
 * Builders for the squad islands' localised string bundles.
 *
 * `SquadFilters` and `SquadGrid` take their UI strings as props (the
 * dictionaries must not ship to the client). The bundles are non-trivial
 * and shared by the live `/squad` page, the demo pages, and the island
 * component tests, so they're assembled here from a bound `t` rather than
 * duplicated at each call site.
 */

import type { BoundT } from "~/i18n/astro";
import { type Locale } from "~/i18n/config";
import { localiseUrl } from "~/i18n/localise-url";
import type { SquadFiltersStrings } from "~/islands/SquadFilters";
import type { SquadGridStrings } from "~/islands/SquadGrid";

export function buildSquadFiltersStrings(t: BoundT["t"]): SquadFiltersStrings {
	return {
		ariaLabel: t("squad.filters.ariaLabel"),
		label: t("squad.filters.label"),
		all: t("squad.filters.all"),
		allThemes: t("squad.filters.allThemes"),
		allCountries: t("squad.filters.allCountries"),
		allLanguages: t("squad.filters.allLanguages"),
		anyAge: t("squad.filters.anyAge"),
		reset: t("squad.filters.reset"),
		showingTemplate: t("squad.filters.showing"),
		totalTemplate: t("squad.filters.total"),
		chipTheme: t("squad.filters.chipTheme"),
		chipCountry: t("squad.filters.chipCountry"),
		chipLanguage: t("squad.filters.chipLanguage"),
		chipAge: t("squad.filters.chipAge"),
		themes: {
			fairness: t("squad.themes.fairness"),
			belonging: t("squad.themes.belonging"),
			friendship: t("squad.themes.friendship"),
			confidence: t("squad.themes.confidence"),
			family: t("squad.themes.family"),
			community: t("squad.themes.community"),
		},
	};
}

export function buildSquadGridStrings(t: BoundT["t"], locale: Locale): SquadGridStrings {
	return {
		loadMoreTemplate: t("squad.grid.loadMore"),
		allShownTemplate: t("squad.grid.allShown"),
		showingTemplate: t("squad.grid.showing"),
		tileAccessibleName: t("tile.accessibleName"),
		empty: {
			heading: t("squad.empty.heading"),
			description: t("squad.empty.description"),
			reset: t("squad.empty.reset"),
			browseAll: t("squad.empty.browseAll"),
			browseHref: localiseUrl("/squad", locale),
		},
	};
}
