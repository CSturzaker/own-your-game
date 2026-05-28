import * as RadixTooltip from "@radix-ui/react-tooltip";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

/**
 * Tooltip — thin Tailwind-styled wrapper over @radix-ui/react-tooltip.
 *
 * Re-exports Provider, Root, and Trigger untouched. Content carries the
 * project default: the prototype's dark chip (ink fill, paper text) with
 * a matching arrow, per design/handoff/project/hifi-letter.jsx. Portal
 * is re-exported so callers can render the content in a portal (avoids
 * clipping inside scrolling/overflow ancestors). Caller `className`
 * extends — Tailwind v4's cascade resolves conflicts on the caller side.
 *
 * Radix Tooltip is a description, not a label: it sets `aria-describedby`
 * on the trigger. Keep the trigger's own visible text meaningful.
 */

const Provider = RadixTooltip.Provider;
const Root = RadixTooltip.Root;
const Trigger = RadixTooltip.Trigger;
const Portal = RadixTooltip.Portal;

const Content = forwardRef<
	ElementRef<typeof RadixTooltip.Content>,
	ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(({ className, sideOffset = 8, children, ...props }, ref) => (
	<RadixTooltip.Content
		ref={ref}
		sideOffset={sideOffset}
		className={[
			"bg-ink text-paper rounded-card z-50 px-3.5 py-2.5 shadow-[0_8px_24px_rgba(20,14,0,0.24)]",
			"select-none",
			className,
		]
			.filter(Boolean)
			.join(" ")}
		{...props}
	>
		{children}
		<RadixTooltip.Arrow className="fill-ink" />
	</RadixTooltip.Content>
));
Content.displayName = "Tooltip.Content";

export const Tooltip = {
	Provider,
	Root,
	Trigger,
	Portal,
	Content,
};
