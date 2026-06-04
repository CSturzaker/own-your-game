import { useState } from "react";

import { PlayerCardModal } from "~/islands/PlayerCardModal";
import type { PlayerStrings } from "~/islands/PlayerCard";
import { buildDots } from "~/lib/player-context";
import type { Voice } from "~/lib/voice";

/**
 * Used by `src/pages/demo/player-card.astro` to exercise the desktop
 * player-card modal shell (DEV-44) end-to-end during review and in
 * `tests/e2e/dialog-focus-trap.spec.ts`:
 *   - A real trigger opens the modal (so focus can return to it on close)
 *   - Initial focus lands on the close button
 *   - Tab / Shift+Tab cycle within the Content (focus trap)
 *   - Escape / click-outside close, returning focus to the trigger
 *
 * Not a production component — the live modal opens via `PlayerCardOverlay`
 * (intercepted tile clicks). This harness exists so the shell can be
 * driven deterministically from a fixture voice, independent of the live
 * voice set.
 */
export interface PlayerCardModalDemoProps {
	voice: Voice;
	strings: PlayerStrings;
}

export function PlayerCardModalDemo({ voice, strings }: PlayerCardModalDemoProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="border-ink bg-ink text-paper rounded-pill px-5 py-2.5 text-sm font-semibold"
			>
				Open player card
			</button>
			<PlayerCardModal
				voice={voice}
				position={3}
				total={38}
				strings={strings}
				open={open}
				onClose={() => setOpen(false)}
				onPrev={() => {}}
				onNext={() => {}}
				dots={buildDots(2, 38)}
				indicatorLabel={`3 of 38 ${strings.themes[voice.theme]} voices`}
			/>
		</>
	);
}
