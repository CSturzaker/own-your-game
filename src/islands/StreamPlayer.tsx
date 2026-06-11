import { useEffect, useRef, useState, type CSSProperties, type JSX } from "react";

import { onCaptionChange } from "~/lib/player-captions";
import { loadStreamSdk, type StreamPlayerApi } from "~/lib/stream-sdk";
import {
	hasStreamConfig,
	streamCustomerSubdomain,
	streamIframeUrl,
	streamThumbnailUrl,
} from "~/lib/stream";

/**
 * Cloudflare Stream iframe player (DEV-46).
 *
 * Fills the player card's video pane in both surfaces — the desktop Radix
 * modal (`PlayerCardModal`, hydrated as part of that island) and the
 * standalone `/voice/{id}` page (`Player.astro`, rendered as a nested
 * `client:idle` island in the card's video slot). One component, two hosts.
 *
 * The hard constraint: **no video bandwidth until the user presses play.**
 * Until then the pane shows the poster (the R2 portrait, already cached
 * from the tile, or a flat ink fallback) with a play button — the iframe
 * is not in the DOM, so the Stream player engine never loads. Pressing
 * play swaps the poster for the iframe with `autoplay=true`; the iframe
 * then owns all native controls (play/pause/scrub/volume/CC) per the issue.
 *
 * States (prototype `hifi-player.jsx` lines 140–256):
 *  - **poster** — poster image + play button, no iframe
 *  - **playing** — iframe mounted (transitions via a short cross-fade)
 *  - **error** — Stream couldn't load; the prototype's ↺ "video unavailable"
 *    pattern with a "Try again" that returns to
 *    poster. Reached when the SDK reports an `error`, or immediately on play
 *    when Stream isn't configured (local dev pre-Cloudflare).
 *
 * The customer subdomain is read through `~/lib/stream` (the env contract),
 * never `import.meta.env` directly. Caption language (`captionLanguage`,
 * wired by DEV-47's chip) sets `defaultTextTrack` and re-mounts the iframe.
 */

export interface StreamPlayerStrings {
	/** Play-button accessible label. */
	play: string;
	/** Poster-state kicker ("Video — Tap to play"). */
	tapToPlay: string;
	/** Playing-state kicker ("Video — Now Playing"). */
	nowPlaying: string;
	/** Error-state kicker ("Video — Unavailable"). */
	unavailable: string;
	/** Error heading. */
	errorHeading: string;
	/** Error body. */
	errorBody: string;
	/** Retry-button label. */
	retry: string;
}

export interface StreamPlayerProps {
	/** Cloudflare Stream video UID. */
	videoId: string;
	/** Accessible `<iframe title>` — the host interpolates the voice's name in. */
	title: string;
	/** Poster image URL (the R2 portrait). Ignored if not an absolute URL. */
	posterImage?: string;
	/** Localised video strings. */
	strings: StreamPlayerStrings;
	/**
	 * Initial caption track (BCP-47) to default on. After mount, DEV-47's
	 * captions chip drives changes via the `oyg:player-caption-change` window
	 * event (the chip is a separate island); `null` turns captions off.
	 */
	captionLanguage?: string;
	/**
	 * Aspect ratio when the player sizes itself (standalone / demo use).
	 * In the card the pane owns the responsive aspect and the host passes
	 * `className="absolute inset-0"`, so this is ignored there.
	 */
	aspectRatio?: "16/9" | "9/12";
	/** Extra classes for the root pane (the card passes layout-fill classes). */
	className?: string;
	/**
	 * Render the "Video — Tap to play" kicker line above the pane. The
	 * player-card surfaces keep it (default); the home campaign film
	 * (DEV-124) turns it off — its host owns all chrome around the pane.
	 */
	showKicker?: boolean;
	/** Called when the player enters the error state. */
	onError?: () => void;
}

type Mode = "poster" | "playing" | "error";

const isAbsoluteUrl = (value: string | undefined): value is string =>
	value !== undefined && /^https?:\/\//i.test(value);

