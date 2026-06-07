/**
 * `/voices-index.json` — the lightweight voice index, emitted as a single
 * static file at build (DEV-107).
 *
 * The player-card overlay, the home rotation pool, and the standalone
 * player controls fetch this once (HTTP-cached) instead of every page
 * inlining the full voice set. Heavy per-voice fields are served separately
 * by `voice-data/[id].json.ts` and fetched only when a card opens.
 */

import type { APIRoute } from "astro";

import { getAllVoices } from "~/lib/content";
import { toVoiceIndex } from "~/lib/voice-index";

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(JSON.stringify(toVoiceIndex(getAllVoices())), {
		headers: { "content-type": "application/json; charset=utf-8" },
	});
