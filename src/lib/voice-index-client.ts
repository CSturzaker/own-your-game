/**
 * Client-side loaders for the lazily-fetched voice index and per-voice
 * data (DEV-107).
 *
 * Pages no longer inline the voice set; islands that need it fetch these
 * static build artifacts at runtime:
 *
 *   - `/voices-index.json`   — the whole lightweight index (one request,
 *     HTTP-cached, so it's fetched once and reused across navigations).
 *   - `/voice-data/{id}.json` — one voice's full data + transcript,
 *     fetched on demand when a card opens (+ neighbour prefetch).
 *
 * Both fetches are memoised at module scope so concurrent callers (the
 * overlay, the rotation pool, the standalone-page controls) share a single
 * in-flight request. A failed fetch clears its cache slot so a later call
 * can retry rather than caching the rejection forever.
 *
 * Browser-only: do not import from build-time code (Astro pages,
 * `~/lib/content`). The endpoints these hit are emitted by
 * `src/pages/voices-index.json.ts` and `src/pages/voice-data/[id].json.ts`.
 */

import type { VoiceData, VoiceIndexEntry } from "~/lib/voice-index";

/**
 * A `<html data-voice-index-ready>` marker is set the first time the index
 * resolves. It's the deterministic "interception is live" signal the e2e
 * player suites wait on, in place of racing a single `requestIdleCallback`.
 */
const INDEX_READY_ATTR = "data-voice-index-ready";

let indexPromise: Promise<readonly VoiceIndexEntry[]> | null = null;
const dataPromises = new Map<string, Promise<VoiceData>>();

/** Fetch (once) the lightweight index of every voice. */
export function loadVoiceIndex(): Promise<readonly VoiceIndexEntry[]> {
	indexPromise ??= fetch("/voices-index.json")
		.then((res) => {
			if (!res.ok) throw new Error(`voices-index.json → ${res.status}`);
			return res.json() as Promise<readonly VoiceIndexEntry[]>;
		})
		.then((index) => {
			if (typeof document !== "undefined") {
				document.documentElement.setAttribute(INDEX_READY_ATTR, "");
			}
			return index;
		})
		.catch((err: unknown) => {
			indexPromise = null; // allow a retry
			throw err;
		});
	return indexPromise;
}

/** Fetch (once per id) the full data + transcript for a single voice. */
export function loadVoiceData(id: string): Promise<VoiceData> {
	let promise = dataPromises.get(id);
	if (!promise) {
		promise = fetch(`/voice-data/${id}.json`)
			.then((res) => {
				if (!res.ok) throw new Error(`voice-data/${id}.json → ${res.status}`);
				return res.json() as Promise<VoiceData>;
			})
			.catch((err: unknown) => {
				dataPromises.delete(id); // allow a retry
				throw err;
			});
		dataPromises.set(id, promise);
	}
	return promise;
}
