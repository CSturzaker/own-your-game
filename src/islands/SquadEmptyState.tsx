import type { JSX } from "react";

import { buttonClasses } from "~/lib/primitives";

/** Localised strings, resolved by the Astro host and threaded through the grid. */
export interface SquadEmptyStateStrings {
	heading: string;
	description: string;
	reset: string;
	browseAll: string;
	/** Locale-aware `/squad` link for "Browse all voices". */
	browseHref: string;
}

export interface SquadEmptyStateProps {
	/** Localised UI strings (see {@link SquadEmptyStateStrings}). */
	strings: SquadEmptyStateStrings;
	/** Clear every filter in-place (dispatches the reset to the filter bar). */
	onReset: () => void;
}

/**
 * Shown inside the squad grid when the active filters match no voices.
 *
 * A React component, not the `EmptyState.astro` the issue names: it has
 * to mount and unmount on client-side filter state, which an Astro
 * component can't do from inside the grid island. Container treatment
 * (dashed rule, paper-2 card, 28px uppercase heading, 15px/44ch body)
 * follows the prototype; the copy and the two CTAs are the issue's
 * generic, shippable spec — the prototype's paragraph is a
 * filter-specific illustration, not literal copy.
 *
 * The "Reset filters" CTA clears in place via {@link onReset}; "Browse
 * all voices" is a plain link to a clean `/squad`.
 */
export function SquadEmptyState({ strings, onReset }: SquadEmptyStateProps): JSX.Element {
	return (
		<div
			data-squad-empty
			className="rounded-card border-rule bg-paper-2 flex flex-col items-center gap-4 border border-dashed px-8 py-20 text-center"
		>
			<svg
				viewBox="0 0 48 48"
				className="text-brand-orange size-14"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<circle cx="20" cy="20" r="13" />
				<path d="m38 38-8.5-8.5" />
				<path d="m15.5 15.5 9 9M24.5 15.5l-9 9" />
			</svg>

			<p className="font-display tracking-team-sheet text-ink text-[28px] leading-none font-bold uppercase">
				{strings.heading}
			</p>

			<p className="font-body text-small text-ink-2 max-w-[44ch] text-balance">
				{strings.description}
			</p>

			<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
				<button type="button" className={buttonClasses("primary", "md")} onClick={onReset}>
					{strings.reset}
				</button>
				<a href={strings.browseHref} className={buttonClasses("ghost", "md")}>
					{strings.browseAll}
				</a>
			</div>
		</div>
	);
}
