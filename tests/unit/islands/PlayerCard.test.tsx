import { describe, expect, it, vi } from "vitest";
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
	portraitImageId: "sofia-ar-003",
	publishedAt: "2026-05-05T00:00:00Z",
};

describe("PlayerCard", () => {
	it("renders the name, location and pull quote (age is not shown)", () => {
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

		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading).toHaveTextContent("Sofía");
		expect(heading).not.toHaveTextContent("16");
		expect(heading).toHaveTextContent("№ 03");

		// Location: city, English country name, original language.
		expect(screen.getByText(/Rosario, Argentina · Spanish \(orig\.\)/)).toBeInTheDocument();
		expect(screen.getByText(/We learn the world through who we play with\./)).toBeInTheDocument();
		expect(screen.getByText("3 of 38")).toBeInTheDocument();
	});

	it("renders the video player supplied as children, with no built-in stub (DEV-46)", () => {
		const { container } = render(
			<PlayerCard voice={VOICE} position={1} total={1} strings={strings}>
				<div data-testid="video-slot">player</div>
			</PlayerCard>,
		);
		expect(screen.getByTestId("video-slot")).toBeInTheDocument();
		// The old placeholder stub is gone — the host supplies the player.
		expect(container.querySelector('[data-stub="video-player"]')).toBeNull();
		// PlayerCard itself ships no <video>/<iframe>; that's the child's job.
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

	it("renders a boundary control in link mode as a disabled button (crawlable-anchors)", () => {
		render(
			<PlayerCard
				voice={VOICE}
				position={1}
				total={3}
				strings={strings}
				nextHref="/voice/next-id"
			/>,
		);

		// No previous neighbour → a disabled <button>, NOT an hrefless <a>:
		// Lighthouse's crawlable-anchors SEO audit flags anchors with no href
		// (DEV-101). PlayerControls swaps it back to an <a> if the active set
		// later provides a neighbour.
		expect(screen.queryByRole("link", { name: /Previous voice/ })).toBeNull();
		const prev = screen.getByRole("button", { name: /Previous voice/ });
		expect(prev).toBeDisabled();
		expect(prev).toHaveAttribute("data-player-prev");
		expect(prev).not.toHaveAttribute("href");

		// Next is still a real crawlable link.
		expect(screen.getByRole("link", { name: /Next voice/ })).toHaveAttribute(
			"href",
			"/voice/next-id",
		);
	});

	it("renders the active-set dot indicator + plain position label", () => {
		render(
			<PlayerCard
				voice={VOICE}
				position={3}
				total={38}
				strings={strings}
				prevHref="/voice/prev-id"
				nextHref="/voice/next-id"
				dots={[{ kind: "dot", active: false }, { kind: "dot", active: true }, { kind: "ellipsis" }]}
			/>,
		);
		expect(screen.getByText("3 of 38")).toBeInTheDocument();
		expect(document.querySelector("[data-player-dots]")?.childElementCount).toBe(3);
	});

	it("renders prev/next as swap buttons in button mode", () => {
		const onPrev = vi.fn();
		const onNext = vi.fn();
		render(
			<PlayerCard
				voice={VOICE}
				position={2}
				total={3}
				strings={strings}
				navMode="button"
				onPrev={onPrev}
				onNext={onNext}
			/>,
		);
		screen.getByRole("button", { name: /Next voice/ }).click();
		expect(onNext).toHaveBeenCalledTimes(1);
		screen.getByRole("button", { name: /Previous voice/ }).click();
		expect(onPrev).toHaveBeenCalledTimes(1);
	});
});
