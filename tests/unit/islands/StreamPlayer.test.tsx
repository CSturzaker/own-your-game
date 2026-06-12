import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { makeT } from "~/i18n/astro";
import { buildPlayerStrings } from "~/i18n/player-strings";
import { StreamPlayer } from "~/islands/StreamPlayer";
import { dispatchCaptionChange } from "~/lib/player-captions";
import { loadStreamSdk } from "~/lib/stream-sdk";

// The SDK injects an external <script>; mock it so the component can be
// exercised in jsdom and we can drive the player's `error`/`ended` events.
vi.mock("~/lib/stream-sdk", () => ({ loadStreamSdk: vi.fn() }));

const strings = buildPlayerStrings(makeT("en").t).video;
const TITLE = "Sofía’s video";

/** A fake Stream player that records its listeners so tests can fire events. */
function fakePlayer() {
	const listeners: Record<string, () => void> = {};
	return {
		api: {
			addEventListener: (event: string, cb: () => void) => {
				listeners[event] = cb;
			},
			removeEventListener: vi.fn(),
		},
		fire: (event: string) => listeners[event]?.(),
	};
}

describe("StreamPlayer", () => {
	beforeEach(() => {
		vi.stubEnv("PUBLIC_STREAM_CUSTOMER_SUBDOMAIN", "abc123def");
		vi.mocked(loadStreamSdk).mockResolvedValue(() => fakePlayer().api);
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("shows the poster + play button and mounts no iframe until play", () => {
		render(<StreamPlayer videoId="a1b2c3d4e5f6a7b8" title={TITLE} strings={strings} />);
		expect(screen.getByRole("button", { name: strings.play })).toBeInTheDocument();
		expect(document.querySelector("iframe")).toBeNull();
		expect(screen.getByText(strings.tapToPlay)).toBeInTheDocument();
	});

	it("loads the poster eagerly at high priority — it's the card LCP (DEV-129)", () => {
		const { container } = render(
			<StreamPlayer
				videoId="a1b2c3d4e5f6a7b8"
				title={TITLE}
				posterImage="https://cdn.example.com/p.webp"
				strings={strings}
			/>,
		);
		const poster = container.querySelector("img");
		expect(poster).not.toBeNull();
		expect(poster).toHaveAttribute("loading", "eager");
		expect(poster).toHaveAttribute("fetchpriority", "high");
	});

	it("mounts the Stream iframe with the right src when play is pressed", () => {
		render(
			<StreamPlayer
				videoId="a1b2c3d4e5f6a7b8"
				title={TITLE}
				posterImage="https://cdn.example.com/p.webp?width=800&format=webp"
				strings={strings}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: strings.play }));

		const iframe = screen.getByTitle(TITLE);
		expect(iframe.tagName).toBe("IFRAME");
		expect(iframe).toHaveAttribute(
			"src",
			expect.stringContaining(
				"https://customer-abc123def.cloudflarestream.com/a1b2c3d4e5f6a7b8/iframe",
			),
		);
		expect(iframe).toHaveAttribute("src", expect.stringContaining("autoplay=true"));
		expect(iframe).toHaveAttribute(
			"src",
			expect.stringContaining("poster=https%3A%2F%2Fcdn.example.com"),
		);
	});

	it("forwards the caption language as defaultTextTrack", () => {
		render(
			<StreamPlayer
				videoId="a1b2c3d4e5f6a7b8"
				title={TITLE}
				strings={strings}
				captionLanguage="es"
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: strings.play }));
		expect(screen.getByTitle(TITLE)).toHaveAttribute(
			"src",
			expect.stringContaining("defaultTextTrack=es"),
		);
	});

	it("falls back to the Stream thumbnail poster when no portrait URL is given", () => {
		render(
			// A bare filename (R2 unset) is not an absolute URL → use the thumbnail.
			<StreamPlayer
				videoId="a1b2c3d4e5f6a7b8"
				title={TITLE}
				posterImage="sofia.webp"
				strings={strings}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: strings.play }));
		expect(screen.getByTitle(TITLE)).toHaveAttribute(
			"src",
			expect.stringContaining("thumbnails%2Fthumbnail.jpg"),
		);
	});

	it("hides a poster that fails to load so the flat-ink poster shows (DEV-97)", () => {
		render(
			<StreamPlayer
				videoId="a1b2c3d4e5f6a7b8"
				title={TITLE}
				posterImage="https://imagedelivery.net/acc/missing/w=800,h=800,fit=cover,gravity=face,format=auto,quality=80"
				strings={strings}
			/>,
		);
		// Poster mode renders the portrait <img> behind the play button.
		const img = document.querySelector("img");
		expect(img).not.toBeNull();

		// A 404 fires the image error → the poster unmounts, leaving the
		// flat-ink pane + play button rather than a broken image.
		fireEvent.error(img!);
		expect(document.querySelector("img")).toBeNull();
		expect(screen.getByRole("button", { name: strings.play })).toBeInTheDocument();
	});

	it("shows the error state (not an iframe) when the video has no UID yet (DEV-124)", () => {
		// The campaign montage mounts with an empty videoId until its
		// Stream asset is produced — play must surface unavailable, not a
		// broken iframe, even with the subdomain configured (as in CI).
		const onError = vi.fn();
		render(<StreamPlayer videoId="" title={TITLE} strings={strings} onError={onError} />);
		fireEvent.click(screen.getByRole("button", { name: strings.play }));

		expect(screen.getByText(strings.errorHeading)).toBeInTheDocument();
		expect(document.querySelector("iframe")).toBeNull();
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it("omits the kicker line when the host opts out (DEV-124)", () => {
		render(
			<StreamPlayer
				videoId="a1b2c3d4e5f6a7b8"
				title={TITLE}
				strings={strings}
				showKicker={false}
			/>,
		);
		expect(screen.queryByText(strings.tapToPlay)).toBeNull();
		// The play control is unaffected.
		expect(screen.getByRole("button", { name: strings.play })).toBeInTheDocument();
	});

	it("shows the error state (not an iframe) when Stream is unconfigured", () => {
		vi.stubEnv("PUBLIC_STREAM_CUSTOMER_SUBDOMAIN", "");
		const onError = vi.fn();
		render(
			<StreamPlayer videoId="a1b2c3d4e5f6a7b8" title={TITLE} strings={strings} onError={onError} />,
		);
		fireEvent.click(screen.getByRole("button", { name: strings.play }));

		expect(screen.getByText(strings.errorHeading)).toBeInTheDocument();
		expect(document.querySelector("iframe")).toBeNull();
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it("enters the error state when the player reports an error, and retry returns to poster", async () => {
		const player = fakePlayer();
		vi.mocked(loadStreamSdk).mockResolvedValue(() => player.api);
		const onError = vi.fn();
		render(
			<StreamPlayer videoId="a1b2c3d4e5f6a7b8" title={TITLE} strings={strings} onError={onError} />,
		);

		fireEvent.click(screen.getByRole("button", { name: strings.play }));
		expect(screen.getByTitle(TITLE)).toBeInTheDocument();

		// Let the mocked SDK promise resolve and attach listeners.
		await act(async () => {});
		act(() => player.fire("error"));

		expect(screen.getByText(strings.errorHeading)).toBeInTheDocument();
		expect(onError).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole("button", { name: strings.retry }));
		expect(screen.getByRole("button", { name: strings.play })).toBeInTheDocument();
	});

	it("re-mounts the iframe with a new caption track on a caption-change event", () => {
		render(<StreamPlayer videoId="vid-cc" title={TITLE} strings={strings} />);
		fireEvent.click(screen.getByRole("button", { name: strings.play }));
		expect(screen.getByTitle(TITLE)).not.toHaveAttribute(
			"src",
			expect.stringContaining("defaultTextTrack"),
		);

		// The captions chip (a separate island) requests Spanish captions.
		act(() => dispatchCaptionChange("vid-cc", "es"));
		expect(screen.getByTitle(TITLE)).toHaveAttribute(
			"src",
			expect.stringContaining("defaultTextTrack=es"),
		);

		// An event for a different video is ignored.
		act(() => dispatchCaptionChange("other", "fr"));
		expect(screen.getByTitle(TITLE)).not.toHaveAttribute(
			"src",
			expect.stringContaining("defaultTextTrack=fr"),
		);
	});

	it("replaces the iframe element when the video changes mid-play (DEV-126)", () => {
		// Mutating a mounted iframe's src is a browser navigation that pushes
		// a session-history entry — in the modal's prev/next swap that made
		// Close unwind one viewed voice per click. The iframe must be a fresh
		// element per video; only the playing state carries over.
		const { rerender } = render(<StreamPlayer videoId="vid-1" title={TITLE} strings={strings} />);
		fireEvent.click(screen.getByRole("button", { name: strings.play }));
		const first = screen.getByTitle(TITLE);
		expect(first).toHaveAttribute("src", expect.stringContaining("/vid-1/iframe"));

		// The modal swaps the voice in place (same component, new props).
		rerender(<StreamPlayer videoId="vid-2" title={TITLE} strings={strings} />);
		const second = screen.getByTitle(TITLE);
		expect(second).toHaveAttribute("src", expect.stringContaining("/vid-2/iframe"));
		// A different DOM node — React keyed the iframe by video, so the old
		// element unmounted instead of having its src rewritten.
		expect(second).not.toBe(first);
		// Still playing (no poster/play button) — auto-continue is preserved.
		expect(screen.queryByRole("button", { name: strings.play })).toBeNull();
	});

	it("logs analytics on play and on ended", async () => {
		const player = fakePlayer();
		vi.mocked(loadStreamSdk).mockResolvedValue(() => player.api);
		const log = vi.spyOn(console, "log").mockImplementation(() => {});
		render(<StreamPlayer videoId="vid-001" title={TITLE} strings={strings} />);

		fireEvent.click(screen.getByRole("button", { name: strings.play }));
		expect(log).toHaveBeenCalledWith("[player] play", { videoId: "vid-001" });

		await act(async () => {});
		act(() => player.fire("ended"));
		expect(log).toHaveBeenCalledWith("[player] ended", { videoId: "vid-001" });
	});
});
