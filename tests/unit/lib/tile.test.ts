import { describe, expect, it } from "vitest";

import { padPosition, tileAccessibleName, tileHref } from "~/lib/tile";
import { SAMPLE_VOICES } from "../../fixtures/voices";

describe("padPosition", () => {
	it("pads single-digit positions to two characters", () => {
		expect(padPosition(1)).toBe("01");
		expect(padPosition(9)).toBe("09");
	});

	it("leaves two-digit positions at two characters", () => {
		expect(padPosition(11)).toBe("11");
		expect(padPosition(99)).toBe("99");
	});

	it("pads to three characters once we hit 100", () => {
		expect(padPosition(100)).toBe("100");
		expect(padPosition(247)).toBe("247");
		expect(padPosition(999)).toBe("999");
	});

	it("handles zero without crashing", () => {
		expect(padPosition(0)).toBe("00");
	});
});

describe("tileAccessibleName", () => {
	it("formats as 'First, Country (CODE), position NN' with padded number", () => {
		const amara = SAMPLE_VOICES[0]!;
		expect(tileAccessibleName(amara, 1)).toBe("Amara, Nigeria (NG), position 01");
		expect(tileAccessibleName(amara, 247)).toBe("Amara, Nigeria (NG), position 247");
	});

	it("uses the voice's first name only — no surname leakage", () => {
		const yusuf = SAMPLE_VOICES[1]!;
		const label = tileAccessibleName(yusuf, 7);
		expect(label).toContain("Yusuf");
		expect(label.split(",")).toHaveLength(3);
	});

	// WCAG 2.5.3 Label in Name: every token visible on the tile (first
	// name, country code, padded position) must be a substring of the
	// accessible name. Guards against regressing the DEV-87 fix.
	it("contains every visible tile token (first name, country code, padded position)", () => {
		for (const voice of SAMPLE_VOICES) {
			for (const position of [1, 11, 100, 247]) {
				const label = tileAccessibleName(voice, position);
				expect(label).toContain(voice.firstName);
				expect(label).toContain(voice.countryCode);
				expect(label).toContain(padPosition(position));
			}
		}
	});
});

describe("tileHref", () => {
	it("routes to /voice/:id", () => {
		expect(tileHref(SAMPLE_VOICES[2]!)).toBe("/voice/sofia-ar-003");
	});
});
