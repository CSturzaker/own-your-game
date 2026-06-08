import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type JSX } from "react";

import { interpolate } from "~/i18n/interpolate";
import { buttonClasses, KICKER_CLASSES } from "~/lib/primitives";
import {
	arrivedIds,
	FLASH_DURATION_MS,
	MOBILE_VISIBLE_COUNT,
	pickPositions,
	ROTATION_INTERVAL_MS,
	rotateOnce,
	shuffle,
	SWAP_COUNT,
	VISIBLE_COUNT,
} from "~/lib/rotation";
import { loadVoiceIndex } from "~/lib/voice-index-client";
import type { VoiceIndexEntry } from "~/lib/voice-index";

import { RotationTile } from "./RotationTile";

/**
 * Localised strings the rotation needs, resolved by the Astro host
 * (`StartingEleven.astro`) and threaded in so the dictionaries stay out
 * of the client bundle. `countdownTemplate` carries the `{seconds}`
 * placeholder; `tileAccessibleName` carries the tile a11y template.
 */
export interface RotatingElevenStrings {
	kicker: string;
	heading: string;
	supporting: string;
	pause: string;
	resume: string;
	pauseShort: string;
	resumeShort: string;
	paused: string;
	reducedMotion: string;
	countdownTemplate: string;
	tileAccessibleName: string;
	nextEleven: string;
}

export interface RotatingElevenProps {
	/** Localised UI strings (see {@link RotatingElevenStrings}). */
	strings: RotatingElevenStrings;
	/**
	 * Voices visible on first paint. Must match what SSR rendered or
	 * React will throw a hydration mismatch. The first 11 of the
	 * (trimmed) pool from the Astro page.
	 */
	initialVoices: readonly VoiceIndexEntry[];
	/**
	 * The pool the rotation draws from, shuffled client-side on mount
	 * so per-visit randomness doesn't fight SSR. Supplied directly by
	 * demo pages (a fixture). The home page omits it and sets
	 * {@link fetchPool} instead, so the full ~350-voice pool is fetched
	 * lazily rather than inlined on every load (DEV-107).
	 */
	allVoices?: readonly VoiceIndexEntry[];
	/**
	 * Fetch the rotation pool from `/voices-index.json` on mount instead
	 * of taking it via {@link allVoices}. The home page sets this so the
	 * page ships only the visible 11; until the fetch resolves the
	 * rotation simply has no spares and holds on `initialVoices`.
	 */
	fetchPool?: boolean;
	/**
	 * Demo-only override that pins the reduced-motion treatment
	 * regardless of the OS preference. The runtime path always
	 * reads `prefers-reduced-motion` via `matchMedia`; this prop
	 * lets `/demo/starting-eleven` preview the pill state without
	 * the reviewer toggling their OS setting.
	 */
	forceReducedMotion?: boolean;
}

/**
 * The home page's rotating starting eleven.
 *
 * Owns the desktop 1-4-3-3 formation, the mobile 2×4 grid, the
 * pause/countdown control row, the "Bring on the next eleven" CTA,
 * and the reduced-motion fallback pill. The Astro shell
 * (`src/components/home/StartingEleven.astro`) keeps only the
 * section wrapper + the skeleton loading branch; everything dynamic
 * lives here.
 *
 * Behaviour:
 *
 * - **Initial render** matches what SSR produced (`initialVoices`)
 *   so hydration is silent.
 * - **On mount** the full `allVoices` list is shuffled client-side
 *   (per-visit `Math.random()` — we want each visitor to see a
 *   different opening tile order). The shuffle and pool index live
 *   in refs so re-renders don't reset them.
 * - **Every {@link ROTATION_INTERVAL_MS}** the island picks
 *   {@link SWAP_COUNT} of the {@link VISIBLE_COUNT} positions at
 *   random and replaces them from the pool. The arrived ids drive
 *   the `flash` prop on `RotationTile`, which fades amber over
 *   {@link FLASH_DURATION_MS}.
 * - **Countdown** ticks down each second from 8 to 0, then loops.
 *   When paused, the indicator shows "Paused".
 * - **Pause button** toggles `userPaused`. When effective-paused
 *   (`userPaused || reducedMotion`) the timers don't tick.
 * - **"Bring on the next eleven"** triggers one rotation on demand,
 *   regardless of pause state — it's a deliberate user action, not
 *   the automatic cycle. It resyncs the auto-rotation clock (via
 *   `rotateNonce`) so the next automatic swap is a full interval
 *   away, and under reduced motion it swaps instantly with no flash.
 * - **Reduced motion** is detected at mount via `matchMedia` and
 *   re-evaluated on the media query's `change` event so an OS-level
 *   toggle mid-session takes effect immediately. While reduced
 *   motion is on, the controls collapse to the static
 *   "Reduced motion — rotation paused" pill — userPaused is still
 *   tracked underneath so if the user later turns reduced-motion
 *   off, the rotation resumes (unless they had also paused).
 *
 * Strict-mode safety: every interval / timeout / matchMedia listener
 * is created inside a `useEffect` and torn down in its cleanup
 * function so React 18 dev double-mounting can't leak handles. The
 * pool ref is reset only when `allVoices` actually changes
 * (referential check, not deep).
 */
