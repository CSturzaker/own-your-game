import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tooltip } from "~/islands/ui/Tooltip";

/**
 * Tooltip wrapper spec. Covers what jsdom can faithfully observe:
 *  - Trigger renders; tooltip is closed by default.
 *  - Keyboard focus opens the tooltip (Radix opens on focus instantly,
 *    independent of delayDuration).
 *  - Escape closes it.
 *
 * Hover timing and touch behaviour need a real browser — those live in
 * the Playwright signed-by spec.
 */

function Harness() {
	return (
		<Tooltip.Provider delayDuration={0}>
			<Tooltip.Root>
				<Tooltip.Trigger>Amina</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content>Amina, 14 · Nairobi, Kenya</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
}

describe("Tooltip wrapper", () => {
	it("renders the trigger with the tooltip closed by default", () => {
		render(<Harness />);
		expect(screen.getByRole("button", { name: "Amina" })).toBeInTheDocument();
		expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	});

	it("opens on keyboard focus and closes on Escape", async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.tab();
		expect(screen.getByRole("button", { name: "Amina" })).toHaveFocus();

		const tip = await screen.findByRole("tooltip");
		expect(tip).toHaveTextContent("Amina, 14 · Nairobi, Kenya");

		await user.keyboard("{Escape}");
		expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
	});
});
