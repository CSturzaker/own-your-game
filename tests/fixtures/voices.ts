import type { Voice } from "~/lib/voice";

/**
 * Sample Voice records for demos and tests.
 *
 * Replaced by the real pipeline (voices.json + Zod schema) when
 * DEV-29 lands. Shape matches the minimal `Voice` interface in
 * `src/lib/voice.ts`; both will expand together.
 */
export const SAMPLE_VOICES: readonly Voice[] = [
	{
		id: "v01",
		firstName: "Amara",
		country: "Nigeria",
		countryCode: "NGA",
		theme: "belonging",
	},
	{
		id: "v02",
		firstName: "Yusuf",
		country: "Egypt",
		countryCode: "EGY",
		theme: "friendship",
	},
	{
		id: "v03",
		firstName: "Sofía",
		country: "Argentina",
		countryCode: "ARG",
		theme: "family",
	},
	{
		id: "v04",
		firstName: "Mei",
		country: "Vietnam",
		countryCode: "VNM",
		theme: "confidence",
	},
];
