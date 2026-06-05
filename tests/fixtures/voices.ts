/**
 * Sample Voice records for demos and tests.
 *
 * Twelve hand-written voices, diverse across the six themes, multiple
 * continents (Africa, Asia, Americas, Europe), age 11–18, and a mix
 * of languages. They match the Zod schema in `schemas/voice.ts`
 * exactly — `voicesFileSchema.parse(SAMPLE_VOICES_FILE)` succeeds, and
 * `voiceSchema.parse(v)` succeeds for every `v` in `SAMPLE_VOICES`.
 *
 * Used by:
 *   - The `/demo/*` pages (Tile, Portrait) so the design system can be
 *     exercised without the real pipeline running.
 *   - Vitest specs that need concrete Voice instances.
 *   - The Home and Squad page work (Epic 5+) — these fixtures are the
 *     placeholder until `content/voices.json` is wired up live.
 *
 * Pull-quotes are drawn from prototype themes; first names are
 * intentionally diverse but unrelated to any real young person on the
 * campaign.
 *
 * **Replaced at runtime** by `content/voices.json`, produced by the
 * pipeline (DEV-31). This fixture set continues to back the demo pages
 * and unit tests after the pipeline is live.
 */

import type { Voice } from "~/lib/voice";

export const SAMPLE_VOICES: readonly Voice[] = [
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
		publishedAt: "2026-05-01T09:00:00Z",
	},
	{
		id: "yusuf-eg-002",
		firstName: "Yusuf",
		age: 16,
		countryCode: "EG",
		city: "Cairo",
		theme: "friendship",
		pullQuote: "My team is the reason I show up — even on the bad days.",
		language: "ar",
		videoId: "b2c3d4e5f6a7b8c9",
		publishedAt: "2026-05-03T11:30:00Z",
	},
	{
		id: "sofia-ar-003",
		firstName: "Sofía",
		age: 13,
		countryCode: "AR",
		city: "Rosario",
		theme: "family",
		pullQuote: "My grandmother taught me football. She's still my coach.",
		language: "es",
		videoId: "c3d4e5f6a7b8c9d0",
		publishedAt: "2026-05-05T14:15:00Z",
	},
	{
		id: "mei-vn-004",
		firstName: "Mei",
		age: 12,
		countryCode: "VN",
		city: "Hanoi",
		theme: "confidence",
		pullQuote: "I used to look at the ball. Now I look at where the ball will be.",
		language: "vi",
		videoId: "d4e5f6a7b8c9d0e1",
		publishedAt: "2026-05-07T08:45:00Z",
	},
	{
		id: "bashir-pk-005",
		firstName: "Bashir",
		age: 17,
		countryCode: "PK",
		city: "Karachi",
		theme: "community",
		pullQuote: "When we play, the neighbourhood comes out to watch.",
		language: "ur",
		videoId: "e5f6a7b8c9d0e1f2",
		publishedAt: "2026-05-09T16:00:00Z",
	},
	{
		id: "carlos-br-006",
		firstName: "Carlos",
		age: 15,
		countryCode: "BR",
		city: "Salvador",
		theme: "fairness",
		pullQuote: "Football should be the same game for everyone who steps on the pitch.",
		language: "pt-BR",
		videoId: "f6a7b8c9d0e1f2a3",
		publishedAt: "2026-05-11T10:20:00Z",
	},
	{
		id: "aisha-sn-007",
		firstName: "Aïsha",
		age: 13,
		countryCode: "SN",
		city: "Dakar",
		theme: "family",
		pullQuote: "My brothers play. My cousins play. Now I play, and they listen to me.",
		language: "fr",
		videoId: "a7b8c9d0e1f2a3b4",
		publishedAt: "2026-05-13T13:05:00Z",
	},
	{
		id: "liang-cn-008",
		firstName: "Liang",
		age: 16,
		countryCode: "CN",
		city: "Chengdu",
		theme: "friendship",
		pullQuote: "We win, we lose, we walk home together. That's the whole sport.",
		language: "zh",
		videoId: "b8c9d0e1f2a3b4c5",
		publishedAt: "2026-05-15T07:30:00Z",
	},
	{
		id: "rohan-in-009",
		firstName: "Rohan",
		age: 18,
		countryCode: "IN",
		city: "Mumbai",
		theme: "confidence",
		pullQuote: "I'm short. So I learned to play faster than everyone taller than me.",
		language: "hi",
		videoId: "c9d0e1f2a3b4c5d6",
		publishedAt: "2026-05-17T17:45:00Z",
	},
	{
		id: "talia-us-010",
		firstName: "Talia",
		age: 11,
		countryCode: "US",
		city: "Atlanta",
		theme: "belonging",
		pullQuote: "Nobody asked where I'm from on the pitch. They just passed.",
		language: "en",
		videoId: "d0e1f2a3b4c5d6e7",
		publishedAt: "2026-05-19T12:10:00Z",
	},
	{
		id: "idris-ma-011",
		firstName: "Idris",
		age: 15,
		countryCode: "MA",
		city: "Rabat",
		theme: "community",
		pullQuote: "Our pitch was a car park. We made it the best car park in the city.",
		language: "ar",
		videoId: "e1f2a3b4c5d6e7f8",
		publishedAt: "2026-05-21T15:50:00Z",
	},
	{
		id: "naomi-ke-012",
		firstName: "Naomi",
		age: 14,
		countryCode: "KE",
		city: "Nairobi",
		theme: "fairness",
		pullQuote: "Equal teams. Equal pitches. Equal cheer. That's the whole letter.",
		language: "sw",
		videoId: "f2a3b4c5d6e7f8a9",
		publishedAt: "2026-05-23T09:25:00Z",
	},
	// Entries 13–16 give the rotation island enough pool headroom to
	// reliably swap visible tiles (11 visible + 5 spares). DEV-39's
	// timing e2e targets the demo page so the rotation pool is the
	// project-owned fixture, not the pipeline-managed voices.json.
	{
		id: "fatou-sn-013",
		firstName: "Fatou",
		age: 11,
		countryCode: "SN",
		city: "Dakar",
		theme: "fairness",
		pullQuote: "When we play, we all start with zero. That's why I love this game.",
		language: "fr",
		videoId: "4d5e6f7a8b9c0d1e",
		publishedAt: "2026-05-23T14:50:00Z",
	},
	{
		id: "kenji-jp-014",
		firstName: "Kenji",
		age: 16,
		countryCode: "JP",
		city: "Yokohama",
		theme: "family",
		pullQuote: "My older brother passes me the ball. My little sister passes it back.",
		language: "ja",
		videoId: "0f1a2b3c4d5e6f7a",
		publishedAt: "2026-05-23T19:35:00Z",
	},
	{
		id: "isabella-it-015",
		firstName: "Isabella",
		age: 14,
		countryCode: "IT",
		city: "Napoli",
		theme: "belonging",
		pullQuote: "From my balcony I hear the ball before I see it. That sound is home.",
		language: "it",
		videoId: "8b9c0d1e2f3a4b5c",
		publishedAt: "2026-05-24T08:10:00Z",
	},
	{
		id: "kwame-gh-016",
		firstName: "Kwame",
		age: 17,
		countryCode: "GH",
		city: "Accra",
		theme: "community",
		pullQuote: "The whole street watches our matches. The whole street counts our goals.",
		language: "en",
		videoId: "5c6d7e8f9a0b1c2d",
		publishedAt: "2026-05-24T12:25:00Z",
	},
];

/**
 * `voices.json`-shaped fixture wrapping `SAMPLE_VOICES`. Useful for
 * loader tests (DEV-34) that need to exercise the file-level schema
 * (`voicesFileSchema`).
 */
export const SAMPLE_VOICES_FILE = {
	generatedAt: "2026-05-24T10:00:00Z",
	schemaVersion: 1 as const,
	voices: SAMPLE_VOICES,
};
