import {
	useEffect,
	useLayoutEffect,
	useRef,
	type ElementType,
	type JSX,
	type ReactNode,
} from "react";

import { interpolate } from "~/i18n/interpolate";
import type { PlayerChipsStrings } from "~/islands/PlayerChips";
import type { StreamPlayerStrings } from "~/islands/StreamPlayer";
import { countryName } from "~/lib/countries";
import { languageName } from "~/lib/languages";
import type { DotItem } from "~/lib/player-context";
import { slideOffset } from "~/lib/player-transition";
import { buttonClasses, tagClasses } from "~/lib/primitives";
import { padPosition } from "~/lib/tile";
import type { Voice } from "~/lib/voice";
import type { TagTheme } from "~/lib/primitives";

// `useLayoutEffect` warns when React renders on the server — and this
// component is server-rendered on the standalone `/voice/{id}` page. Fall
// back to `useEffect` there (the transition only runs in the hydrated
// modal anyway); in the browser, the layout effect sets the slide offset
// before paint so the incoming card never flashes at rest first.
const useIsomorphicLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Shared player-card content — the two-column card body: a video panel
 * (left) and a meta panel (right) carrying the theme tag, position №,
 * name/age, location, pull quote, the caption / transcript / share chip
 * row, and the prev/next footer controls. Single column below `lg`.
 *
 * Rendered in three contexts from one component (the Tile.astro /
 * RotationTile precedent): server-rendered on the standalone `/voice/{id}`
 * page (`Player.astro`, no client directive → static HTML, no JS), and
 * client-rendered inside the modal — both the intercepted overlay
 * (`PlayerCardOverlay`) and the controlled shell (`PlayerCardModal`) drop
 * it inside `Dialog.Content`. The "inline vs modal" switch the DEV-44
 * issue describes is this split: `PlayerCard` is always the inline body;
 * `PlayerCardModal` adds the scrim + close chrome around it.
 *
 * The dictionaries never ship to the client, so every string arrives via
 * the `strings` prop, resolved by the Astro host.
 *
 * The video pane (`children`, DEV-46's `StreamPlayer`) and the chip row
 * (`chips`, DEV-47's `PlayerChips`) are supplied by the host — a React
 * child in the modal, a nested `client:idle` island on the standalone page.
 * Prev/next are functional links to the neighbouring voices (full
 * newest-first list); DEV-48 adds active-set awareness, the dot indicator,
 * keyboard shortcuts, and the in-modal swap.
 */
export interface PlayerStrings {
	/** Theme display labels, keyed by theme token (reused from `squad.themes`). */
	readonly themes: Record<TagTheme, string>;
	/** `"aged {age}"`. */
	readonly aged: string;
	/** `"№ {n}"` — the position number, zero-padded by the caller. */
	readonly position: string;
	/** `"{language} (orig.)"` — the original spoken language. */
	readonly languageOriginal: string;
	/** Previous-voice control label. */
	readonly previous: string;
	/** Next-voice control label. */
	readonly next: string;
	/** `"{position} of {total}"` — the plain indicator (no active filter). */
	readonly indicator: string;
	/** `"{position} of {total} {theme} voices"` — the filtered-set indicator. */
	readonly setIndicator: string;
	/** Video-player strings (DEV-46) — passed through to `StreamPlayer`. */
	readonly video: StreamPlayerStrings;
	/** `"{name}’s video"` — accessible `<iframe title>` template (host interpolates). */
	readonly videoTitle: string;
	/** Chip-row strings (DEV-47) — passed through to `PlayerChips`. */
	readonly chips: PlayerChipsStrings;
	/** `"{name} on Own Your Game"` — `navigator.share` title template (host interpolates). */
	readonly shareTitle: string;
	/** Accessible label for the modal/mobile close control. */
	readonly close: string;
	/** Mobile swipe hint — the verb between the arrows ("swipe"). */
	readonly swipeHint: string;
	/** Mobile swipe hint subtitle ("next & previous voice"). */
	readonly swipeHintSub: string;
}

export interface PlayerCardProps {
	voice: Voice;
	/** 1-indexed position within the active set (full list in DEV-43). */
	position: number;
	/** Size of the active set, for the `{position} of {total}` indicator. */
	total: number;
	strings: PlayerStrings;
	/**
	 * Previous-voice href (the standalone page — a real link that
	 * navigates). Undefined disables the control. Ignored when `onPrev` is
	 * given.
	 */
	prevHref?: string;
	/** Next-voice href (page). Undefined disables. Ignored when `onNext` is given. */
	nextHref?: string;
	/**
	 * Previous-voice handler (the modal — swaps in place). Its presence
	 * makes prev a button; absence disables it. Takes precedence over
	 * `prevHref`.
	 */
	onPrev?: () => void;
	/** Next-voice handler (modal swap). Presence enables; takes precedence over `nextHref`. */
	onNext?: () => void;
	/**
	 * Active-set dot indicator model. The modal passes it directly; the
	 * standalone page injects it client-side into `[data-player-dots]`
	 * (DEV-48), so the SSR render leaves the container empty.
	 */
	dots?: readonly DotItem[];
	/**
	 * Indicator label override ("{position} of {total} Friendship voices").
	 * Defaults to the plain `{position} of {total}`; the page enhancement
	 * rewrites `[data-player-indicator]` client-side once the set is known.
	 */
	indicatorLabel?: string;
	/**
	 * Element for the name heading. The standalone page passes `"h1"` (its
	 * single page heading — DEV-86); the modal passes Radix `Dialog.Title`
	 * so the visible name doubles as the dialog's accessible name.
	 */
	TitleTag?: ElementType;
	/**
	 * Element for the pull quote. The page passes `"blockquote"`; the modal
	 * passes Radix `Dialog.Description` for the dialog's accessible
	 * description.
	 */
	QuoteTag?: ElementType;
	/**
	 * Render the mobile full-screen chrome (close button, play affordance,
	 * swipe hint, position label) inside the video pane. Only the standalone
	 * page sets this — on mobile the card _is_ the page (DEV-45). The desktop
	 * modal supplies its own close, so it leaves this off to avoid a second.
	 */
	showMobileChrome?: boolean;
	/**
	 * How prev/next render. `"link"` (default — the standalone page) always
	 * emits anchors so the page's control island can rewrite href / disabled
	 * state in place; `"button"` (the modal) emits buttons that call
	 * `onPrev`/`onNext` to swap.
	 */
	navMode?: "link" | "button";
	/**
	 * Reading direction — flips the next/previous slide-in transition
	 * (DEV-98) so it matches the swipe/arrow reversal. Only the modal
	 * (`navMode="button"`) animates, so the default suffices on the page.
	 */
	dir?: "ltr" | "rtl";
	/**
	 * The video player rendered in the pane (DEV-46's `StreamPlayer`). The
	 * modal passes it as a React child (hydrated with the modal island); the
	 * standalone page passes it as an Astro `client:idle` slot island, which
	 * Astro hydrates independently of the SSR-static card around it.
	 */
	children?: ReactNode;
	/**
	 * The caption / transcript / share chip row (DEV-47's `PlayerChips`),
	 * rendered in the meta panel. Same two-host pattern as `children`: a
	 * React child in the modal, a nested `client:idle` island on the page.
	 */
	chips?: ReactNode;
}

export function PlayerCard({
	voice,
	position,
	total,
	strings,
	prevHref,
	nextHref,
	onPrev,
	onNext,
	dots,
	indicatorLabel,
	TitleTag = "h1",
	QuoteTag = "blockquote",
	showMobileChrome = false,
	navMode = "link",
	dir = "ltr",
	children,
	chips,
}: PlayerCardProps): JSX.Element {
	const theme = voice.theme;
	const cardRef = useRef<HTMLElement>(null);
	const prevPositionRef = useRef(position);

	// Animate the next/previous voice swap in the desktop modal — a
	// direction-aware slide-in + paper cross-fade (DEV-98), matching the
	// handoff's transition overlay. Restart the one-shot CSS animation by
	// toggling `data-voice-transition` (remove → reflow → re-add) so the
	// card's children (the Stream iframe, the Radix title) never remount.
	// Skips the first render (modal open) and reduced motion, where the
	// swap stays instant; only `navMode="button"` (the modal) animates.
	useIsomorphicLayoutEffect(() => {
		const previous = prevPositionRef.current;
		prevPositionRef.current = position;
		if (navMode !== "button" || previous === position) return;
		const el = cardRef.current;
		if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const forward = position > previous;
		el.style.setProperty("--slide-from", `${slideOffset(forward, { rtl: dir === "rtl" })}px`);
		el.removeAttribute("data-voice-transition");
		void el.offsetWidth; // reflow — restart the one-shot animation
		el.setAttribute("data-voice-transition", "");

		function clear(event: AnimationEvent) {
			if (event.animationName === "player-voice-in" && event.target === el) {
				el?.removeAttribute("data-voice-transition");
			}
		}
		el.addEventListener("animationend", clear);
		return () => el.removeEventListener("animationend", clear);
	}, [position, navMode, dir]);

	const location = `${voice.city}, ${countryName(voice.countryCode)} · ${interpolate(
		strings.languageOriginal,
		{ language: languageName(voice.language) },
	)}`;
	const indicator = indicatorLabel ?? interpolate(strings.indicator, { position, total });

	return (
		<article
			ref={cardRef}
			data-player-card
			className="relative grid touch-pan-y lg:grid-cols-[1.5fr_1fr]"
		>
			{/*
				Video panel (left on desktop, full-bleed on top on mobile). The
				player itself is supplied as `children` — DEV-46's `StreamPlayer`,
				hydrated as a React child in the modal and as a nested Astro island
				on the standalone page. The mobile full-screen chrome (close, swipe
				hint, position label — DEV-45) overlays the pane; the play button
				now belongs to the player, not this chrome.
			*/}
			<div className="bg-paper-2 flex flex-col justify-center max-lg:p-0 lg:p-6">
				<div className="relative flex flex-col lg:gap-4">
					{children}

					{/* Mobile chrome — the full-screen experience (DEV-45). */}
					{showMobileChrome && (
						<div className="lg:hidden">
							<div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-3">
								<span className="font-display text-paper/70 tracking-kicker text-[10px] uppercase">
									{indicator}
								</span>
								<button
									type="button"
									data-player-close
									aria-label={strings.close}
									className="bg-ink/55 text-paper rounded-pill flex size-9 items-center justify-center text-[18px] leading-none"
								>
									<span aria-hidden="true">×</span>
								</button>
							</div>

							<div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center">
								<p className="font-display text-paper/85 text-[12px] tracking-[0.08em] uppercase">
									<span aria-hidden="true" className="inline-block rtl:-scale-x-100">
										←
									</span>{" "}
									{strings.swipeHint}{" "}
									<span aria-hidden="true" className="inline-block rtl:-scale-x-100">
										→
									</span>
								</p>
								<p className="font-display text-paper/60 tracking-04 text-[10px] uppercase">
									{strings.swipeHintSub}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Meta panel (right) */}
			<div className="flex flex-col gap-[18px] p-6 lg:p-9">
				<span className={`${tagClasses(theme)} self-start`}>{strings.themes[theme]}</span>

				<TitleTag className="font-display tracking-team-sheet text-[40px] leading-[0.95] font-bold uppercase lg:text-[52px]">
					<span className="text-ink-3 mb-1.5 block text-[22px] tracking-[0.06em] tabular-nums">
						{interpolate(strings.position, { n: padPosition(position) })}
					</span>
					<span dir="auto">{voice.firstName}</span>,<br />
					{interpolate(strings.aged, { age: voice.age })}
				</TitleTag>

				<p
					dir="auto"
					className="font-display text-caption tracking-14 text-ink-3 font-semibold uppercase"
				>
					{location}
				</p>

				<QuoteTag
					dir="auto"
					className="font-display text-ink max-w-[28ch] text-[22px] leading-[1.35] font-medium italic"
				>
					{`“${voice.pullQuote}”`}
				</QuoteTag>

				{/* Caption / transcript / share chips (DEV-47's PlayerChips). */}
				{chips}

				{/*
					Footer controls — prev/next within the active set (DEV-48).
					The modal passes `onPrev`/`onNext` (swap in place); the
					standalone page passes `prevHref`/`nextHref` (navigate) and a
					client island rewrites them + the dots + the label once the
					set is known. The arrows flip under RTL.
				*/}
				<div className="border-rule-soft mt-auto flex flex-col gap-3 border-t pt-5">
					<div className="flex items-center justify-between gap-3">
						<NavControl
							side="prev"
							label={strings.previous}
							variant="ghost"
							mode={navMode}
							href={prevHref}
							onActivate={onPrev}
						/>
						<NavControl
							side="next"
							label={strings.next}
							variant="primary"
							mode={navMode}
							href={nextHref}
							onActivate={onNext}
						/>
					</div>

					<div
						data-player-dots
						aria-hidden="true"
						className="flex items-center justify-center gap-[3px] empty:hidden"
					>
						{dots?.map((dot, i) =>
							dot.kind === "ellipsis" ? (
								<span key={`e${i}`} className="text-ink-3 text-[10px] leading-none">
									…
								</span>
							) : (
								<span
									key={`d${i}`}
									className={`rounded-pill block size-[5px] ${dot.active ? "bg-brand-orange" : "bg-rule"}`}
								/>
							),
						)}
					</div>

					<p data-player-indicator className="text-ink-3 text-caption text-center tabular-nums">
						{indicator}
					</p>
				</div>
			</div>
		</article>
	);
}

/**
 * One prev/next control, with `data-player-{prev,next}` hooks the
 * standalone page's island rewrites once the active set is known.
 *
 * `mode="button"` (modal) → a swap button, disabled when `onActivate` is
 * absent. `mode="link"` (page) → always an anchor, so the island can
 * toggle href / disabled in place without swapping element types;
 * disabled is an `aria-disabled` anchor with no href.
 */
function NavControl({
	side,
	label,
	variant,
	mode,
	href,
	onActivate,
}: {
	side: "prev" | "next";
	label: string;
	variant: "ghost" | "primary";
	mode: "link" | "button";
	href?: string;
	onActivate?: () => void;
}): JSX.Element {
	const arrow = (
		<span aria-hidden="true" className="inline-block rtl:-scale-x-100">
			{side === "prev" ? "←" : "→"}
		</span>
	);
	const content =
		side === "prev" ? (
			<>
				{arrow}
				{label}
			</>
		) : (
			<>
				{label}
				{arrow}
			</>
		);
	const className = buttonClasses(variant, "sm");
	const hooks = {
		"data-player-prev": side === "prev" ? "" : undefined,
		"data-player-next": side === "next" ? "" : undefined,
	};

	if (mode === "button") {
		return (
			<button
				type="button"
				onClick={onActivate}
				disabled={!onActivate}
				className={className}
				{...hooks}
			>
				{content}
			</button>
		);
	}

	const disabled = !href;
	return (
		<a
			href={href}
			aria-disabled={disabled || undefined}
			className={`${className}${disabled ? "pointer-events-none opacity-50" : ""}`}
			{...hooks}
		>
			{content}
		</a>
	);
}
