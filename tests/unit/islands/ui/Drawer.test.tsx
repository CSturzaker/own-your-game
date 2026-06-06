import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Drawer } from "~/islands/ui/Drawer";

/**
 * Drawer wrapper spec (DEV-103).
 *
 * Covers what jsdom can faithfully observe: the trigger renders, clicking
 * opens the side sheet, Escape and the dedicated Close trigger dismiss it,
 * and the panel/overlay carry the `data-drawer-*` hooks the global-CSS
 * slide + fade key off. Real focus-trap/slide assertions belong in the
 * Playwright spec (mobile-nav.spec.ts) where focus and animation are real.
 */

function Harness() {
	return (
		<Drawer.Root>
			<Drawer.Trigger>Open</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay />
				<Drawer.Content aria-describedby={undefined}>
					<Drawer.Title>Test drawer</Drawer.Title>
					<Drawer.Close>Close</Drawer.Close>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

describe("Drawer wrapper", () => {
	it("renders the trigger and keeps the drawer closed by default", () => {
		render(<Harness />);
		expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("opens the side sheet when the trigger is clicked", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("button", { name: "Open" }));

		const panel = await screen.findByRole("dialog");
		expect(panel).toBeInTheDocument();
		// The slide + fade hooks the global CSS targets must be present.
		expect(panel).toHaveAttribute("data-drawer-panel");
		expect(document.querySelector("[data-drawer-overlay]")).toBeInTheDocument();
	});

	it("closes on Escape", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("button", { name: "Open" }));
		await screen.findByRole("dialog");
		await user.keyboard("{Escape}");

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("closes via the Close trigger", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("button", { name: "Open" }));
		await screen.findByRole("dialog");
		await user.click(screen.getByRole("button", { name: "Close" }));

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
