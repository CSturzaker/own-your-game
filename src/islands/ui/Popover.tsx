import * as RadixPopover from "@radix-ui/react-popover";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

/**
 * Popover — thin Tailwind-styled wrapper over @radix-ui/react-popover.
 *
 * Re-exports Root, Trigger, Anchor, Portal, and Close untouched. Only
 * Content carries the project default treatment (paper card, rule
 * border, soft drop shadow) per design/handoff/project/hifi-tokens.css
 * lines 287–296. Caller-supplied `className` extends — Tailwind v4's
 * cascade resolves the override when classes conflict.
 */

const Root = RadixPopover.Root;
const Trigger = RadixPopover.Trigger;
const Anchor = RadixPopover.Anchor;
const Portal = RadixPopover.Portal;
const Close = RadixPopover.Close;

const Content = forwardRef<
	ElementRef<typeof RadixPopover.Content>,
	ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
	<RadixPopover.Content
		ref={ref}
		sideOffset={sideOffset}
		className={[
			"bg-paper text-ink rounded-card border-rule z-50 border shadow-[0_12px_24px_rgba(20,14,0,0.18)]",
			"focus:outline-none",
			className,
		]
			.filter(Boolean)
			.join(" ")}
		{...props}
	/>
));
Content.displayName = "Popover.Content";

export const Popover = {
	Root,
	Trigger,
	Anchor,
	Portal,
	Content,
	Close,
};
