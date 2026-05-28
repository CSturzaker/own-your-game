import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SquadEmptyState } from "~/islands/SquadEmptyState";

describe("SquadEmptyState", () => {
	it("renders the heading, supporting copy, and both CTAs", () => {
		render(<SquadEmptyState onReset={() => {}} />);
		expect(screen.getByText("No voices match this filter combination yet.")).toBeInTheDocument();
		expect(screen.getByText(/We're still adding voices/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Browse all voices" })).toBeInTheDocument();
	});

	it("calls onReset when the reset CTA is clicked", async () => {
		const onReset = vi.fn();
		const user = userEvent.setup();
		render(<SquadEmptyState onReset={onReset} />);

		await user.click(screen.getByRole("button", { name: "Reset filters" }));
		expect(onReset).toHaveBeenCalledOnce();
	});

	it("links 'Browse all voices' to a clean /squad", () => {
		render(<SquadEmptyState onReset={() => {}} />);
		expect(screen.getByRole("link", { name: "Browse all voices" })).toHaveAttribute(
			"href",
			"/squad",
		);
	});
});
