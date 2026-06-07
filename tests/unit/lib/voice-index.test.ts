import { describe, expect, it } from "vitest";

import type { Voice } from "~/lib/voice";
import { toVoiceIndex, toVoiceIndexEntry } from "~/lib/voice-index";
import { SAMPLE_VOICES } from "../../fixtures/voices";

// The shared fixtures are silhouette-only (no portraitImageId, so demo
// grids don't 404 — DEV-74), so build one inline to cover the present path.
const WITH_PORTRAIT: Voice = {
	id: "amina-ke-001",
	firstName: "Amina",
	age: 17,
	countryCode: "KE",
	city: "Nairobi",
	theme: "friendship",
	pullQuote: "My team is my second family.",
	language: "sw",
	videoId: "a1b2c3d4e5f6a7b8",
	portraitImageId: "amina-ke-001",
	publishedAt: "2026-05-01T09:00:00Z",
};

/**
 * The lightweight voice index (DEV-107): the projection pages fetch lazily
 * instead of inlining the full catalogue. These pins guard the field set —
 * the index must carry everything needed to find / order / label / filter /
 * render a tile, and must NOT carry the heavy fields a card only needs once
 * it's opened.
 */

const HEAVY_FIELDS = ["pullQuote", "city", "videoId"] as const;
const INDEX_FIELDS = [
	"id",
	"firstName",
	"age",
	"countryCode",
	"theme",
	"language",
	"publishedAt",
] as const;

describe("toVoiceIndexEntry", () => {
	it("keeps the find/order/label/filter/tile fields and drops the heavy ones", () => {
		const entry = toVoiceIndexEntry(WITH_PORTRAIT);

		for (const field of INDEX_FIELDS) {
			expect(entry[field]).toEqual(WITH_PORTRAIT[field]);
		}
		expect(entry.portraitImageId).toBe(WITH_PORTRAIT.portraitImageId);
		for (const field of HEAVY_FIELDS) {
			expect(field in entry).toBe(false);
		}
	});

	it("omits portraitImageId entirely when the voice has none", () => {
		const withoutPortrait = SAMPLE_VOICES.find((v) => v.portraitImageId === undefined);
		expect(withoutPortrait, "fixture should include a portrait-less voice").toBeDefined();
		const entry = toVoiceIndexEntry(withoutPortrait!);
		expect("portraitImageId" in entry).toBe(false);
	});
});

describe("toVoiceIndex", () => {
	it("projects every voice and preserves order", () => {
		const index = toVoiceIndex(SAMPLE_VOICES);
		expect(index).toHaveLength(SAMPLE_VOICES.length);
		expect(index.map((e) => e.id)).toEqual(SAMPLE_VOICES.map((v) => v.id));
	});

	it("produces entries free of every heavy field", () => {
		for (const entry of toVoiceIndex(SAMPLE_VOICES)) {
			for (const field of HEAVY_FIELDS) {
				expect(field in entry).toBe(false);
			}
		}
	});
});
