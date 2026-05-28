/**
 * Self-check: SAMPLE_VOICES (and SAMPLE_VOICES_FILE) must parse cleanly
 * through the Zod schema. If a fixture drifts, this test surfaces the
 * problem before it propagates into demo pages or downstream specs.
 */

import { describe, expect, it } from "vitest";

import { voiceSchema, voicesFileSchema } from "~/lib/voice";
import { SAMPLE_VOICES, SAMPLE_VOICES_FILE } from "../../fixtures/voices";
import { COUNTRY_NAMES } from "~/lib/countries";

describe("SAMPLE_VOICES fixture", () => {
	it("contains 16 voices — 11 visible + 5 spares so the rotation e2e has pool headroom", () => {
		expect(SAMPLE_VOICES).toHaveLength(16);
	});

	it("every voice parses against voiceSchema", () => {
		for (const voice of SAMPLE_VOICES) {
			const result = voiceSchema.safeParse(voice);
			if (!result.success) {
				throw new Error(`Fixture voice ${voice.id} failed validation: ${result.error.message}`);
			}
		}
	});

	it("every country code has a display-name mapping", () => {
		for (const voice of SAMPLE_VOICES) {
			expect(COUNTRY_NAMES).toHaveProperty(voice.countryCode);
		}
	});

	it("ids are unique", () => {
		const ids = SAMPLE_VOICES.map((v) => v.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("covers all six themes at least once", () => {
		const themes = new Set(SAMPLE_VOICES.map((v) => v.theme));
		expect(themes.size).toBe(6);
	});
});

describe("SAMPLE_VOICES_FILE fixture", () => {
	it("parses against voicesFileSchema", () => {
		const result = voicesFileSchema.safeParse(SAMPLE_VOICES_FILE);
		expect(result.success).toBe(true);
	});
});
