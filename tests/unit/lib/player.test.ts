import { afterEach, describe, expect, it, vi } from "vitest";

import { playerOgImage, playerTitle, voiceNeighbours, voicePosition } from "~/lib/player";
import type { Voice } from "~/lib/voice";

/**
 * A minimal Voice factory — only the fields the player helpers read
 * matter; the rest are filled with schema-valid placeholders.
 */
function voice(overrides: Partial<Voice> & Pick<Voice, "id" | "publishedAt">): Voice {
	return {
		firstName: "Amina",
		age: 14,
		countryCode: "KE",
		city: "Nairobi",
		theme: "friendship",
		pullQuote: "On the pitch I'm just one of the team.",
		language: "sw",
		videoId: "a1b2c3d4e5f6a7b8",
		portraitImageId: "amina-ke-001",
		...overrides,
	};
}

// Deliberately out of newest-first order, so the helpers must sort.
const VOICES: readonly Voice[] = [
	voice({ id: "b", publishedAt: "2026-05-02T00:00:00Z" }),
	voice({ id: "a", publishedAt: "2026-05-03T00:00:00Z" }), // newest
	voice({ id: "c", publishedAt: "2026-05-01T00:00:00Z" }), // oldest
];
// Newest-first order is therefore: a (3rd), b (2nd), c (1st).

describe("voicePosition", () => {
	it("is 1-indexed within the newest-first order", () => {
		expect(voicePosition("a", VOICES)).toBe(1);
		expect(voicePosition("b", VOICES)).toBe(2);
		expect(voicePosition("c", VOICES)).toBe(3);
	});

	it("returns 0 for an unknown id", () => {
		expect(voicePosition("missing", VOICES)).toBe(0);
	});
});

describe("voiceNeighbours", () => {
	it("returns the surrounding voices in newest-first order", () => {
		const { prev, next } = voiceNeighbours("b", VOICES);
		expect(prev?.id).toBe("a");
		expect(next?.id).toBe("c");
	});

	it("has no previous at the start of the list", () => {
		const { prev, next } = voiceNeighbours("a", VOICES);
		expect(prev).toBeUndefined();
		expect(next?.id).toBe("b");
	});

	it("has no next at the end of the list", () => {
		const { prev, next } = voiceNeighbours("c", VOICES);
		expect(prev?.id).toBe("b");
		expect(next).toBeUndefined();
	});

	it("returns both undefined for an unknown id", () => {
		expect(voiceNeighbours("missing", VOICES)).toEqual({ prev: undefined, next: undefined });
	});
});

describe("playerTitle", () => {
	it("formats name and country, omitting age (no campaign suffix — BaseLayout adds it)", () => {
		const v = voice({ id: "a", publishedAt: "2026-05-03T00:00:00Z", firstName: "Amina", age: 14 });
		expect(playerTitle(v)).toBe("Amina · Kenya");
	});
});

describe("playerOgImage", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("is undefined when no account hash is configured (local dev)", () => {
		vi.stubEnv("PUBLIC_CF_IMAGES_ACCOUNT_HASH", "");
		const v = voice({ id: "a", publishedAt: "2026-05-03T00:00:00Z" });
		expect(playerOgImage(v)).toBeUndefined();
	});

	it("is undefined when the voice has no portrait", () => {
		vi.stubEnv("PUBLIC_CF_IMAGES_ACCOUNT_HASH", "acc-hash");
		const v = voice({ id: "a", publishedAt: "2026-05-03T00:00:00Z", portraitImageId: undefined });
		expect(playerOgImage(v)).toBeUndefined();
	});

	it("is the absolute Cloudflare Images URL when both are configured", () => {
		vi.stubEnv("PUBLIC_CF_IMAGES_ACCOUNT_HASH", "acc-hash");
		const v = voice({ id: "a", publishedAt: "2026-05-03T00:00:00Z", portraitImageId: "amina" });
		expect(playerOgImage(v)).toBe(
			"https://imagedelivery.net/acc-hash/amina/w=800,h=800,fit=cover,gravity=face,format=auto,quality=80",
		);
	});
});
