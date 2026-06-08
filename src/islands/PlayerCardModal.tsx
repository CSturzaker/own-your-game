import { DirectionProvider } from "@radix-ui/react-direction";
import { useRef, type JSX } from "react";

import { interpolate } from "~/i18n/interpolate";
import { PlayerCard, type PlayerStrings } from "~/islands/PlayerCard";
import { PlayerChips } from "~/islands/PlayerChips";
import { StreamPlayer } from "~/islands/StreamPlayer";
import { Dialog } from "~/islands/ui/Dialog";
import type { DotItem } from "~/lib/player-context";
import { portraitUrl } from "~/lib/portrait-url";
import type { Voice } from "~/lib/voice";

/**
 * Desktop player-card modal shell (DEV-44).
 *
 * A controlled Radix Dialog (composing the DEV-15 `~/islands/ui/Dialog`
 * wrapper — not rewrapping it) that frames the shared `PlayerCard` body in
 * the prototype's centred, 1240px-max two-column card over the ink scrim
 * (`design/handoff/project/hifi-player.jsx` lines 114–378). The
 * intercepted-route overlay (`PlayerCardOverlay`) and the demo harness
 * both render this; the standalone page renders `PlayerCard` inline
 * without this chrome (the issue's "inline vs modal" split).
 *
 * - **DirectionProvider**: Radix Dialog has no direction context, so the
 *   tree is wrapped in `@radix-ui/react-direction`'s provider. It's a
 *   no-op for the centred dialog itself today, but means the caption
 *   language dropdown and share popover DEV-47 adds inside the card honour
 *   reading direction without per-popover `align` workarounds (see
 *   `docs/ops/i18n.md`).
 * - **Initial focus**: the close button is the first focusable child, so
 *   Radix's default autofocus lands there — screen-reader users hear
 *   "Close" first, which orients them to the escape.
 * - **Focus trap / Escape / click-outside**: Radix defaults, exercised in
 *   `tests/e2e/dialog-focus-trap.spec.ts`.
 *
 * Builds the video player (DEV-46's `StreamPlayer`, the card's `children`)
 * and the caption / transcript / share chip row (DEV-47's `PlayerChips`,
 * the card's `chips` slot) from the active voice and drops them into
 * `PlayerCard`.
 */
export interface PlayerCardModalProps {
	voice: Voice;
	/** 1-indexed position within the active set (full list until DEV-48). */
	position: number;
	/** Size of the active set, for the `{position} of {total}` indicator. */
	total: number;
	strings: PlayerStrings;
	/** Whether the modal is open (controlled). */
	open: boolean;
	/** Called when the user dismisses (Escape / click-outside / close button). */
	onClose: () => void;
	/** Previous-voice handler — swaps in place. Undefined disables (start of set). */
	onPrev?: () => void;
	/** Next-voice handler — swaps in place. Undefined disables (end of set). */
	onNext?: () => void;
	/** Active-set dot indicator model (DEV-48). */
	dots?: readonly DotItem[];
	/** Localised `/voice/{id}` path — the share chip builds `origin + this`. */
	voicePath: string;
	/** Transcript prose for the active voice, or undefined → "not available". */
	transcript?: string;
	/** Reading direction for the Radix DirectionProvider. */
	dir?: "ltr" | "rtl";
}

export function PlayerCardModal({
	voice,
	position,
	total,
	strings,
	open,
	onClose,
	onPrev,
	onNext,
	dots,
	voicePath,
	transcript,
	dir = "ltr",
}: PlayerCardModalProps): JSX.Element {
	// The element focused when the modal opens — focus returns here on
	// close. Radix only auto-restores to a `Dialog.Trigger` (which this
	// controlled modal has no slot for), so without this, closing drops
	// focus to <body>. Captured in `onOpenAutoFocus`, which fires before
	// Radix moves focus into the dialog, so `document.activeElement` is
	// still the opener.
	const openerRef = useRef<HTMLElement | null>(null);

	return (
		<DirectionProvider dir={dir}>
			<Dialog.Root
				open={open}
				onOpenChange={(next) => {
					if (!next) onClose();
				}}
			>
				<Dialog.Portal>
					<Dialog.Overlay />
					<Dialog.Content
						onOpenAutoFocus={() => {
							if (document.activeElement instanceof HTMLElement) {
								openerRef.current = document.activeElement;
							}
						}}
						onCloseAutoFocus={(event) => {
							const opener = openerRef.current;
							if (opener?.isConnected) {
								event.preventDefault();
								opener.focus();
							}
						}}
						className="max-h-[calc(100vh-64px)] w-[calc(100vw-32px)] max-w-[1240px] overflow-x-clip overflow-y-auto p-0 lg:w-[calc(100vw-80px)]"
					>
						<Dialog.Close
							aria-label={strings.close}
							className="border-rule bg-paper text-ink hover:bg-paper-2 rounded-pill absolute inset-e-3.5 top-3.5 z-10 flex size-10 items-center justify-center border text-[18px] leading-none"
						>
							<span aria-hidden="true">×</span>
						</Dialog.Close>
						<PlayerCard
							voice={voice}
							position={position}
							total={total}
							strings={strings}
							onPrev={onPrev}
							onNext={onNext}
							dots={dots}
							navMode="button"
							dir={dir}
							TitleTag={Dialog.Title}
							QuoteTag={Dialog.Description}
							chips={
								<PlayerChips
									videoId={voice.videoId}
									language={voice.language}
									voicePath={voicePath}
									ogImagePath={`/og/voice/${voice.id}.png`}
									shareTitle={interpolate(strings.shareTitle, { name: voice.firstName })}
									transcript={transcript}
									strings={strings.chips}
									dir={dir}
								/>
							}
						>
							<StreamPlayer
								videoId={voice.videoId}
								title={interpolate(strings.videoTitle, { name: voice.firstName })}
								posterImage={
									voice.portraitImageId ? portraitUrl(voice.portraitImageId, "card") : undefined
								}
								strings={strings.video}
								className="aspect-video"
							/>
						</PlayerCard>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</DirectionProvider>
	);
}
