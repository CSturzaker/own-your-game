import { useMemo, useState, type KeyboardEvent } from "react";

import { Popover } from "~/islands/ui/Popover";
import { chipClasses } from "~/lib/primitives";
import {
	AGE_OPTIONS,
	ageChipLabel,
	countryChipLabel,
	countryOptions,
	hasActiveFilter,
	languageChipLabel,
	languageOptions,
	themeChipLabel,
	themeOptions,
	type FilterOption,
	type SquadFilterState,
} from "~/lib/squad-filters";
import { formatVoiceCount } from "~/lib/header";
import type { Voice } from "~/lib/voice";

export interface SquadFiltersProps {
	/** Full voice list — drives the available option lists and count. */
	voices: readonly Voice[];
	/**
	 * Initial filter selection. Defaults to empty (no narrowing). DEV-59
	 * will seed this from the URL and lift selection into URL state; for
	 * now the island owns its selection locally.
	 */
	initialFilters?: SquadFilterState;
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
}

function FilterPopover<T extends string | number>({
	triggerLabel,
	active,
	allLabel,
	options,
	selected,
	onSelect,
	scrollable = false,
}: FilterPopoverProps<T>): JSX.Element {
	const [open, setOpen] = useState(false);

	const choose = (value: T | undefined): void => {
		onSelect(value);
		setOpen(false);
	};

	const optionClass = (isSelected: boolean): string =>
		[
			"text-caption hover:bg-paper-2 text-ink flex w-full items-center justify-between gap-3 rounded-[3px] px-3 py-2 text-left",
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
				<Popover.Content align="start" className="w-[240px] p-1.5">
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
 * Squad filter bar — four single-select dropdowns (theme, country,
 * language, age), a reset link, and a live count.
 *
 * DEV-58 scope: the UI and local selection state. The selection does
 * not yet narrow the grid or write to the URL — that intersection +
 * URL-state binding is DEV-59, which feeds the real filtered count into
 * the display below. Until then the count shows the full total.
 */
export function SquadFilters({ voices, initialFilters = {} }: SquadFiltersProps): JSX.Element {
	const [filters, setFilters] = useState<SquadFilterState>(initialFilters);

	const countries = useMemo(() => countryOptions(voices), [voices]);
	const languages = useMemo(() => languageOptions(voices), [voices]);
	const themes = useMemo(() => themeOptions(), []);
	const ages = useMemo<FilterOption<number>[]>(
		() => AGE_OPTIONS.map((age) => ({ value: age, label: String(age) })),
		[],
	);

	const total = voices.length;
	const active = hasActiveFilter(filters);

	const set = <K extends keyof SquadFilterState>(key: K, value: SquadFilterState[K]): void =>
		setFilters((prev) => ({ ...prev, [key]: value }));

	return (
		<section
			aria-label="Filter voices"
			className="border-rule bg-paper flex flex-wrap items-center gap-3 border-y py-3 lg:sticky lg:top-20 lg:z-10"
		>
			<span className="font-display tracking-kicker text-ink-3 text-kicker font-bold uppercase">
				Filter
			</span>

			<FilterPopover
				triggerLabel={themeChipLabel(filters.theme)}
				active={filters.theme !== undefined}
				allLabel="All themes"
				options={themes}
				selected={filters.theme}
				onSelect={(value) => set("theme", value)}
			/>
			<FilterPopover
				triggerLabel={countryChipLabel(filters.country)}
				active={filters.country !== undefined}
				allLabel="All countries"
				options={countries}
				selected={filters.country}
				onSelect={(value) => set("country", value)}
				scrollable
			/>
			<FilterPopover
				triggerLabel={languageChipLabel(filters.language)}
				active={filters.language !== undefined}
				allLabel="All languages"
				options={languages}
				selected={filters.language}
				onSelect={(value) => set("language", value)}
			/>
			<FilterPopover
				triggerLabel={ageChipLabel(filters.age)}
				active={filters.age !== undefined}
				allLabel="Any age"
				options={ages}
				selected={filters.age}
				onSelect={(value) => set("age", value)}
			/>

			{active && (
				<button
					type="button"
					className="font-body text-caption text-ink-3 hover:text-ink underline-offset-2 hover:underline"
					onClick={() => setFilters({})}
				>
					Reset filters
				</button>
			)}

			<p className="font-body text-caption text-ink-3 ml-auto">
				<span className="text-ink font-semibold">{formatVoiceCount(total)}</span> voices
			</p>
		</section>
	);
}
