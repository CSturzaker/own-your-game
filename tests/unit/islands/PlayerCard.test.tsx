import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { makeT } from "~/i18n/astro";
import { buildPlayerStrings } from "~/i18n/player-strings";
import { PlayerCard } from "~/islands/PlayerCard";
import type { Voice } from "~/lib/voice";

const strings = buildPlayerStrings(makeT("en").t);

const VOICE: Voice = {
	id: "sofia-ar-003",
	firstName: "Sofía",
	age: 16,
	countryCode: "AR",
	city: "Rosario",
	theme: "friendship",
	pullQuote: "We learn the world through who we play with.",
	language: "es",
	videoId: "c3d4e5f6a7b8c9d0",
	portraitFile: "sofia-ar-003.webp",
	publishedAt: "2026-05-05T00:00:00Z",
};

describe("PlayerCard", () => {
	it("renders the theme tag, name, age, location and pull quote", () => {
		render(
			<PlayerCard
				voice={VOICE}
				position={3}
				total={38}
				strings={strings}
				prevHref="/voice/prev-id"
				nextHref="/voice/next-id"
			/>,
		);

		expect(screen.getByText("Friendship")).toBeInTheDocument();

		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toHaveTextContent("Sofía");
		expect(heading).toHaveTextContent("aged 16");
		expect(heading).toHaveTextContent("№ 03");

		// Location: city, English country name, original language.
		expect(screen.getByText(/Rosario, Argentina · Spanish \(orig\.\)/)).toBeInTheDocument();
		expect(screen.getByText(/We learn the world through who we play with\./)).toBeInTheDocument();
		expect(screen.getByText("3 of 38")).toBeInTheDocument();
	});

	it("renders a sized video stub (no player UI — DEV-46 fills it)", () => {
		const { container } = render(
			<PlayerCard voice={VOICE} position={1} total={1} strings={strings} />,
		);
		const stub = container.querySelector('[data-stub="video-player"]');
		expect(stub).not.toBeNull();
		// No <video>/<iframe> shipped yet.
		expect(container.querySelector("video, iframe")).toBeNull();
	});

	it("renders prev/next as links when neighbours exist", () => {
		render(
			<PlayerCard
				voice={VOICE}
				position={2}
				total={3}
				strings={strings}
				prevHref="/voice/prev-id"
				nextHref="/voice/next-id"
			/>,
		);
		expect(screen.getByRole("link", { name: /Previous voice/ })).toHaveAttribute(
			"href",
			"/voice/prev-id",
		);
		expect(screen.getByRole("link", { name: /Next voice/ })).toHaveAttribute(
			"href",
			"/voice/next-id",
		);
	});

	it("disables prev/next at the ends of the list (no href)", () => {
		render(
			<PlayerCard
				voice={VOICE}
				position={1}
				total={3}
				strings={strings}
				nextHref="/voice/next-id"
			/>,
		);

		// No previous neighbour → a disabled button, not a link.
		expect(screen.queryByRole("link", { name: /Previous voice/ })).toBeNull();
		const prev = screen.getByRole("button", { name: /Previous voice/ });
		expect(prev).toBeDisabled();

		// Next still a link.
		expect(screen.getByRole("link", { name: /Next voice/ })).toBeInTheDocument();
	});
});
