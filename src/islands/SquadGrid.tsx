import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type JSX,
} from "react";

import { RotationTile } from "~/islands/RotationTile";
import { applyFilters, type SquadFilterState } from "~/lib/squad-filters";
import { FADE_MS, PAGE_SIZE, readSquadVoices, sortByNewest, squadTileHref } from "~/lib/squad-grid";
import { parseFilters, SQUAD_FILTERS_CHANGED } from "~/lib/squad-url";
import type { Voice } from "~/lib/voice";

export interface SquadGridProps {
	/**
	 * Voices to render. Omitted on the live page — the island then reads
	 * the pre-rendered list out of the `#squad-data` JSON-in-script block
	 * on mount. Passed directly by the demo page and component tests so
	 * they don't depend on a script block.
	 */
	voices?: readonly Voice[];
	/**
	 * Pre-hydration filter selection. The mount effect immediately
	 * replaces this with the URL-derived state; it exists so component
	 * tests can seed a filtered grid without a URL.
	 */
	initialFilters?: SquadFilterState;
	/**
	 * Demo/test override that pins the reduced-motion treatment
	 * regardless of the OS preference. The runtime path reads
	 * `prefers-reduced-motion` via `matchMedia`.
	 */
	forceReducedMotion?: boolean;
}

const GRID_CLASSES = "grid grid-cols-3 gap-2 md:grid-cols-6 lg:grid-cols-8 lg:gap-3" as const;

/**
 * The full squad's responsive tile grid.
 *
 * Renders skeleton placeholders on first paint, then — once hydrated —
 * the filtered, newest-first voice list as `RotationTile`s linking to
 * the player card. It owns no filter UI: the filter bar (DEV-58/59) is
 * the source of truth and broadcasts `squad:filters-changed`; this grid
 * listens and re-renders the matching subset.
 *
 * Behaviour:
 *
 * - **First paint** renders {@link PAGE_SIZE} skeleton tiles. The server
 *   has no access to the sibling `#squad-data` block, so SSR always
 *   emits skeletons and the client's first render matches — hydration
 *   is silent. The mount effect then reads the voices + URL filters and
 *   swaps in the real tiles.
 * - **Filter change** fades the grid container's opacity to 0 over
 *   {@link FADE_MS}, swaps the tile list while invisible, and fades back
 *   in. Only the container animates — never the hundreds of individual
 *   tiles or grid-layout properties, which would thrash. Under reduced
 *   motion the swap is instant.
 * - **Sort** is newest-first by `publishedAt`; position numbers
 *   (`001…`) follow that order.
 * - **`displayedCount`** caps how many tiles render (the load-more
 *   control in DEV-61 grows it; a filter change resets it).
 */
export function SquadGrid({
	voices: voicesProp,
	initialFilters = {},
	forceReducedMotion = false,
}: SquadGridProps): JSX.Element {
	const [voices, setVoices] = useState<readonly Voice[]>(voicesProp ?? []);
	const [filters, setFilters] = useState<SquadFilterState>(initialFilters);
	const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
	const [hydrated, setHydrated] = useState(false);
	const [dimmed, setDimmed] = useState(false);

	const detectedReducedMotion = useSyncExternalStore(
		subscribeReducedMotion,
		getReducedMotionSnapshot,
		getReducedMotionServerSnapshot,
	);
	const reducedMotion = forceReducedMotion || detectedReducedMotion;

	const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Mount: adopt the real voice list (unless supplied as a prop) and
	// the URL-derived filter state, then reveal the grid. Deferred a
	// frame (matching SquadFilters) so the first paint keeps the SSR
	// skeleton markup and the URL-derived state catches up after — no
	// hydration mismatch when the URL carries filter params.
	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			if (voicesProp === undefined) setVoices(readSquadVoices());
			setFilters(parseFilters(new URLSearchParams(window.location.search)));
			setHydrated(true);
		});
		return () => cancelAnimationFrame(frame);
	}, [voicesProp]);

	const applyChange = useCallback((next: SquadFilterState): void => {
		setFilters(next);
		setDisplayedCount(PAGE_SIZE);
	}, []);

	// Re-filter on the filter bar's broadcast. The listener re-attaches
	// when `filters`/`reducedMotion` change so its closure always sees
	// current values. A no-op change (e.g. the filter island's own mount
	// sync, which echoes the URL state this grid already read) is skipped
	// so it never triggers a spurious fade.
	useEffect(() => {
		function onFiltersChanged(event: Event): void {
			const next = (event as CustomEvent<SquadFilterState>).detail;
			if (filtersEqual(next, filters)) return;

			if (reducedMotion) {
				applyChange(next);
				return;
			}
			setDimmed(true);
			if (fadeTimer.current) clearTimeout(fadeTimer.current);
			fadeTimer.current = setTimeout(() => {
				applyChange(next);
				setDimmed(false);
			}, FADE_MS);
		}

		window.addEventListener(SQUAD_FILTERS_CHANGED, onFiltersChanged);
		return () => window.removeEventListener(SQUAD_FILTERS_CHANGED, onFiltersChanged);
	}, [filters, reducedMotion, applyChange]);

	// Drain a pending fade timer on unmount so a navigation mid-fade
	// doesn't call setState on a torn-down component.
	useEffect(() => {
		return () => {
			if (fadeTimer.current) clearTimeout(fadeTimer.current);
		};
	}, []);

	const visible = useMemo(() => {
		const sorted = sortByNewest(applyFilters(voices, filters));
		return sorted.slice(0, displayedCount);
	}, [voices, filters, displayedCount]);

	if (!hydrated) {
		return (
			<div className={GRID_CLASSES} data-squad-grid data-skeleton-grid>
				{Array.from({ length: PAGE_SIZE }, (_, i) => (
					<div
						key={i}
						data-skeleton
						className="rounded-field relative aspect-4/5 w-full"
						aria-hidden="true"
					/>
				))}
			</div>
		);
	}

	return (
		<div
			className={`${GRID_CLASSES} transition-opacity duration-240 ${dimmed ? "opacity-0" : "opacity-100"}`}
			data-squad-grid
		>
			{visible.map((voice, i) => (
				<RotationTile
					key={voice.id}
					voice={voice}
					position={i + 1}
					href={squadTileHref(voice, filters)}
				/>
			))}
		</div>
	);
}

/** Shallow equality across the four filter dimensions. */
function filtersEqual(a: SquadFilterState, b: SquadFilterState): boolean {
	return (
		a.theme === b.theme && a.country === b.country && a.language === b.language && a.age === b.age
	);
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
	const mq = window.matchMedia(REDUCED_MOTION_QUERY);
	mq.addEventListener("change", onChange);
	return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
	return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
	// SSR has no `window`; assume motion-safe so server output matches
	// the typical visitor. Hydration corrects it in the first frame.
	return false;
}
