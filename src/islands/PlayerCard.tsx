import type { ElementType, JSX } from "react";

import { interpolate } from "~/i18n/interpolate";
import { countryName } from "~/lib/countries";
import { languageName } from "~/lib/languages";
import { buttonClasses, tagClasses, type TagTheme } from "~/lib/primitives";
import { padPosition } from "~/lib/tile";
import type { Voice } from "~/lib/voice";

/**
 * Shared player-card content — the theme tag, name/age, location, pull
 * quote, the (stubbed) video pane, and the prev/next controls.
 *
 * Rendered in two contexts from one component (the Tile.astro /
 * RotationTile precedent): server-rendered on the standalone
 * `/voice/{id}` page (`Player.astro`, no client directive → static HTML,
 * no JS) and client-rendered inside the modal overlay
 * (`PlayerCardOverlay`). The dictionaries never ship to the client, so
 * every string arrives via the `strings` prop, resolved by the Astro
 * host.
 *
 * Scope (DEV-43): the video pane is a sized stub — DEV-46 swaps in the
 * Cloudflare Stream iframe. Captions / transcript / share chips are
 * DEV-47. Prev/next are plain links here (full-list neighbours);
 * active-set traversal and the in-modal swap are DEV-48.
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
		<article className="flex flex-col gap-6">
			{/*
				Video pane — a sized placeholder until DEV-46 swaps in the
				Cloudflare Stream iframe. No poster, no play button, no video
				element (that's all DEV-46): a 16:9 box that holds the layout.
			*/}
			<div
				data-stub="video-player"
				className="bg-ink rounded-card flex aspect-video w-full items-center justify-center"
			>
				<span className="font-display text-caption tracking-kicker text-paper/55 uppercase">
					{strings.videoComingSoon}
				</span>
			</div>

			<div className="flex flex-col gap-4">
				<span className={`${tagClasses(theme)} self-start`}>{strings.themes[theme]}</span>

				<TitleTag className="font-display tracking-team-sheet text-[40px] leading-none font-bold uppercase">
					<span className="text-ink-3 mb-1.5 block text-[22px] tracking-[0.06em] tabular-nums">
						{interpolate(strings.position, { n: padPosition(position) })}
					</span>
					<span dir="auto">{voice.firstName}</span>
					<span className="text-ink-2 mt-1.5 block text-[22px]">
						{interpolate(strings.aged, { age: voice.age })}
					</span>
				</TitleTag>

				<p
					dir="auto"
					className="font-display text-caption tracking-14 text-ink-3 font-semibold uppercase"
				>
					{location}
				</p>

				<QuoteTag
					dir="auto"
					className="font-display text-ink max-w-[32ch] text-[22px] leading-[1.35] font-medium italic"
				>
					{`“${voice.pullQuote}”`}
				</QuoteTag>

				{/*
					Prev/next — plain links to the neighbouring voice pages
					(DEV-43 walks the full newest-first list). DEV-48 makes them
					respect the active filter set and swap in-place inside the
					modal, adds the dot indicator, keyboard shortcuts, and the
					RTL direction flip.
				*/}
				<div className="border-rule-soft mt-2 flex items-center justify-between gap-3 border-t pt-5">
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
		</article>
	);
}
