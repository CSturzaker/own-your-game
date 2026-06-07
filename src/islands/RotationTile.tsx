import type { JSX } from "react";

import { PortraitImage } from "~/islands/PortraitImage";
import { countryName } from "~/lib/countries";
import { flagGradient } from "~/lib/flags";
import { pickPortraitVariant, SILHOUETTES, TONES } from "~/lib/portrait";
import { portraitSrcset, portraitUrl } from "~/lib/portrait-url";
import { padPosition, tileAccessibleName, tileHref } from "~/lib/tile";
import type { VoiceIndexEntry } from "~/lib/voice-index";

/**
 * React port of `src/components/Tile.astro` — the shared tile rendered
 * inside React islands (the home rotating starting eleven and the
 * squad grid).
 *
 * Why the duplication: the Astro Tile can't be invoked from inside a
 * React island, but those islands re-render tiles whose voice (or
 * filtered subset) has changed. Both components emit the same HTML and
 * share every helper out of `src/lib/{tile,portrait,countries,flags}`,
 * so the only real duplication is the JSX/class soup. The two stay
 * in lockstep by reusing those helpers — touch the helpers, both
 * worlds update.
 *
 * Skeleton variant is intentionally not ported: the rotation always
 * has voices, the squad grid renders its own skeleton placeholders,
 * and the Astro Tile remains the source of truth for the loading
 * state used elsewhere.
 */
export interface RotationTileProps {
	voice: VoiceIndexEntry;
	/** 1-indexed position number (01–11 on home, 001+ on the squad). */
	position: number;
	/** New-flash highlight that fades to transparent over 1.5s. */
	flash?: boolean;
	/**
	 * Link target. Defaults to the canonical `/voice/:id`; the squad
	 * grid overrides it to carry the `from=squad` origin and the active
	 * filter set (see `squadTileHref`).
	 */
	href?: string;
	/**
	 * The `tile.accessibleName` template (`"{name}, {country} ({code}),
	 * position {position}"`), resolved per-locale by the island's Astro
	 * host and threaded down so the dictionaries don't ship to the client.
	 */
	accessibleNameTemplate: string;
}

export function RotationTile({
	voice,
	position,
	flash = false,
	href = tileHref(voice),
	accessibleNameTemplate,
}: RotationTileProps): JSX.Element {
	const variant = pickPortraitVariant(voice.id);
	const tone = TONES[variant.toneIndex]!;
	const silhouette = SILHOUETTES[variant.silhouetteIndex]!;
	const alt = `${voice.firstName}, ${countryName(voice.countryCode)}`;

	// Mirror the Astro Tile's inline custom-property strategy so the
	// CSS variable names land on the same element.
	const portraitStyle = {
		background: `linear-gradient(180deg, ${tone.a} 0%, ${tone.b} 100%)`,
		"--sil-c": tone.s,
		"--sil-w": `${variant.silWidth}%`,
		"--sil-x": `${variant.offsetX * 4}%`,
		"--sil-y": `${-variant.offsetY}%`,
	} as React.CSSProperties;

	return (
		<a
			href={href}
			aria-label={tileAccessibleName(accessibleNameTemplate, voice, position)}
			data-tile
			data-voice-id={voice.id}
			data-position={position}
			data-flash={flash ? "" : undefined}
			className="group rounded-field hover:shadow-tile-hover focus-visible:outline-fn-cyan relative block aspect-4/5 w-full overflow-hidden transition-[transform,box-shadow] duration-240 ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-[3px]"
		>
			<div className="rounded-field absolute inset-0 w-full overflow-hidden" style={portraitStyle}>
				<div className="absolute inset-0 flex items-end justify-center">
					<svg
						viewBox="0 0 100 120"
						preserveAspectRatio="xMidYMax meet"
						className="opacity-90"
						style={{
							width: "var(--sil-w)",
							height: "92%",
							marginBottom: "var(--sil-y)",
							marginLeft: "var(--sil-x)",
							fill: "var(--sil-c)",
						}}
						role="presentation"
						dangerouslySetInnerHTML={{ __html: silhouette }}
					/>
				</div>
				{voice.portraitImageId ? (
					// Real portrait (DEV-74) overlays the silhouette; on load
					// error PortraitImage unmounts and the silhouette shows through.
					<PortraitImage
						src={portraitUrl(voice.portraitImageId, "tile")}
						srcset={portraitSrcset(voice.portraitImageId, "tile")}
						alt={alt}
					/>
				) : (
					<span className="sr-only">{alt}</span>
				)}
			</div>

			<div
				className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-40% to-black/65"
				aria-hidden="true"
			/>

			<span
				className="font-display text-paper text-caption absolute inset-e-3 top-2.5 font-bold tabular-nums [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]"
				aria-hidden="true"
			>
				{padPosition(position)}
			</span>

			<span
				className="bg-paper/95 rounded-pill absolute top-1/2 left-1/2 flex size-11 -translate-1/2 scale-75 items-center justify-center opacity-0 transition-[opacity,transform] duration-200 group-hover:scale-100 group-hover:opacity-100"
				aria-hidden="true"
			>
				<svg
					viewBox="0 0 24 24"
					fill="currentColor"
					className="text-ink ml-0.5 size-4"
					aria-hidden="true"
				>
					<path d="M8 5v14l11-7z" />
				</svg>
			</span>

			<div className="text-paper absolute inset-x-3 bottom-2.5 flex flex-col gap-0.5">
				<span
					dir="auto"
					className="font-display tracking-team-sheet text-small truncate leading-none font-bold uppercase transition-[font-weight] duration-200 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] group-hover:font-extrabold"
				>
					{voice.firstName}
				</span>
				<span className="font-body tracking-14 flex items-center gap-1.5 text-[10px] [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
					<span
						className="block h-2.5 w-3.5 rounded-[1px]"
						style={{ background: flagGradient(voice.countryCode) }}
						aria-hidden="true"
					/>
					{voice.countryCode}
				</span>
			</div>
		</a>
	);
}
