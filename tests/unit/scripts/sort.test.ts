import { describe, expect, it } from "vitest";

import type { Voice } from "~/lib/voice";

import { sortVoicesById } from "../../../scripts/pipeline/sort";

function v(id: string): Voice {
	return {
		id,
		firstName: "X",
		age: 14,
		countryCode: "NG",
		city: "Lagos",
		theme: "belonging",
		pullQuote: "x",
		language: "en",
		videoId: "a1b2c3d4e5f6a7b8",
		portraitImageId: id,
		publishedAt: "2026-05-01T09:00:00Z",
	};
}

describe("sortVoicesById", () => {
	it("orders voices ascending by id", () => {
		const sorted = sortVoicesById([v("z-zz-001"), v("a-aa-001"), v("m-mm-001")]);
		expect(sorted.map((x) => x.id)).toEqual(["a-aa-001", "m-mm-001", "z-zz-001"]);
	});

	it("is locale-independent (byte compare on a-z0-9-)", () => {
		const sorted = sortVoicesById([v("amina-ke-010"), v("amina-ke-002")]);
		// String compare: "amina-ke-002" < "amina-ke-010" — keep that
		// ordering rather than a numeric one, so the rule is simple.
		expect(sorted.map((x) => x.id)).toEqual(["amina-ke-002", "amina-ke-010"]);
	});

	it("does not mutate its input", () => {
		const input = [v("b"), v("a")];
		const before = input.map((x) => x.id);
		sortVoicesById(input);
		expect(input.map((x) => x.id)).toEqual(before);
	});

	it("handles an empty array", () => {
		expect(sortVoicesById([])).toEqual([]);
	});
});
