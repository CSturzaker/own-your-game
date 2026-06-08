import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";

import { interpolate } from "~/i18n/interpolate";
import { Popover } from "~/islands/ui/Popover";
import { formatVoiceCount } from "~/lib/header";
import { chipClasses } from "~/lib/primitives";
import {
	applyFilters,
	countryOptions,
	hasActiveFilter,
	languageOptions,
	type FilterOption,
	type SquadFilterState,
} from "~/lib/squad-filters";
import {
	SQUAD_FILTERS_CHANGED,
	SQUAD_FILTERS_RESET,
	parseFilters,
	updateUrl,
} from "~/lib/squad-url";
import type { Voice } from "~/lib/voice";

/**
 * Localised strings for the filter bar, resolved by the Astro host
 * (`Squad.astro`) and threaded in. The chip and count entries are
 * `{var}` templates the island interpolates with live values (country
 * and language display names come from `Intl`, English for now).
 */
export interface SquadFiltersStrings {
	ariaLabel: string;
	label: string;
	all: string;
	allCountries: string;
	allLanguages: string;
	reset: string;
	showingTemplate: string;
	totalTemplate: string;
	chipCountry: string;
	chipLanguage: string;
}

export interface SquadFiltersProps {
	/** Localised UI strings (see {@link SquadFiltersStrings}). */
	strings: SquadFiltersStrings;
	/** Full voice list — drives the available option lists and count. */
	voices: readonly Voice[];
	/** Text direction — `"rtl"` on Arabic, so the popovers align correctly. */
	dir?: "ltr" | "rtl";
	/**
	 * Pre-hydration filter selection. The mount effect immediately
	 * replaces this with the URL-derived state; it exists mainly so
	 * component tests can render a seeded bar without a URL.
	 */
	initialFilters?: SquadFilterState;
}

interface BoldCountProps {
	template: string;
	/** Placeholder to bold (e.g. "count" or "total"). */
	boldKey: string;
	/** The (formatted) value rendered in place of the bold placeholder. */
	boldValue: string;
	/** Remaining placeholders to interpolate as plain text. */
	vars?: Record<string, string | number>;
}

/**
 * Render a templated count string with one placeholder bolded. The other
 * placeholders are interpolated as plain text first, then the template is
 * split on the bold placeholder so the number can be wrapped in `<span>`
 * while the surrounding words stay translatable.
 */
function BoldCount({ template, boldKey, boldValue, vars }: BoldCountProps): JSX.Element {
	const [before, after] = interpolate(template, vars).split(`{${boldKey}}`);
	return (
		<>
			{before}
			<span className="text-ink font-semibold">{boldValue}</span>
			{after}
		</>
	);
}

/** Move focus between option buttons with the arrow / Home / End keys. */
function handleRovingKeys(event: KeyboardEvent<HTMLButtonElement>): void {
	const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
	if (!keys.includes(event.key)) return;
	const container = event.currentTarget.closest("[data-options]");
	if (!container) return;
	const items = Array.from(container.querySelectorAll<HTMLButtonElement>("[data-option]"));
	if (items.length === 0) return;
	const current = items.indexOf(event.currentTarget);
	event.preventDefault();
	let next: number;
	switch (event.key) {
		case "ArrowDown":
			next = current < 0 ? 0 : (current + 1) % items.length;
			break;
		case "ArrowUp":
			next = current <= 0 ? items.length - 1 : current - 1;
			break;
		case "Home":
			next = 0;
			break;
		default:
			next = items.length - 1;
	}
	items[next]?.focus();
}

interface FilterPopoverProps<T extends string | number> {
	/** Chip text, e.g. "Theme: All". */
	triggerLabel: string;
	active: boolean;
	/** Label for the "clear this dimension" option, e.g. "All themes". */
	allLabel: string;
	options: FilterOption<T>[];
	selected: T | undefined;
	onSelect: (value: T | undefined) => void;
	/** Long lists (country) scroll inside the popover. */
	scrollable?: boolean;
	/** Text direction for the popover. */
	dir?: "ltr" | "rtl";
}

function FilterPopover<T extends string | number>({
	triggerLabel,
	active,
	allLabel,
	options,
	selected,
	onSelect,
	scrollable = false,
	dir,
}: FilterPopoverProps<T>): JSX.Element {
	const [open, setOpen] = useState(false);

	const choose = (value: T | undefined): void => {
		onSelect(value);
		setOpen(false);
	};

	const optionClass = (isSelected: boolean): string =>
		[
			"text-caption hover:bg-paper-2 text-ink flex w-full items-center justify-between gap-3 rounded-[3px] px-3 py-2 text-start",
			isSelected ? "font-semibold" : "font-medium",
		].join(" ");

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<button type="button" className={chipClasses(active ? "active" : "default")}>
					<span>{triggerLabel}</span>
					<span aria-hidden="true" className="text-ink-3 text-[10px]">
						▾
					</span>
				</button>
			</Popover.Trigger>
			<Popover.Portal>
				{/* `end` under RTL aligns the menu to the trigger's trailing
				    edge (Radix has no dir context here). */}
				<Popover.Content align={dir === "rtl" ? "end" : "start"} className="w-[240px] p-1.5">
					<ul
						data-options
						className={["flex flex-col", scrollable ? "max-h-[260px] overflow-auto" : ""]
							.filter(Boolean)
							.join(" ")}
					>
						<li>
							<button
								type="button"
								data-option
								aria-current={selected === undefined ? "true" : undefined}
								className={optionClass(selected === undefined)}
								onClick={() => choose(undefined)}
								onKeyDown={handleRovingKeys}
							>
								{allLabel}
								{selected === undefined && <Check />}
							</button>
						</li>
						{options.map((option) => {
							const isSelected = option.value === selected;
							return (
								<li key={String(option.value)}>
									<button
										type="button"
										data-option
										aria-current={isSelected ? "true" : undefined}
										className={optionClass(isSelected)}
										onClick={() => choose(option.value)}
										onKeyDown={handleRovingKeys}
									>
										{option.label}
										{isSelected && <Check />}
									</button>
								</li>
							);
						})}
					</ul>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}

