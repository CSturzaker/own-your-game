import { describe, expect, it } from "vitest";

import { FALLBACK_FLAG, flagSrc, hasFlag } from "~/lib/flags";

describe("flagSrc", () => {
	it("resolves mapped countries to their vendored SVG path", () => {
		expect(flagSrc("NG")).toBe("/flags/ng.svg");
		expect(flagSrc("BR")).toBe("/flags/br.svg");
		expect(flagSrc("VN")).toBe("/flags/vn.svg");
	});

	it("resolves the countries added beyond the prototype seed", () => {
		for (const code of [
			"ZW",
			"LB",
			"LY",
			"CI",
			"EC",
			"FJ",
			"GT",
			"ID",
			"MN",
			"PH",
			"SI",
			"GB",
			"KH",
		]) {
			expect(flagSrc(code)).toBe(`/flags/${code.toLowerCase()}.svg`);
		}
	});

	it("is case-insensitive and always emits a lowercase filename", () => {
		expect(flagSrc("ng")).toBe("/flags/ng.svg");
		expect(flagSrc("Ng")).toBe("/flags/ng.svg");
		expect(flagSrc("vn")).toBe(flagSrc("VN"));
	});

	it("returns null for unknown codes so the caller draws the fallback", () => {
		expect(flagSrc("XX")).toBeNull();
		expect(flagSrc("")).toBeNull();
	});
});

describe("hasFlag", () => {
	it("returns true for vendored codes regardless of case", () => {
		expect(hasFlag("NG")).toBe(true);
		expect(hasFlag("ng")).toBe(true);
		expect(hasFlag("VN")).toBe(true);
		expect(hasFlag("zw")).toBe(true);
	});

	it("returns false for codes with no vendored flag", () => {
		expect(hasFlag("TV")).toBe(false);
		expect(hasFlag("")).toBe(false);
	});
});

describe("FALLBACK_FLAG", () => {
	it("is a neutral grey gradient, not tied to any country", () => {
		expect(FALLBACK_FLAG).toContain("#888");
		expect(FALLBACK_FLAG).toContain("linear-gradient");
	});
});
