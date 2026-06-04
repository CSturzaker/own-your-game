/**
 * Lazy loader for the Cloudflare Stream embed SDK (DEV-46).
 *
 * The iframe player handles all native controls on its own — we don't need
 * the SDK for playback. We load it *only* to subscribe to player events
 * (`play` / `ended` / `error`) the iframe can't surface across origins:
 * `ended` for analytics and `error` to drive the player's own "video
 * unavailable" state (a bad video UID renders Cloudflare's in-iframe error
 * page, which a cross-origin parent can't otherwise detect).
 *
 * It's loaded from Cloudflare's CDN, async, and only after the user presses
 * play — so it costs nothing on page load and nothing against the island's
 * own bundle budget. If it fails to load, native controls still work; we
 * just miss the events (non-fatal, hence the reject is swallowed by callers).
 *
 * DOM + external-script side effects, exercised in e2e against the real
 * player rather than mocked in jsdom — coverage-excluded (vitest.config.ts).
 */

const SDK_URL = "https://embed.cloudflarestream.com/embed/sdk.latest.js";

/** The subset of the Stream player API we use. */
export interface StreamPlayerApi {
	addEventListener(event: string, listener: () => void): void;
	removeEventListener(event: string, listener: () => void): void;
}

/** The global `Stream` factory the SDK attaches to `window`. */
export type StreamFactory = (iframe: HTMLIFrameElement) => StreamPlayerApi;

declare global {
	interface Window {
		Stream?: StreamFactory;
	}
}

let pending: Promise<StreamFactory> | null = null;

/**
 * Resolve with the global `Stream` factory, injecting the SDK `<script>`
 * once and memoising the in-flight load. Rejects if the script fails to
 * load or doesn't expose `window.Stream`.
 */
export function loadStreamSdk(): Promise<StreamFactory> {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return Promise.reject(new Error("Cloudflare Stream SDK can only load in the browser"));
	}
	if (window.Stream) return Promise.resolve(window.Stream);
	if (pending) return pending;

	pending = new Promise<StreamFactory>((resolve, reject) => {
		const settle = () => {
			if (window.Stream) resolve(window.Stream);
			else reject(new Error("Cloudflare Stream SDK loaded but window.Stream is missing"));
		};
		const fail = () => {
			pending = null; // allow a later retry
			reject(new Error("Failed to load the Cloudflare Stream SDK"));
		};

		const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
		if (existing) {
			existing.addEventListener("load", settle);
			existing.addEventListener("error", fail);
			return;
		}

		const script = document.createElement("script");
		script.src = SDK_URL;
		script.async = true;
		script.addEventListener("load", settle);
		script.addEventListener("error", fail);
		document.head.appendChild(script);
	});
	return pending;
}