export function RotatingEleven({
	strings,
	initialVoices,
	allVoices,
	fetchPool = false,
	forceReducedMotion = false,
}: RotatingElevenProps): JSX.Element {
	const [currentVoices, setCurrentVoices] = useState<readonly VoiceIndexEntry[]>(initialVoices);
	const [flashIds, setFlashIds] = useState<Set<string>>(() => new Set());
	const [userPaused, setUserPaused] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(ROTATION_INTERVAL_MS / 1000);
	// Bumped on every manual "next eleven" click so the auto-rotation
	// timers tear down and restart from a fresh interval — keeps a manual
	// swap from being shadowed by an automatic one a moment later.
	const [rotateNonce, setRotateNonce] = useState(0);

	// The rotation pool. Demo pages pass it via `allVoices`; the home page
	// sets `fetchPool` and we load it lazily from the index (DEV-107). Until
	// it arrives the pool is just the visible 11 — no spares, so the swap is
	// a no-op and the formation holds.
	const [fetchedPool, setFetchedPool] = useState<readonly VoiceIndexEntry[] | null>(null);
	const pool = fetchPool ? (fetchedPool ?? initialVoices) : (allVoices ?? initialVoices);

	const poolRef = useRef<readonly VoiceIndexEntry[]>([]);
	const poolIndexRef = useRef(0);
	const flashClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Lazily fetch the full pool on the home page.
	useEffect(() => {
		if (!fetchPool) return;
		let cancelled = false;
		loadVoiceIndex()
			.then((index) => {
				if (!cancelled) setFetchedPool(index);
			})
			.catch(() => {
				/* keep the visible 11 — rotation just won't have spares */
			});
		return () => {
			cancelled = true;
		};
	}, [fetchPool]);

	// Subscribe to the OS reduced-motion preference. useSyncExternalStore
	// reads the live value synchronously (no flash of the wrong state
	// on first paint) and re-subscribes on every change. The third
	// callback is the SSR snapshot: assume motion-safe so server output
	// matches the typical visitor.
	const detectedReducedMotion = useSyncExternalStore(
		subscribeReducedMotion,
		getReducedMotionSnapshot,
		getReducedMotionServerSnapshot,
	);
	const reducedMotion = forceReducedMotion || detectedReducedMotion;
	const paused = userPaused || reducedMotion;

	// Build the per-visit shuffled pool once we're on the client. Reset
	// whenever the pool identity changes — for the home page that's the
	// initial 11, then the full fetched index once it resolves.
	useEffect(() => {
		poolRef.current = shuffle(pool);
		poolIndexRef.current = 0;
	}, [pool]);

	// One rotation step, shared by the automatic tick and the manual
	// "next eleven" button. `flash` drives the amber arrival highlight —
	// the auto-rotation always flashes; a manual rotate under reduced
	// motion swaps instantly with no flash. Stable (no reactive deps —
	// only setters and refs) so it can sit in the interval effect's deps
	// without restarting the timer on every render.
	const performRotation = useCallback((flash: boolean) => {
		setCurrentVoices((prev) => {
			const positions = pickPositions(prev.length, Math.min(SWAP_COUNT, prev.length));
			const { next, poolIndex } = rotateOnce(
				prev,
				poolRef.current,
				poolIndexRef.current,
				positions,
			);
			poolIndexRef.current = poolIndex;

			if (flash) {
				const arrived = arrivedIds(prev, next);
				setFlashIds(arrived);
				if (flashClearRef.current) clearTimeout(flashClearRef.current);
				flashClearRef.current = setTimeout(() => setFlashIds(new Set()), FLASH_DURATION_MS);
			}

			return next;
		});
		setSecondsLeft(ROTATION_INTERVAL_MS / 1000);
	}, []);

	// Rotation tick. Skipped entirely when paused; restarted whenever
	// the paused flag flips or a manual rotate bumps `rotateNonce`.
	// Strict-mode safe because the cleanup clears the interval before
	// the effect re-runs. The countdown is NOT reset on resume — it
	// picks up from wherever it paused, which reads as "we paused at 3s,
	// we resume at 3s" rather than a sudden jump back to 8s.
	useEffect(() => {
		if (paused) return;
		const id = setInterval(() => performRotation(true), ROTATION_INTERVAL_MS);
		return () => {
			clearInterval(id);
		};
	}, [paused, performRotation, rotateNonce]);

	// Countdown tick — independent 1s interval so the displayed
	// seconds stay smooth even if the rotation tick drifts. Stops
	// when paused.
	useEffect(() => {
		if (paused) return;
		const id = setInterval(() => {
			setSecondsLeft((s) => (s <= 1 ? ROTATION_INTERVAL_MS / 1000 : s - 1));
		}, 1000);
		return () => {
			clearInterval(id);
		};
	}, [paused, rotateNonce]);

	// Drain any pending flash timeout on unmount so a navigation
	// during a 1.5s flash window doesn't try to call setState on a
	// teardown component.
	useEffect(() => {
		return () => {
			if (flashClearRef.current) clearTimeout(flashClearRef.current);
		};
	}, []);

	const mobileVoices = currentVoices.slice(0, MOBILE_VISIBLE_COUNT);
	const desktop = formationSlices(currentVoices);

	const countdownText = paused
		? strings.paused
		: interpolate(strings.countdownTemplate, { seconds: secondsLeft });
	const pauseLabel = userPaused ? strings.resume : strings.pause;
	const pauseIcon = userPaused ? "▶" : "⏸";

	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-col gap-4 lg:flex-row lg:items-baseline lg:justify-between lg:gap-6">
				<div className="flex-1">
					<p className={`${KICKER_CLASSES} lg:text-kicker text-[10px]`}>{strings.kicker}</p>
					<h2 className="font-display tracking-team-sheet mt-3 text-[26px] leading-none font-bold uppercase lg:mt-4 lg:text-[48px]">
						{strings.heading}
					</h2>
					<p className="text-small text-ink-2 mt-3 hidden max-w-[60ch] lg:block">
						{strings.supporting}
					</p>
				</div>

				{/* Desktop control row — header right column on lg. */}
				<div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-2.5">
					{reducedMotion ? (
						<ReducedMotionPill label={strings.reducedMotion} />
					) : (
						<>
							<button
								type="button"
								onClick={() => setUserPaused((p) => !p)}
								aria-pressed={userPaused}
								className="group rounded-pill border-rule font-body text-caption hover:bg-ink hover:text-paper hover:border-ink text-ink inline-flex min-h-9 items-center justify-center gap-2 border bg-transparent px-4 py-[9px] font-semibold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98]"
							>
								{pauseLabel}
								<span aria-hidden="true">{pauseIcon}</span>
							</button>
							<p className="font-body text-small text-ink flex items-center gap-2.5 font-medium tabular-nums">
								<span
									data-pulse={!userPaused ? "" : undefined}
									aria-hidden="true"
									className="bg-brand-orange rounded-pill block size-2"
								/>
								<span aria-live="polite" aria-atomic="true">
									{countdownText}
								</span>
							</p>
						</>
					)}
				</div>
			</header>

			{/* Desktop — 1-4-3-3 formation. */}
			<div data-eleven-formation className="hidden flex-col gap-[18px] lg:flex">
				{desktop.keeper.length > 0 && (
					<div className="grid grid-cols-1 px-[42%]">
						{desktop.keeper.map((t) => (
							<RotationTile
								key={t.position}
								voice={t.voice}
								position={t.position}
								flash={flashIds.has(t.voice.id)}
								accessibleNameTemplate={strings.tileAccessibleName}
							/>
						))}
					</div>
				)}
				{desktop.defenders.length > 0 && (
					<div className="grid grid-cols-4 gap-[18px]">
						{desktop.defenders.map((t) => (
							<RotationTile
								key={t.position}
								voice={t.voice}
								position={t.position}
								flash={flashIds.has(t.voice.id)}
								accessibleNameTemplate={strings.tileAccessibleName}
							/>
						))}
					</div>
				)}
				{desktop.midfielders.length > 0 && (
					<div className="grid grid-cols-3 gap-[18px] px-[11%]">
						{desktop.midfielders.map((t) => (
							<RotationTile
								key={t.position}
								voice={t.voice}
								position={t.position}
								flash={flashIds.has(t.voice.id)}
								accessibleNameTemplate={strings.tileAccessibleName}
							/>
						))}
					</div>
				)}
				{desktop.forwards.length > 0 && (
					<div className="grid grid-cols-3 gap-[18px] px-[17%]">
						{desktop.forwards.map((t) => (
							<RotationTile
								key={t.position}
								voice={t.voice}
								position={t.position}
								flash={flashIds.has(t.voice.id)}
								accessibleNameTemplate={strings.tileAccessibleName}
							/>
						))}
					</div>
				)}
			</div>

			{/* Mobile — 2-col grid of up to 8 tiles. */}
			<div data-eleven-mobile className="grid grid-cols-2 gap-2 lg:hidden">
				{mobileVoices.map((voice, i) => (
					<RotationTile
						key={i + 1}
						voice={voice}
						position={i + 1}
						flash={flashIds.has(voice.id)}
						accessibleNameTemplate={strings.tileAccessibleName}
					/>
				))}
			</div>

			{/* Mobile control row — sits below the grid. */}
			<div className="flex items-center justify-between gap-3 lg:hidden">
				{reducedMotion ? (
					<ReducedMotionPill label={strings.reducedMotion} />
				) : (
					<>
						<p className="font-body text-small text-ink flex items-center gap-2 font-medium tabular-nums">
							<span
								data-pulse={!userPaused ? "" : undefined}
								aria-hidden="true"
								className="bg-brand-orange rounded-pill block size-1.5"
							/>
							<span aria-live="polite" aria-atomic="true">
								{countdownText}
							</span>
						</p>
						<button
							type="button"
							onClick={() => setUserPaused((p) => !p)}
							aria-pressed={userPaused}
							className="group rounded-pill border-rule font-body text-caption hover:bg-ink hover:text-paper hover:border-ink text-ink inline-flex min-h-9 items-center justify-center gap-2 border bg-transparent px-4 py-[9px] font-semibold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98]"
						>
							{userPaused ? strings.resumeShort : strings.pauseShort}
							<span aria-hidden="true">{pauseIcon}</span>
						</button>
					</>
				)}
			</div>

			{/* "Bring on the next eleven" — manual rotate on demand. Desktop
			    only, matching the prototype (the mobile grid has no CTA).
			    Mirrors Button.astro's amber CTA markup so styling stays in
			    sync via the shared `buttonClasses` resolver. */}
			<div className="hidden justify-center lg:flex">
				<button
					type="button"
					onClick={() => {
						performRotation(!reducedMotion);
						setRotateNonce((n) => n + 1);
					}}
					className={buttonClasses("amber", "lg")}
				>
					{strings.nextEleven}
					<span
						className="font-display font-bold transition-transform duration-200 group-hover:translate-x-1 rtl:-scale-x-100"
						aria-hidden="true"
					>
						↻
					</span>
				</button>
			</div>
		</div>
	);
}

