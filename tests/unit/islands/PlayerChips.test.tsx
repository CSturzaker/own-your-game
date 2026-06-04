import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeT } from "~/i18n/astro";
import { buildPlayerStrings } from "~/i18n/player-strings";
import { PlayerChips } from "~/islands/PlayerChips";
import { CAPTION_CHANGE_EVENT, type CaptionChangeDetail } from "~/lib/player-captions";

const strings = buildPlayerStrings(makeT("en").t).chips;

function renderChips(props: Partial<React.ComponentProps<typeof PlayerChips>> = {}) {
	return render(
		<PlayerChips
			videoId="vid-1"
			language="sw"
			voicePath="/voice/amina-ke-001"
			ogImagePath="/og/voice/amina-ke-001.png"
			shareTitle="Amina on Own Your Game"
			strings={strings}
			{...props}
		/>,
	);
}

describe("PlayerChips — captions", () => {
	afterEach(() => vi.restoreAllMocks());

	it("renders an on/off toggle for the one spoken-language track", () => {
		renderChips();
		expect(screen.getByRole("button", { name: "Captions: Off" })).toBeInTheDocument();
	});

	it("hides the captions chip when the voice has no language", () => {
		renderChips({ language: "" });
		expect(screen.queryByRole("button", { name: /Captions/ })).not.toBeInTheDocument();
	});

	it("toggles captions on/off and dispatches the caption-change event", async () => {
		const user = userEvent.setup();
		const events: (string | null)[] = [];
		const listener = (e: Event) => events.push((e as CustomEvent<CaptionChangeDetail>).detail.lang);
		window.addEventListener(CAPTION_CHANGE_EVENT, listener);

		renderChips();
		const chip = screen.getByRole("button", { name: "Captions: Off" });
		await user.click(chip);
		// On: label shows the language name, event carries the lang, pressed.
		expect(screen.getByRole("button", { name: "Captions: Swahili" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await user.click(screen.getByRole("button", { name: "Captions: Swahili" }));
		expect(screen.getByRole("button", { name: "Captions: Off" })).toBeInTheDocument();

		window.removeEventListener(CAPTION_CHANGE_EVENT, listener);
		expect(events).toEqual(["sw", null]);
	});
});

describe("PlayerChips — transcript", () => {
	it("opens a dialog with the transcript prose", async () => {
		const user = userEvent.setup();
		renderChips({ transcript: "Line one.\n\nLine two." });
		await user.click(screen.getByRole("button", { name: "Read transcript" }));
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveTextContent("Line one.");
		expect(dialog).toHaveTextContent("Line two.");
	});

	it("shows the not-available message when there's no transcript", async () => {
		const user = userEvent.setup();
		renderChips({ transcript: undefined });
		await user.click(screen.getByRole("button", { name: "Read transcript" }));
		const dialog = await screen.findByRole("dialog");
		expect(dialog).toHaveTextContent("Transcript not yet available for this voice.");
	});
});

describe("PlayerChips — share", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		// @ts-expect-error — clean the test-only shim off navigator.
		delete navigator.share;
	});

	it("copies the absolute voice URL and shows a confirmation", async () => {
		// userEvent.setup() installs a working clipboard stub we can read back.
		const user = userEvent.setup();
		renderChips();
		await user.click(screen.getByRole("button", { name: "Share this voice" }));
		await user.click(await screen.findByRole("button", { name: "Copy link" }));

		expect(await navigator.clipboard.readText()).toBe(
			`${window.location.origin}/voice/amina-ke-001`,
		);
		expect(await screen.findByText("Copied!")).toBeInTheDocument();
	});

	it("offers a share-as-image link but no native share when unsupported", async () => {
		const user = userEvent.setup();
		// No navigator.share → no native option.
		renderChips();
		await user.click(screen.getByRole("button", { name: "Share this voice" }));
		expect(screen.queryByRole("button", { name: "Share via…" })).not.toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Share as image" })).toHaveAttribute(
			"href",
			"/og/voice/amina-ke-001.png",
		);
	});

	it("invokes navigator.share when the browser supports it", async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "share", { configurable: true, value: share });
		const user = userEvent.setup();
		renderChips();
		await user.click(screen.getByRole("button", { name: "Share this voice" }));
		await user.click(await screen.findByRole("button", { name: "Share via…" }));
		expect(share).toHaveBeenCalledWith({
			title: "Amina on Own Your Game",
			url: `${window.location.origin}/voice/amina-ke-001`,
		});
	});
});
