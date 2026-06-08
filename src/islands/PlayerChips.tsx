import { DirectionProvider } from "@radix-ui/react-direction";
import { useState, type JSX } from "react";

import { interpolate } from "~/i18n/interpolate";
import { Popover } from "~/islands/ui/Popover";
import { languageName } from "~/lib/languages";
import { availableCaptions, dispatchCaptionChange } from "~/lib/player-captions";
import { chipClasses } from "~/lib/primitives";

/**
 * Player-card meta-panel chip row (DEV-47): captions, share.
 *
 * A React island that fills `PlayerCard`'s chip slot in both surfaces —
 * a child of the desktop modal island, and a nested `client:idle` island
 * on the standalone page. It wraps its tree in a Radix `DirectionProvider`
 * so the popovers inherit reading direction without per-popover `align`
 * workarounds (the modal already provides one; nesting is a no-op).
 *
 * - **Captions** — derived from the voice's spoken language (the MVP
 *   convention; see `player-captions.ts`). One language → an on/off toggle;
 *   many → a Radix Popover of languages + "Off". Selecting dispatches the
 *   `oyg:player-caption-change` event the Stream player listens for.
 * - **Share** — a Radix Popover: copy link (with a "Copied!" confirmation)
 *   and native share where supported (primary on mobile).
 *
 * The transcript chip and the share-as-image link were removed in DEV-114
 * (transcripts aren't produced for the campaign; the per-voice OG image was
 * never generated).
 */

export interface PlayerChipsStrings {
	/** `"Captions: {value}"` — value is a language name or the off word. */
	captionsLabel: string;
	/** The "off" value shown in the label and as a dropdown option. */
	captionsOff: string;
	/** Dropdown heading over the language list. */
	captionsAvailable: string;
	/** Share chip label. */
	share: string;
	/** Copy-link option label. */
	shareCopy: string;
	/** Brief confirmation after copying. */
	shareCopied: string;
	/** Native-share option label. */
	shareNative: string;
}

export interface PlayerChipsProps {
	/** The player this targets — caption-change events carry it. */
	videoId: string;
	/** The voice's spoken language (BCP-47) → available caption tracks. */
	language: string;
	/** Localised `/voice/{id}` path — the share URL is `origin + this`. */
	voicePath: string;
	/** Title for `navigator.share` (host interpolates the voice's name). */
	shareTitle: string;
	strings: PlayerChipsStrings;
	/** Reading direction for the Radix popovers/dialog. */
	dir?: "ltr" | "rtl";
}

export function PlayerChips({
	videoId,
	language,
	voicePath,
	shareTitle,
	strings,
	dir = "ltr",
}: PlayerChipsProps): JSX.Element {
	return (
		<DirectionProvider dir={dir}>
			<div className="border-rule-soft flex flex-wrap gap-2 border-t pt-4">
				<CaptionsChip videoId={videoId} language={language} strings={strings} />
				<ShareChip voicePath={voicePath} shareTitle={shareTitle} strings={strings} />
			</div>
		</DirectionProvider>
	);
}

// ---------------------------------------------------------------
// Captions
// ---------------------------------------------------------------

function CaptionsChip({
	videoId,
	language,
	strings,
}: {
	videoId: string;
	language: string;
	strings: PlayerChipsStrings;
}): JSX.Element | null {
	const langs = availableCaptions({ language });
	const [active, setActive] = useState<string | null>(null);

	if (langs.length === 0) return null;

	const label = interpolate(strings.captionsLabel, {
		value: active ? languageName(active) : strings.captionsOff,
	});

	const select = (lang: string | null) => {
		setActive(lang);
		dispatchCaptionChange(videoId, lang);
	};

	// Single language → a plain on/off toggle (no popover).
	if (langs.length === 1) {
		const only = langs[0]!;
		return (
			<button
				type="button"
				className={chipClasses("default")}
				aria-pressed={active !== null}
				onClick={() => select(active ? null : only)}
			>
				{label}
			</button>
		);
	}

	// Multiple languages → a dropdown of languages + an "Off" option.
	const options: { value: string | null; label: string }[] = [
		...langs.map((l) => ({ value: l, label: languageName(l) })),
		{ value: null, label: strings.captionsOff },
	];

	return (
		<Popover.Root>
			<Popover.Trigger className={chipClasses("default")} aria-label={label}>
				{label}
				<span aria-hidden="true" className="text-ink-3 ms-1 text-[10px]">
					▾
				</span>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content align="start" className="w-60 py-2">
					<p className="font-display text-kicker tracking-kicker text-ink-2 px-3.5 pt-2 pb-1 uppercase">
						{strings.captionsAvailable}
					</p>
					{options.map((option) => {
						const selected = option.value === active;
						return (
							<button
								key={option.label}
								type="button"
								onClick={() => select(option.value)}
								className={`text-caption flex w-full items-center justify-between px-3.5 py-2 text-start ${
									selected ? "text-ink bg-amber-50 font-semibold" : "text-ink-2"
								}`}
							>
								{option.label}
								{selected && <span aria-hidden="true">✓</span>}
							</button>
						);
					})}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}

// ---------------------------------------------------------------
// Share
// ---------------------------------------------------------------

function ShareChip({
	voicePath,
	shareTitle,
	strings,
}: {
	voicePath: string;
	shareTitle: string;
	strings: PlayerChipsStrings;
}): JSX.Element {
	const [copied, setCopied] = useState(false);
	const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

	const shareUrl = () =>
		typeof window === "undefined" ? voicePath : `${window.location.origin}${voicePath}`;

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl());
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			/* clipboard blocked — leave the label unchanged */
		}
	};

	const nativeShare = async () => {
		try {
			await navigator.share({ title: shareTitle, url: shareUrl() });
		} catch {
			/* user dismissed the share sheet — nothing to do */
		}
	};

	const copyButton = (
		<button
			type="button"
			onClick={() => void copyLink()}
			className="text-ink text-caption w-full px-3.5 py-2 text-start"
		>
			{copied ? strings.shareCopied : strings.shareCopy}
		</button>
	);
	const nativeButton = canNativeShare ? (
		<button
			type="button"
			onClick={() => void nativeShare()}
			className="text-ink text-caption w-full px-3.5 py-2 text-start"
		>
			{strings.shareNative}
		</button>
	) : null;

	// Native share is primary where available (mobile); copy link otherwise.
	const items = canNativeShare ? [nativeButton, copyButton] : [copyButton];

	return (
		<Popover.Root>
			<Popover.Trigger className={chipClasses("default")}>{strings.share}</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content align="start" className="w-56 py-2">
					{items.map((item, i) => (
						<div key={i}>{item}</div>
					))}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
