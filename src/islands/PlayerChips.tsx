import { DirectionProvider } from "@radix-ui/react-direction";
import { useState, type JSX } from "react";

import { interpolate } from "~/i18n/interpolate";
import { Dialog } from "~/islands/ui/Dialog";
import { Popover } from "~/islands/ui/Popover";
import { languageName } from "~/lib/languages";
import { availableCaptions, dispatchCaptionChange } from "~/lib/player-captions";
import { chipClasses } from "~/lib/primitives";

/**
 * Player-card meta-panel chip row (DEV-47): captions, transcript, share.
 *
 * A React island that fills `PlayerCard`'s chip slot in both surfaces —
 * a child of the desktop modal island, and a nested `client:idle` island
 * on the standalone page. It wraps its tree in a Radix `DirectionProvider`
 * so the popovers/dialog inherit reading direction without per-popover
 * `align` workarounds (the modal already provides one; nesting is a no-op).
 *
 * - **Captions** — derived from the voice's spoken language (the MVP
 *   convention; see `player-captions.ts`). One language → an on/off toggle;
 *   many → a Radix Popover of languages + "Off". Selecting dispatches the
 *   `oyg:player-caption-change` event the Stream player listens for.
 * - **Transcript** — a nested Radix Dialog showing the transcript prose, or
 *   the "not yet available" message when none exists. Its trigger restores
 *   focus on close (Radix handles it).
 * - **Share** — a Radix Popover: copy link (with a "Copied!" confirmation),
 *   native share where supported (primary on mobile), and a share-as-image
 *   link to the per-voice OG image (a placeholder until DEV-81).
 */

export interface PlayerChipsStrings {
	/** `"Captions: {value}"` — value is a language name or the off word. */
	captionsLabel: string;
	/** The "off" value shown in the label and as a dropdown option. */
	captionsOff: string;
	/** Dropdown heading over the language list. */
	captionsAvailable: string;
	/** Transcript chip label. */
	transcript: string;
	/** Transcript dialog title. */
	transcriptTitle: string;
	/** Shown when the voice has no transcript yet. */
	transcriptUnavailable: string;
	/** Transcript dialog close-button label. */
	transcriptClose: string;
	/** Share chip label. */
	share: string;
	/** Copy-link option label. */
	shareCopy: string;
	/** Brief confirmation after copying. */
	shareCopied: string;
	/** Native-share option label. */
	shareNative: string;
	/** Share-as-image option label. */
	shareImage: string;
}

export interface PlayerChipsProps {
	/** The player this targets — caption-change events carry it. */
	videoId: string;
	/** The voice's spoken language (BCP-47) → available caption tracks. */
	language: string;
	/** Localised `/voice/{id}` path — the share URL is `origin + this`. */
	voicePath: string;
	/** Per-voice OG image path for "share as image" (placeholder until DEV-81). */
	ogImagePath: string;
	/** Title for `navigator.share` (host interpolates the voice's name). */
	shareTitle: string;
	/** Transcript prose, or undefined/empty → the "not available" state. */
	transcript?: string;
	strings: PlayerChipsStrings;
	/** Reading direction for the Radix popovers/dialog. */
	dir?: "ltr" | "rtl";
}

export function PlayerChips({
	videoId,
	language,
	voicePath,
	ogImagePath,
	shareTitle,
	transcript,
	strings,
	dir = "ltr",
}: PlayerChipsProps): JSX.Element {
	return (
		<DirectionProvider dir={dir}>
			<div className="border-rule-soft flex flex-wrap gap-2 border-t pt-4">
				<CaptionsChip videoId={videoId} language={language} strings={strings} />
				<TranscriptChip transcript={transcript} strings={strings} />
				<ShareChip
					voicePath={voicePath}
					ogImagePath={ogImagePath}
					shareTitle={shareTitle}
					strings={strings}
				/>
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
// Transcript
// ---------------------------------------------------------------

function TranscriptChip({
	transcript,
	strings,
}: {
	transcript?: string;
	strings: PlayerChipsStrings;
}): JSX.Element {
	const paragraphs = transcript
		?.split(/\n{2,}/)
		.map((p) => p.trim())
		.filter(Boolean);

	return (
		<Dialog.Root>
			<Dialog.Trigger className={chipClasses("default")}>{strings.transcript}</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay />
				<Dialog.Content className="flex max-h-[80vh] w-[calc(100vw-32px)] max-w-[640px] flex-col p-6">
					<div className="flex items-start justify-between gap-4">
						<Dialog.Title className="font-display text-h3 tracking-display">
							{strings.transcriptTitle}
						</Dialog.Title>
						<Dialog.Close
							aria-label={strings.transcriptClose}
							className="border-rule bg-paper text-ink hover:bg-paper-2 rounded-pill flex size-9 shrink-0 items-center justify-center border text-[18px] leading-none"
						>
							<span aria-hidden="true">×</span>
						</Dialog.Close>
					</div>
					<div className="mt-4 overflow-y-auto">
						{paragraphs && paragraphs.length > 0 ? (
							<div className="text-body text-ink max-w-prose" dir="auto">
								{paragraphs.map((p, i) => (
									<p key={i} className="mb-3 whitespace-pre-line last:mb-0">
										{p}
									</p>
								))}
							</div>
						) : (
							<p className="text-body text-ink-2">{strings.transcriptUnavailable}</p>
						)}
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

// ---------------------------------------------------------------
// Share
// ---------------------------------------------------------------

function ShareChip({
	voicePath,
	ogImagePath,
	shareTitle,
	strings,
}: {
	voicePath: string;
	ogImagePath: string;
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
	const imageLink = (
		// Per-voice OG image — a placeholder path until the generator lands (DEV-81).
		<a href={ogImagePath} className="text-ink text-caption block w-full px-3.5 py-2 text-start">
			{strings.shareImage}
		</a>
	);

	// Native share is primary where available (mobile); copy link otherwise.
	const items = canNativeShare ? [nativeButton, copyButton, imageLink] : [copyButton, imageLink];

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