function Check(): JSX.Element {
	return (
		<svg viewBox="0 0 16 16" className="text-brand-orange size-3.5 shrink-0" aria-hidden="true">
			<path
				d="M13 4 6 11 3 8"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/**
 * Squad filter bar — two single-select dropdowns (country, language),
 * a reset link, and a live count. (Theme + age filters were dropped in
 * DEV-110; the data stays on the Voice record.)
 *
 * The URL is the source of truth: on mount and on browser back/forward
 * the selection is read from the query string; every user change pushes
 * a new history entry and broadcasts `squad:filters-changed` so the grid
 * (DEV-60) re-filters. The count reflects the live intersection.
 */
export function SquadFilters({
	strings,
	voices,
	dir,
	initialFilters = {},
}: SquadFiltersProps): JSX.Element {
	const [filters, setFilters] = useState<SquadFilterState>(initialFilters);

	const countries = useMemo(() => countryOptions(voices), [voices]);
	const languages = useMemo(() => languageOptions(voices), [voices]);

	// Chip labels — "Country: Nigeria" / "Language: All" — built from the
	// localised templates with the selected value (or the "All" fallback).
	const countryName_ = filters.country
		? (countries.find((c) => c.value === filters.country)?.label ?? filters.country)
		: strings.all;
	const languageName_ = filters.language
		? (languages.find((l) => l.value === filters.language)?.label ?? filters.language)
		: strings.all;

	const total = voices.length;
	const active = hasActiveFilter(filters);
	const filteredCount = useMemo(() => applyFilters(voices, filters).length, [voices, filters]);

	/** Broadcast the active filters so the grid island can re-filter. */
	const broadcast = useCallback((next: SquadFilterState): void => {
		window.dispatchEvent(
			new CustomEvent<SquadFilterState>(SQUAD_FILTERS_CHANGED, { detail: next }),
		);
	}, []);

	/** Adopt URL-driven state (mount + back/forward) without re-pushing. */
	const syncFromUrl = useCallback((): void => {
		const next = parseFilters(new URLSearchParams(window.location.search));
		setFilters(next);
		broadcast(next);
	}, [broadcast]);

	useEffect(() => {
		// Defer the mount sync a frame (matches LetterRail) so first paint
		// matches the SSR "all filters off" markup, then the URL-derived
		// state catches up — avoids a hydration mismatch when the URL
		// carries params.
		const frame = requestAnimationFrame(syncFromUrl);
		window.addEventListener("popstate", syncFromUrl);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("popstate", syncFromUrl);
		};
	}, [syncFromUrl]);

	/** A user-initiated change: update state, the URL, and the grid. */
	const apply = useCallback(
		(next: SquadFilterState): void => {
			setFilters(next);
			updateUrl(next);
			broadcast(next);
		},
		[broadcast],
	);

	// The empty-state "Reset filters" CTA lives in the grid island; it
	// dispatches SQUAD_FILTERS_RESET rather than reaching into our state,
	// keeping this bar the single source of truth.
	useEffect(() => {
		const onReset = (): void => apply({});
		window.addEventListener(SQUAD_FILTERS_RESET, onReset);
		return () => window.removeEventListener(SQUAD_FILTERS_RESET, onReset);
	}, [apply]);

	const set = <K extends keyof SquadFilterState>(key: K, value: SquadFilterState[K]): void =>
		apply({ ...filters, [key]: value });

	return (
		<section
			aria-label={strings.ariaLabel}
			className="border-rule bg-paper/95 flex flex-wrap items-center gap-3 border-y py-3 backdrop-blur-sm lg:sticky lg:top-15 lg:z-10"
		>
			<span className="font-display tracking-kicker text-ink-3 text-kicker font-bold uppercase">
				{strings.label}
			</span>

			<FilterPopover
				triggerLabel={interpolate(strings.chipCountry, { value: countryName_ })}
				active={filters.country !== undefined}
				allLabel={strings.allCountries}
				options={countries}
				selected={filters.country}
				onSelect={(value) => set("country", value)}
				dir={dir}
				scrollable
			/>
			<FilterPopover
				triggerLabel={interpolate(strings.chipLanguage, { value: languageName_ })}
				active={filters.language !== undefined}
				allLabel={strings.allLanguages}
				options={languages}
				selected={filters.language}
				onSelect={(value) => set("language", value)}
				dir={dir}
			/>

			{active && (
				<button
					type="button"
					className="font-body text-caption text-ink-3 hover:text-ink underline-offset-2 hover:underline"
					onClick={() => apply({})}
				>
					{strings.reset}
				</button>
			)}

			<p className="font-body text-caption text-ink-3 ms-auto" aria-live="polite">
				{active ? (
					<BoldCount
						template={strings.showingTemplate}
						boldKey="count"
						boldValue={formatVoiceCount(filteredCount)}
						vars={{ total: formatVoiceCount(total) }}
					/>
				) : (
					<BoldCount
						template={strings.totalTemplate}
						boldKey="total"
						boldValue={formatVoiceCount(total)}
					/>
				)}
			</p>
		</section>
	);
}
