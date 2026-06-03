import { type JSX } from "react";

import { Tooltip } from "~/islands/ui/Tooltip";
import { type Signer } from "~/lib/signed-by";

export interface SignedByRowProps {
	/** The deterministic, pre-sorted signer sample (see selectSigners). */
	signers: readonly Signer[];
	/** Count hidden behind the "+N more" link; 0 hides the link. */
	remaining: number;
	/** Localised "+N more" label, resolved server-side (host interpolates). */
	moreLabel: string;
	/** Where "+N more" points. */
	squadHref?: string;
}

const PILL =
	"font-display text-ink bg-paper-2 border-rule rounded-pill border px-3 py-1.5 text-[14px] font-medium transition-colors duration-150 hover:border-ink";

const MORE_PILL =
	"font-display text-ink bg-paper border-ink rounded-pill inline-flex items-center gap-1 border px-3 py-1.5 text-[14px] font-medium transition-colors duration-150 hover:bg-ink hover:text-paper";

/**
 * The letter's "Co-signed by" pill row (DEV-54). Each name is a Radix
 * Tooltip trigger revealing the signer's age, city, and country on
 * hover/focus; the trailing "+N more" pill links to the squad.
 *
 * Names only — no surnames, no portraits (safeguarding + MVP scope). The
 * pill's visible text is the first name and so is its accessible name;
 * the tooltip is an `aria-describedby` description, not the label.
 *
 * `delayDuration={300}` keeps the tooltip from firing on an incidental
 * mouse pass; Radix handles focus (keyboard) and touch itself.
 */
export function SignedByRow({
	signers,
	remaining,
	moreLabel,
	squadHref = "/squad",
}: SignedByRowProps): JSX.Element {
	return (
		<Tooltip.Provider delayDuration={300}>
			<div className="flex flex-wrap items-center gap-2">
				{signers.map((s) => (
					<Tooltip.Root key={s.id}>
						<Tooltip.Trigger asChild>
							<button type="button" dir="auto" className={PILL}>
								{s.firstName}
							</button>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content>
								<span
									dir="auto"
									className="font-display text-caption tracking-team-sheet block font-bold uppercase"
								>
									{s.firstName}, {s.age}
								</span>
								<span dir="auto" className="font-body text-paper/80 text-kicker mt-0.5 block">
									{s.city}, {s.country}
								</span>
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				))}

				{remaining > 0 && (
					<a href={squadHref} className={MORE_PILL}>
						{moreLabel}
						<span aria-hidden="true" className="rtl:-scale-x-100">
							→
						</span>
					</a>
				)}
			</div>
		</Tooltip.Provider>
	);
}
