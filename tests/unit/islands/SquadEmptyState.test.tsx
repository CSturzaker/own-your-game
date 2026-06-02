import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makeT } from "~/i18n/astro";
import { buildSquadGridStrings } from "~/i18n/squad-strings";
import { SquadEmptyState } from "~/islands/SquadEmptyState";

// English strings, resolved the same way the Astro host does.
const STRINGS = buildSquadGridStrings(makeT("en").t, "en").empty;

describe("SquadEmptyState", () => {
	it("renders the heading, supporting copy, and both CTAs", () => {
		render(<SquadEmptyState strings={STRINGS} onReset={() => {}} />);
		expect(screen.getByText("No voices match this filter combination yet.")).toBeInTheDocument();
		expect(screen.getByText(/We're still adding voices/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Browse all voices" })).toBeInTheDocument();
	});

	it("calls onReset when the reset CTA is clicked", async () => {
		const onReset = vi.fn();
		const user = userEvent.setup();
		render(<SquadEmptyState strings={STRINGS} onReset={onReset} />);

		await user.click(screen.getByRole("button", { name: "Reset filters" }));
		expect(onReset).toHaveBeenCalledOnce();
	});

	it("links 'Browse all voices' to a clean /squad", () => {
		render(<SquadEmptyState strings={STRINGS} onReset={() => {}} />);
		expect(screen.getByRole("link", { name: "Browse all voices" })).toHaveAttribute(
			"href",
			"/squad",
		);
	});
});
