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
		portraitFile: "amara-ng-001.webp",
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
		portraitFile: "yusuf-eg-002.webp",
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
		portraitFile: "sofia-ar-003.webp",
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
		portraitFile: "mei-vn-004.webp",
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
		portraitFile: "bashir-pk-005.webp",
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
		portraitFile: "carlos-br-006.webp",
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
		portraitFile: "aisha-sn-007.webp",
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
		portraitFile: "liang-cn-008.webp",
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
		portraitFile: "rohan-in-009.webp",
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
		portraitFile: "talia-us-010.webp",
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
		portraitFile: "idris-ma-011.webp",
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
		portraitFile: "naomi-ke-012.webp",
		publishedAt: "2026-05-23T09:25:00Z",
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
