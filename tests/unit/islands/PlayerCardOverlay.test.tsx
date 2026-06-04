import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { makeT } from "~/i18n/astro";
import { buildPlayerStrings } from "~/i18n/player-strings";
import { PlayerCardOverlay } from "~/islands/PlayerCardOverlay";
import type { Voice } from "~/lib/voice";

const strings = buildPlayerStrings(makeT("en").t);

const VOICES: Voice[] = [
	{
		id: "amara-ng-001",
		firstName: "Amara",
		age: 14,
		countryCode: "NG",
		city: "Lagos",
		theme: "belonging",
		pullQuote: "On the pitch I'm not the new girl — I'm the striker.",
		language: "en",
		videoId: "a1b2c3d4e5f6a7b8",
		portraitImageId: "amara-ng-001",
		publishedAt: "2026-05-01T09:00:00Z",
	},
	{
		id: "yusuf-eg-002",
		firstName: "Yusuf",
		age: 16,
		countryCode: "EG",
		city: "Cairo",
		theme: "friendship",
		pullQuote: "My team is the reason I show up.",
		language: "ar",
		videoId: "b2c3d4e5f6a7b8c9",
		portraitImageId: "yusuf-eg-002",
		publishedAt: "2026-05-03T11:30:00Z",
	},
];

/** Render the overlay alongside a tile anchor the document listener can catch. */
function renderWithTile() {
	return render(
		<>
			<a href="/voice/amara-ng-001?from=squad" data-voice-id="amara-ng-001">
				Amara tile
			</a>
			<PlayerCardOverlay voices={VOICES} strings={strings} locale="en" />
		</>,
	);
}

describe("PlayerCardOverlay", () => {
	let pushState: ReturnType<typeof vi.spyOn>;
	let back: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		pushState = vi.spyOn(window.history, "pushState");
		back = vi.spyOn(window.history, "back").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		// Reset any modal state left in history between tests.
		window.history.replaceState(null, "", "/");
	});

	it("renders nothing until a tile is clicked", () => {
		renderWithTile();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("intercepts a tile click: opens the modal and pushes a canonical history entry", () => {
		renderWithTile();

		fireEvent.click(screen.getByText("Amara tile"));

		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveTextContent("Amara");
		// pushState carries the voiceId and the tile's own (origin-tagged) href.
		expect(pushState).toHaveBeenCalledWith(
			expect.objectContaining({ voiceId: "amara-ng-001" }),
			"",
			"/voice/amara-ng-001?from=squad",
		);
	});

	it("ignores modifier clicks so open-in-new-tab still works", () => {
		renderWithTile();
		fireEvent.click(screen.getByText("Amara tile"), { metaKey: true });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(pushState).not.toHaveBeenCalled();
	});

	it("closes on a popstate without a modal entry (the Back button)", () => {
		renderWithTile();
		fireEvent.click(screen.getByText("Amara tile"));
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		act(() => {
			window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
		});

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("re-opens on a popstate carrying a modal entry (the Forward button)", () => {
		renderWithTile();

		act(() => {
			window.dispatchEvent(
				new PopStateEvent("popstate", { state: { voiceId: "yusuf-eg-002", playerModal: true } }),
			);
		});

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveTextContent("Yusuf");
	});

	it("steps back in history when the modal is dismissed", () => {
		renderWithTile();
		fireEvent.click(screen.getByText("Amara tile"));

		fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

		expect(back).toHaveBeenCalled();
	});
});
