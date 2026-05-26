import { Dialog } from "~/islands/ui/Dialog";

/**
 * Used by src/pages/demo/dialog.astro to exercise the Dialog wrapper
 * end-to-end during DEV-15 review:
 *   - Trigger opens, focus moves into the dialog
 *   - Escape closes
 *   - Click outside the Content closes
 *   - Tab cycles within the Content (focus trap)
 *   - Reduced-motion preference disables any future animations
 *
 * Not a production component — feature dialogs reach for `Dialog`
 * directly and supply their own layout.
 */
export function DialogDemo() {
	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<button
					type="button"
					className="rounded-pill bg-brand-cyan font-display px-6 py-3 text-white"
				>
					Open the dialog
				</button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay />
				<Dialog.Content className="w-[min(560px,90vw)] p-8">
					<Dialog.Title className="font-display text-h2">Dialog wrapper demo</Dialog.Title>
					<Dialog.Description className="text-body text-ink-2 mt-3">
						Tab cycles inside this panel. Escape or the close button below dismiss it. Click the
						dimmed area to dismiss too.
					</Dialog.Description>
					<div className="mt-6 flex justify-end">
						<Dialog.Close asChild>
							<button
								type="button"
								className="rounded-pill border-rule text-small text-ink border px-5 py-2"
							>
								Close
							</button>
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