function ReducedMotionPill({ label }: { label: string }): JSX.Element {
	return (
		<span className="font-body bg-paper-2 text-ink-2 border-rule rounded-pill border px-3.5 py-1.5 text-[12px] font-semibold">
			{label}
		</span>
	);
}

interface FormationSlice {
	voice: VoiceIndexEntry;
	position: number;
}

interface FormationSlices {
	keeper: FormationSlice[];
	defenders: FormationSlice[];
	midfielders: FormationSlice[];
	forwards: FormationSlice[];
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
	// SSR has no `window`; assume motion-safe so the server output
	// matches the default-state visitor. Hydration will correct it
	// in the very first frame if the visitor actually has reduced
	// motion on.
	return false;
}

/**
 * Inline copy of `formationRows` from `~/lib/starting-eleven` —
 * kept local so the React island doesn't drag the full Astro-side
 * lib into the client bundle. Same partition rules; if either side
 * changes, change both.
 */
function formationSlices(voices: readonly VoiceIndexEntry[]): FormationSlices {
	const eleven = voices.slice(0, VISIBLE_COUNT);
	return {
		keeper: eleven.slice(0, 1).map((voice, i) => ({ voice, position: i + 1 })),
		defenders: eleven.slice(1, 5).map((voice, i) => ({ voice, position: i + 2 })),
		midfielders: eleven.slice(5, 8).map((voice, i) => ({ voice, position: i + 6 })),
		forwards: eleven.slice(8, 11).map((voice, i) => ({ voice, position: i + 9 })),
	};
}
