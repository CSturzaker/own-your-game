import * as RadixDialog from "@radix-ui/react-dialog";
import {
	forwardRef,
	type ComponentPropsWithoutRef,
	type ElementRef,
} from "react";

/**
 * Dialog — thin Tailwind-styled wrapper over @radix-ui/react-dialog.
 *
 * Re-exports Root, Trigger, Portal, Close, Title, and Description
 * untouched (no styling decisions). Overlay and Content carry the
 * project default treatment (ink scrim, paper card, 4px radius,
 * large shadow) per design/handoff/project/hifi-player.jsx lines
 * 121–141. Caller-supplied `className` extends — Tailwind v4's
 * cascade resolves the override when classes conflict.
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
		className={["fixed inset-0 z-40 bg-black/60", className].filter(Boolean).join(" ")}
		{...props}
	/>
));
Overlay.displayName = "Dialog.Overlay";

const Content = forwardRef<
	ElementRef<typeof RadixDialog.Content>,
	ComponentPropsWithoutRef<typeof RadixDialog.Content>
>(({ className, ...props }, ref) => (
	<RadixDialog.Content
		ref={ref}
		className={[
			"fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
			"bg-paper text-ink rounded-card shadow-[0_24px_64px_rgba(20,14,0,0.28)]",
			"focus:outline-none",
			className,
		]
			.filter(Boolean)
			.join(" ")}
		{...props}
	/>
));
Content.displayName = "Dialog.Content";

export const Dialog = {
	Root,
	Trigger,
	Portal,
	Overlay,
	Content,
	Title,
	Description,
	Close,
};
