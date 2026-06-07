/**
 * `/voice-data/{id}.json` — one voice's full data + transcript, emitted as
 * a static file per voice at build (DEV-107).
 *
 * Fetched on demand when a player card opens (and prefetched for the
 * immediate prev/next neighbours), so the heavy fields the card needs
 * (`pullQuote`, `city`, `videoId`) and the optional transcript never inline
 * onto every page. The lightweight index (`voices-index.json`) covers
 * find / order / label / filter / tile rendering.
 */

import type { APIRoute, GetStaticPaths } from "astro";

import { getAllVoices, getTranscript, getVoiceById } from "~/lib/content";
import type { VoiceData } from "~/lib/voice-index";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () =>
	getAllVoices().map((voice) => ({ params: { id: voice.id } }));

export const GET: APIRoute = ({ params }) => {
	const id = String(params.id);
	const voice = getVoiceById(id);
	if (!voice) return new Response("Not found", { status: 404 });

	const transcript = getTranscript(id) ?? undefined;
	const payload: VoiceData = transcript !== undefined ? { voice, transcript } : { voice };
	return new Response(JSON.stringify(payload), {
		headers: { "content-type": "application/json; charset=utf-8" },
	});
};
