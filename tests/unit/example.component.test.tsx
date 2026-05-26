import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Smoke test that proves @testing-library/react + jsdom + the JSX
 * transform are all wired correctly. Render a trivial component and
 * assert on its DOM; replace with real component specs as islands
 * arrive.
 */

function Greeting({ name }: { name: string }) {
	return <p>Hello, {name}!</p>;
}

describe("Greeting (smoke)", () => {
	it("renders the supplied name", () => {
		render(<Greeting name="Own Your Game" />);
		expect(screen.getByText("Hello, Own Your Game!")).toBeInTheDocument();
	});
});
