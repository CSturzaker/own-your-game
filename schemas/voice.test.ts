import { describe, expect, it } from "vitest";

import { THEMES, voiceSchema, voicesFileSchema, type Theme, type Voice } from "./voice";

/**
 * A known-good Voice. Each negative test below clones this and breaks
 * exactly one field, so failures localise to the constraint under test.
 */
const validVoice: Voice = {
	id: "amina-ke-001",
	firstName: "Amina",
	age: 14,
	countryCode: "KE",
	city: "Nairobi",
	theme: "belonging",
	pullQuote: "Football is where I feel I belong.",
	language: "sw",
	videoId: "a1b2c3d4e5f6a7b8",
	portraitImageId: "amina-ke-001",
	publishedAt: "2026-05-20T14:32:00Z",
};

describe("voiceSchema — valid input", () => {
	it("parses a canonical Voice without error", () => {
		const parsed = voiceSchema.parse(validVoice);
		expect(parsed).toEqual(validVoice);
	});

	it("accepts BCP 47 language tags with region (xx-XX)", () => {
		expect(voiceSchema.safeParse({ ...validVoice, language: "es-MX" }).success).toBe(true);
		expect(voiceSchema.safeParse({ ...validVoice, language: "pt-BR" }).success).toBe(true);
	});

	it("accepts a Cloudflare Images ID and treats portraitImageId as optional", () => {
		// UUID-style and custom IDs both parse.
		for (const id of ["2cdc28f0-017a-49c4-9ed7-87056c83901a", "amina-ke-001", "Img_123"]) {
			expect(voiceSchema.safeParse({ ...validVoice, portraitImageId: id }).success).toBe(true);
		}
		// Optional: a voice with no portrait still validates (silhouette fallback).
		const withoutPortrait = { ...validVoice };
		delete withoutPortrait.portraitImageId;
		expect(voiceSchema.safeParse(withoutPortrait).success).toBe(true);
	});

	it("accepts each of the six themes", () => {
		for (const theme of THEMES) {
			const result = voiceSchema.safeParse({ ...validVoice, theme });
			expect(result.success).toBe(true);
		}
	});
});

describe("voiceSchema — invalid input", () => {
	it("rejects an id that is too short", () => {
		expect(voiceSchema.safeParse({ ...validVoice, id: "ab" }).success).toBe(false);
	});

	it("rejects an id with uppercase letters or whitespace", () => {
		expect(voiceSchema.safeParse({ ...validVoice, id: "Amina-KE-001" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, id: "amina ke 001" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, id: "amina_ke_001" }).success).toBe(false);
	});

	it("rejects a firstName that is too long (>40)", () => {
		expect(voiceSchema.safeParse({ ...validVoice, firstName: "x".repeat(41) }).success).toBe(false);
	});

	it("rejects an empty firstName", () => {
		expect(voiceSchema.safeParse({ ...validVoice, firstName: "" }).success).toBe(false);
	});

	it("rejects ages outside 11–18", () => {
		expect(voiceSchema.safeParse({ ...validVoice, age: 10 }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, age: 19 }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, age: 14.5 }).success).toBe(false);
	});

	it("rejects a non-uppercase or alpha-3 country code", () => {
		expect(voiceSchema.safeParse({ ...validVoice, countryCode: "ke" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, countryCode: "KEN" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, countryCode: "K1" }).success).toBe(false);
	});

	it("rejects empty city or city >80 chars", () => {
		expect(voiceSchema.safeParse({ ...validVoice, city: "" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, city: "x".repeat(81) }).success).toBe(false);
	});

	it("rejects an unknown theme", () => {
		expect(voiceSchema.safeParse({ ...validVoice, theme: "joy" }).success).toBe(false);
	});

	it("rejects a pullQuote >120 chars", () => {
		expect(voiceSchema.safeParse({ ...validVoice, pullQuote: "x".repeat(121) }).success).toBe(
			false,
		);
	});

	it("rejects malformed language tags", () => {
		expect(voiceSchema.safeParse({ ...validVoice, language: "english" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, language: "EN" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, language: "en-mx" }).success).toBe(false);
	});

	it("rejects a videoId that is not a hex string", () => {
		expect(voiceSchema.safeParse({ ...validVoice, videoId: "not-hex-here" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, videoId: "abc123" }).success).toBe(false); // too short
	});

	it("rejects a portraitImageId with URL-unsafe characters", () => {
		// Spaces, dots, and slashes can't sit in a delivery-URL path segment.
		expect(voiceSchema.safeParse({ ...validVoice, portraitImageId: "amina ke 001" }).success).toBe(
			false,
		);
		expect(
			voiceSchema.safeParse({ ...validVoice, portraitImageId: "amina-ke-001.webp" }).success,
		).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, portraitImageId: "a/b" }).success).toBe(false);
		// Empty string is not a valid ID (use omission for "no portrait").
		expect(voiceSchema.safeParse({ ...validVoice, portraitImageId: "" }).success).toBe(false);
	});

	it("rejects a non-ISO-8601 publishedAt", () => {
		expect(voiceSchema.safeParse({ ...validVoice, publishedAt: "2026-05-20" }).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, publishedAt: "yesterday" }).success).toBe(false);
	});

	it("rejects unexpected types", () => {
		expect(voiceSchema.safeParse(null).success).toBe(false);
		expect(voiceSchema.safeParse({}).success).toBe(false);
		expect(voiceSchema.safeParse({ ...validVoice, age: "14" }).success).toBe(false);
	});
});

describe("voicesFileSchema", () => {
	it("parses a well-formed file with the expected schemaVersion", () => {
		const file = {
			generatedAt: "2026-05-27T10:00:00Z",
			schemaVersion: 1 as const,
			voices: [validVoice, { ...validVoice, id: "yusuf-eg-002", firstName: "Yusuf" }],
		};
		const parsed = voicesFileSchema.parse(file);
		expect(parsed.voices).toHaveLength(2);
	});

	it("rejects a file with the wrong schemaVersion", () => {
		const file = {
			generatedAt: "2026-05-27T10:00:00Z",
			schemaVersion: 2,
			voices: [validVoice],
		};
		expect(voicesFileSchema.safeParse(file).success).toBe(false);
	});

	it("rejects a file with an invalid voice in the array", () => {
		const file = {
			generatedAt: "2026-05-27T10:00:00Z",
			schemaVersion: 1,
			voices: [validVoice, { ...validVoice, age: 9 }],
		};
		expect(voicesFileSchema.safeParse(file).success).toBe(false);
	});

	it("accepts an empty voices array (e.g. pre-launch state)", () => {
		const file = {
			generatedAt: "2026-05-27T10:00:00Z",
			schemaVersion: 1 as const,
			voices: [],
		};
		expect(voicesFileSchema.safeParse(file).success).toBe(true);
	});
});

describe("THEMES export", () => {
	it("exposes all six themes as a readonly tuple", () => {
		expect(THEMES).toEqual([
			"fairness",
			"belonging",
			"friendship",
			"confidence",
			"family",
			"community",
		]);
	});

	it("the Theme type narrows correctly", () => {
		const t: Theme = "belonging";
		expect(THEMES).toContain(t);
	});
});
