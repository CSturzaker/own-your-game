import * as RadixDialog from "@radix-ui/react-dialog";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

/**
 * Drawer — a side-sheet variant of the Radix Dialog (DEV-103).
 *
 * Shares the Dialog's accessibility (focus trap, Escape, scrim click,
 * body-scroll lock, focus restore to the trigger) but the panel is pinned
 * to the inline-end edge (right in LTR, left in RTL) instead of centred.
 * The slide-in + scrim fade are driven from `src/styles/global.css` via the
 * `[data-drawer-panel]` / `[data-drawer-overlay]` attribute hooks keyed off
 * Radix's `[data-state]`, so the reduced-motion global guard collapses them
 * and the better-tailwindcss `no-unknown-classes` rule stays quiet (no
 * invented animation class names).
 *
 * Feature code imports this, never `@radix-ui/react-dialog` directly (see
 * this directory's README). Re-uses the same part names as Dialog so the
 * import shape feels identical.
 */

const Root = RadixDialog.Root;
const Trigger = RadixDialog.Trigger;
const Portal = RadixDialog.Portal;
const Close = RadixDialog.Close;
const Title = RadixDialog.Title;
const Description = RadixDialog.Description;

const Overlay = forwardRef<
	ElementRef<typeof RadixDialog.Overlay>,
	ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(({ className, ...props }, ref) => (
	<RadixDialog.Overlay
		ref={ref}
		data-drawer-overlay=""
		className={["fixed inset-0 z-40 bg-black/60", className].filter(Boolean).join(" ")}
		{...props}
	/>
));
Overlay.displayName = "Drawer.Overlay";

const Content = forwardRef<
	ElementRef<typeof RadixDialog.Content>,
	ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, ...props }, ref) => (
	<RadixDialog.Content
		ref={ref}
		data-drawer-panel=""
		className={[
			"fixed inset-y-0 inset-e-0 z-50 flex w-[min(86vw,340px)] flex-col",
			"bg-paper text-ink border-rule border-s shadow-[0_24px_64px_rgba(20,14,0,0.28)]",
			"focus:outline-none",
			className,
		]
			.filter(Boolean)
			.join(" ")}
		{...props}
	/>
));
Content.displayName = "Drawer.Content";

export const Drawer = {
	Root,
	Trigger,
	Portal,
	Overlay,
	Content,
	Title,
	Description,
	Close,
};
