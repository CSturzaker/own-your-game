import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { makeT } from "~/i18n/astro";
import { buildPlayerStrings } from "~/i18n/player-strings";
import { PlayerCardOverlay } from "~/islands/PlayerCardOverlay";

// The overlay fetches the lightweight index + per-voice data at runtime
// (DEV-107) instead of receiving the voice set as props. Mock the client
// loaders so the in-memory behaviour (interception, history, focus) is
// unit-testable without a network or the built JSON artifacts.
const fixtures = vi.hoisted(() => {
	const VOICES = [
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
	return { VOICES };
});

vi.mock("~/lib/voice-index-client", () => ({
	loadVoiceIndex: () => Promise.resolve(fixtures.VOICES),
	loadVoiceData: (id: string) =>
		Promise.resolve({ voice: fixtures.VOICES.find((v) => v.id === id) }),
}));

const strings = buildPlayerStrings(makeT("en").t);

/**
 * Render the overlay alongside a tile anchor the document listener can
 * catch, then flush the mount-time index fetch so interception is live.
 */
async function renderWithTile() {
	const utils = render(
		<>
			<a href="/voice/amara-ng-001?from=squad" data-voice-id="amara-ng-001">
				Amara tile
			</a>
			<PlayerCardOverlay strings={strings} locale="en" />
		</>,
	);
	// The index resolves a microtask after mount; flush so the click
	// handler sees a populated index (its membership check gates interception).
	await act(async () => {
		await Promise.resolve();
	});
	return utils;
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

	it("renders nothing until a tile is clicked", async () => {
		await renderWithTile();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("intercepts a tile click: opens the modal and pushes a canonical history entry", async () => {
		await renderWithTile();

		fireEvent.click(screen.getByText("Amara tile"));

		// The modal shell is lazy-loaded (DEV-76) and the heavy voice data is
		// fetched on demand — findByRole awaits both.
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveTextContent("Amara");
		// pushState carries the voiceId and the tile's own (origin-tagged) href.
		expect(pushState).toHaveBeenCalledWith(
			expect.objectContaining({ voiceId: "amara-ng-001" }),
			"",
			"/voice/amara-ng-001?from=squad",
		);
	});

	it("ignores modifier clicks so open-in-new-tab still works", async () => {
		await renderWithTile();
		fireEvent.click(screen.getByText("Amara tile"), { metaKey: true });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(pushState).not.toHaveBeenCalled();
	});

	it("closes on a popstate without a modal entry (the Back button)", async () => {
		await renderWithTile();
		fireEvent.click(screen.getByText("Amara tile"));
		expect(await screen.findByRole("dialog")).toBeInTheDocument();

		act(() => {
			window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
		});

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("re-opens on a popstate carrying a modal entry (the Forward button)", async () => {
		await renderWithTile();

		act(() => {
			window.dispatchEvent(
				new PopStateEvent("popstate", { state: { voiceId: "yusuf-eg-002", playerModal: true } }),
			);
		});

		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveTextContent("Yusuf");
	});

	it("steps back in history when the modal is dismissed", async () => {
		await renderWithTile();
		fireEvent.click(screen.getByText("Amara tile"));

		fireEvent.keyDown(await screen.findByRole("dialog"), { key: "Escape" });

		expect(back).toHaveBeenCalled();
	});

	it("intercepts tiles rendered after mount (the squad grid hydrates late)", async () => {
		// No tile present at mount → the overlay watches for one rather than
		// fetching the index immediately (DEV-107). A sibling island (the squad
		// grid) then renders tiles client-side.
		render(<PlayerCardOverlay strings={strings} locale="en" />);

		const tile = document.createElement("a");
		tile.href = "/voice/yusuf-eg-002";
		tile.setAttribute("data-voice-id", "yusuf-eg-002");
		tile.textContent = "Yusuf tile";
		await act(async () => {
			document.body.appendChild(tile);
			// Let the MutationObserver fire and the index fetch resolve.
			await Promise.resolve();
			await Promise.resolve();
		});

		fireEvent.click(tile);
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveTextContent("Yusuf");

		tile.remove();
	});
});
