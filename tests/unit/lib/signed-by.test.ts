import { describe, expect, it } from "vitest";

import { countryName } from "~/lib/countries";
import { DEFAULT_VISIBLE_SIGNERS, remainingSignerCount, selectSigners } from "~/lib/signed-by";
import { SAMPLE_VOICES } from "../../fixtures/voices";

describe("selectSigners", () => {
	it("returns the first N voices alphabetically by first name", () => {
		const signers = selectSigners(SAMPLE_VOICES, 11);
		expect(signers).toHaveLength(11);

		const names = signers.map((s) => s.firstName);
		const sorted = [...names].sort((a, b) => a.localeCompare(b));
		expect(names).toEqual(sorted);
	});

	it("is deterministic — same input, same order across calls", () => {
		const a = selectSigners(SAMPLE_VOICES, 11).map((s) => s.id);
		const b = selectSigners(SAMPLE_VOICES, 11).map((s) => s.id);
		expect(a).toEqual(b);
	});

	it("resolves the ISO country code to a display name", () => {
		const [first] = selectSigners(SAMPLE_VOICES, 1);
		const source = SAMPLE_VOICES.find((v) => v.id === first!.id)!;
		expect(first!.country).toBe(countryName(source.countryCode));
		// A real country name, not the bare 2-letter code.
		expect(first!.country).not.toMatch(/^[A-Z]{2}$/);
	});

	it("exposes only safeguarding-safe fields (no surname, no age)", () => {
		const [first] = selectSigners(SAMPLE_VOICES, 1);
		// No `age` — withheld per DEV-122 (consent: age must not be disclosed).
		expect(Object.keys(first!).sort()).toEqual(["city", "country", "firstName", "id"]);
	});

	it("returns every voice when asked for more than exist", () => {
		expect(selectSigners(SAMPLE_VOICES, 100)).toHaveLength(SAMPLE_VOICES.length);
	});

	it("returns an empty list for a zero (or negative) visible count", () => {
		expect(selectSigners(SAMPLE_VOICES, 0)).toEqual([]);
		expect(selectSigners(SAMPLE_VOICES, -5)).toEqual([]);
	});

	it("defaults the visible count to 11", () => {
		expect(DEFAULT_VISIBLE_SIGNERS).toBe(11);
		expect(selectSigners(SAMPLE_VOICES)).toHaveLength(11);
	});
});

describe("remainingSignerCount", () => {
	it("returns how many are hidden behind the link", () => {
		expect(remainingSignerCount(16, 11)).toBe(5);
	});

	it("never goes negative when fewer voices than the visible count", () => {
		expect(remainingSignerCount(3, 11)).toBe(0);
	});
});

// The "+N more" overflow label moved into the dictionary (DEV-70,
// `letter.moreSigners`); `SignedBy.astro` resolves it and passes it to
// the island.
