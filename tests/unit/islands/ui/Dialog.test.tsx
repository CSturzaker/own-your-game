import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Dialog } from "~/islands/ui/Dialog";

/**
 * Dialog wrapper spec (deferred from DEV-15).
 *
 * Covers what jsdom can faithfully observe:
 *  - Trigger renders.
 *  - Clicking the trigger opens the dialog (Title + Description
 *    become reachable; the body's data-state flips to open).
 *  - Escape closes.
 *  - The dedicated Close trigger closes.
 *
 * jsdom doesn't implement the focus management primitives Radix
 * relies on for an honest focus-trap test (no real tab-order, no
 * actual focus ring). That assertion belongs in a Playwright spec
 * in DEV-17 where focus is real.
 */

function Harness() {
	return (
		<Dialog.Root>
			<Dialog.Trigger>Open</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay />
				<Dialog.Content>
					<Dialog.Title>Test dialog</Dialog.Title>
					<Dialog.Description>The wrapper default treatment is exercised here.</Dialog.Description>
					<Dialog.Close>Close</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

describe("Dialog wrapper", () => {
	it("renders the trigger and keeps the dialog closed by default", () => {
		render(<Harness />);
		expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("opens the dialog when the trigger is clicked", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("button", { name: "Open" }));

		const dialog = await screen.findByRole("dialog");
		expect(dialog).toBeInTheDocument();
		expect(screen.getByText("Test dialog")).toBeInTheDocument();
		expect(
			screen.getByText("The wrapper default treatment is exercised here."),
		).toBeInTheDocument();
	});

	it("closes the dialog when Escape is pressed", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("button", { name: "Open" }));
		await screen.findByRole("dialog");

		await user.keyboard("{Escape}");

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("closes the dialog when the Close trigger is clicked", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(screen.getByRole("button", { name: "Open" }));
		await screen.findByRole("dialog");

		await user.click(screen.getByRole("button", { name: "Close" }));

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