export function StreamPlayer({
	videoId,
	title,
	posterImage,
	strings,
	captionLanguage,
	aspectRatio = "16/9",
	className,
	showKicker = true,
	onError,
}: StreamPlayerProps): JSX.Element {
	const [mode, setMode] = useState<Mode>("poster");
	const [captionLang, setCaptionLang] = useState<string | null>(captionLanguage ?? null);
	// A portrait that 404s (e.g. a stale Cloudflare Images ID) must not leave a
	// broken image behind the play button — track the URL that failed and drop
	// it so the flat-ink poster shows through (mirrors PortraitImage, DEV-97).
	// Keying on the URL rather than a boolean auto-resets when prev/next swaps
	// in a new posterImage in place, with no reset effect.
	const [failedPoster, setFailedPoster] = useState<string | null>(null);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);

	const poster =
		isAbsoluteUrl(posterImage) && posterImage !== failedPoster ? posterImage : undefined;

	// The captions chip (DEV-47) is a separate island; it requests a caption
	// track via a window event. Changing the language re-mounts the iframe
	// (its key is the language) so the new defaultTextTrack takes effect.
	useEffect(() => onCaptionChange(videoId, setCaptionLang), [videoId]);

	function play(): void {
		// Stream not provisioned (local dev), or no UID for this video yet
		// (the campaign montage before its asset lands, DEV-124) → there's
		// no URL to build, so surface the error state rather than mounting
		// a broken iframe.
		if (!hasStreamConfig() || videoId.length === 0) {
			setMode("error");
			onError?.();
			return;
		}
		// We know the user intends to play — log the analytics event here
		// (the `ended` event comes from the SDK below). Internal only for now
		// (DEV-46 scope); the analytics epic can wire this to a real sink.
		console.log("[player] play", { videoId });
		setMode("playing");
	}

	// Subscribe to player events once the iframe is mounted: `error` drives
	// our error state, `ended` is an analytics log. The SDK is lazy + external
	// (see stream-sdk.ts); failing to load it is non-fatal — native controls
	// still work, we just lose the events.
	useEffect(() => {
		if (mode !== "playing") return;
		let player: StreamPlayerApi | null = null;
		let cancelled = false;

		const onEnded = () => console.log("[player] ended", { videoId });
		const onErrorEvent = () => {
			if (cancelled) return;
			setMode("error");
			onError?.();
		};

		void loadStreamSdk()
			.then((Stream) => {
				if (cancelled || !iframeRef.current) return;
				player = Stream(iframeRef.current);
				player.addEventListener("ended", onEnded);
				player.addEventListener("error", onErrorEvent);
			})
			.catch(() => {
				/* SDK unavailable — native controls still work, events are lost. */
			});

		return () => {
			cancelled = true;
			player?.removeEventListener("ended", onEnded);
			player?.removeEventListener("error", onErrorEvent);
		};
	}, [mode, videoId, onError]);

	const kicker =
		mode === "error"
			? strings.unavailable
			: mode === "playing"
				? strings.nowPlaying
				: strings.tapToPlay;

	// When the host supplies sizing classes (the card passes the responsive
	// `aspect-9/12 lg:aspect-video`), trust them. Otherwise (standalone / demo)
	// size from the `aspectRatio` prop.
	const paneStyle: CSSProperties | undefined = className
		? undefined
		: { aspectRatio: aspectRatio.replace("/", " / ") };

	const paneClass = [
		"lg:rounded-card relative w-full overflow-hidden",
		className ?? "",
		mode === "error" ? "bg-paper-3 border-rule border" : "bg-ink",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<>
			{/* Desktop kicker label — the mobile full-page surface has its own chrome.
			    text-ink-2 (not the prototype's ink-3): ink-3 on the paper-2 pane is
			    4.45:1, below AA — the documented project divergence (CLAUDE.md). */}
			{showKicker && (
				<p className="font-display text-caption tracking-kicker text-ink-2 uppercase max-lg:hidden">
					{kicker}
				</p>
			)}

			<div className={paneClass} style={paneStyle} data-stream-player data-mode={mode}>
				{mode === "playing" ? (
					// Keyed by video AND caption track: a fresh iframe element per
					// video. Mutating a mounted iframe's src is a navigation that
					// pushes a joint session-history entry — with the modal's
					// replaceState swap (DEV-48) that made Close (history.back())
					// unwind one viewed voice per click instead of closing (DEV-126).
					// A newly-inserted iframe's initial load adds no entry.
					<iframe
						key={`${videoId}:${captionLang ?? "default"}`}
						ref={iframeRef}
						src={streamIframeUrl(streamCustomerSubdomain(), videoId, {
							poster: poster ?? streamThumbnailUrl(streamCustomerSubdomain(), videoId),
							defaultTextTrack: captionLang ?? undefined,
						})}
						title={title}
						allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
						className="absolute inset-0 size-full border-0"
					/>
				) : mode === "error" ? (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
						<span
							aria-hidden="true"
							className="border-rule bg-paper-2 text-ink-2 font-display rounded-pill flex size-14 items-center justify-center border text-2xl"
						>
							↺
						</span>
						<p className="font-display text-ink text-[16px] font-semibold">
							{strings.errorHeading}
						</p>
						<p className="text-ink-2 text-caption max-w-[38ch]">{strings.errorBody}</p>
						<button
							type="button"
							onClick={() => setMode("poster")}
							className="border-ink bg-ink text-paper rounded-pill text-caption mt-1 px-4 py-2 font-semibold"
						>
							{strings.retry}
						</button>
					</div>
				) : (
					<>
						{poster && (
							// Decorative — the name/quote beside it carry the meaning.
							<img
								src={poster}
								alt=""
								onError={() => setFailedPoster(posterImage ?? null)}
								className="absolute inset-0 size-full object-cover"
							/>
						)}
						{/* Scrim for play-button contrast over a bright portrait. */}
						<div aria-hidden="true" className="bg-ink/35 absolute inset-0" />
						<button
							type="button"
							onClick={play}
							aria-label={strings.play}
							data-play
							className="bg-paper/95 rounded-pill absolute top-1/2 left-1/2 flex size-[72px] -translate-1/2 items-center justify-center lg:size-20"
						>
							<svg
								viewBox="0 0 24 24"
								fill="currentColor"
								className="text-ink size-7"
								aria-hidden="true"
							>
								<path d="M8 5v14l11-7z" />
							</svg>
						</button>
					</>
				)}
			</div>
		</>
	);
}
