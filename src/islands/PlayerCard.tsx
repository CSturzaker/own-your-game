import type { ElementType, JSX } from "react";

import { interpolate } from "~/i18n/interpolate";
import { countryName } from "~/lib/countries";
import { languageName } from "~/lib/languages";
import { buttonClasses, tagClasses } from "~/lib/primitives";
import { padPosition } from "~/lib/tile";
import type { Voice } from "~/lib/voice";
import type { TagTheme } from "~/lib/primitives";

/**
 * Shared player-card content — the two-column card body: a video panel
 * (left) and a meta panel (right) carrying the theme tag, position №,
 * name/age, location, pull quote, the caption-controls stub, and the
 * prev/next footer controls. Single column below `lg`.
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
 * Stubs: the video pane (`data-stub="video-player"`) is a sized
 * placeholder until DEV-46 drops in the Cloudflare Stream iframe; the
 * caption / transcript / share chip row (`data-stub="caption-controls"`)
 * is DEV-47. Prev/next are functional links to the neighbouring voices
 * (full newest-first list); DEV-48 adds active-set awareness, the dot
 * indicator, keyboard shortcuts, and the in-modal swap.
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
	/** `"{position} of {total}"`. */
	readonly indicator: string;
	/** Placeholder label inside the stubbed video pane. */
	readonly videoComingSoon: string;
	/** Accessible label for the modal close control. */
	readonly close: string;
}

export interface PlayerCardProps {
	voice: Voice;
	/** 1-indexed position within the active set (full list in DEV-43). */
	position: number;
	/** Size of the active set, for the `{position} of {total}` indicator. */
	total: number;
	strings: PlayerStrings;
	/** Previous-voice href; undefined disables the control (start of list). */
	prevHref?: string;
	/** Next-voice href; undefined disables the control (end of list). */
	nextHref?: string;
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
}

export function PlayerCard({
	voice,
	position,
	total,
	strings,
	prevHref,
	nextHref,
	TitleTag = "h1",
	QuoteTag = "blockquote",
}: PlayerCardProps): JSX.Element {
	const theme = voice.theme;
	const location = `${voice.city}, ${countryName(voice.countryCode)} · ${interpolate(
		strings.languageOriginal,
		{ language: languageName(voice.language) },
	)}`;
	const indicator = interpolate(strings.indicator, { position, total });

	return (
		<article className="grid lg:grid-cols-[1.5fr_1fr]">
			{/*
				Video panel (left) — a sized placeholder until DEV-46 swaps in
				the Cloudflare Stream iframe. No poster, no play button, no
				video element (that's all DEV-46): a 16:9 box that holds the
				layout.
			*/}
			<div className="bg-paper-2 flex flex-col justify-center gap-4 p-5 lg:p-6">
				<div
					data-stub="video-player"
					className="bg-ink rounded-card flex aspect-video w-full items-center justify-center"
				>
					<span className="font-display text-caption tracking-kicker text-paper/55 uppercase">
						{strings.videoComingSoon}
					</span>
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

				{/* Caption / transcript / share chips — DEV-47 fills this. */}
				<div data-stub="caption-controls" />

				{/*
					Footer controls — prev/next links to the neighbouring voices.
					DEV-48 makes them respect the active filter set, adds the dot
					indicator + keyboard shortcuts, and swaps in place inside the
					modal.
				*/}
				<div className="border-rule-soft mt-auto flex flex-col gap-3 border-t pt-5">
					<div className="flex items-center justify-between gap-3">
						{prevHref ? (
							<a href={prevHref} className={buttonClasses("ghost", "sm")}>
								<span aria-hidden="true" className="inline-block rtl:-scale-x-100">
									←
								</span>
								{strings.previous}
							</a>
						) : (
							<button type="button" disabled className={buttonClasses("ghost", "sm")}>
								<span aria-hidden="true" className="inline-block rtl:-scale-x-100">
									←
								</span>
								{strings.previous}
							</button>
						)}

						{nextHref ? (
							<a href={nextHref} className={buttonClasses("primary", "sm")}>
								{strings.next}
								<span aria-hidden="true" className="inline-block rtl:-scale-x-100">
									→
								</span>
							</a>
						) : (
							<button type="button" disabled className={buttonClasses("primary", "sm")}>
								{strings.next}
								<span aria-hidden="true" className="inline-block rtl:-scale-x-100">
									→
								</span>
							</button>
						)}
					</div>
					<p className="text-ink-3 text-caption text-center tabular-nums">{indicator}</p>
				</div>
			</div>
		</article>
	);
}
