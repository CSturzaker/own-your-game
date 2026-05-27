import { describe, expect, it } from "vitest";

import { FALLBACK_FLAG, flagGradient, hasFlag } from "~/lib/flags";

describe("flagGradient", () => {
	it("maps the prototype countries to their gradient stripes", () => {
		expect(flagGradient("NGA")).toContain("#008751");
		expect(flagGradient("BRA")).toContain("#009c3b");
		expect(flagGradient("ITA")).toContain("#009246");
	});

	it("is case-insensitive on the country code", () => {
		expect(flagGradient("nga")).toBe(flagGradient("NGA"));
		expect(flagGradient("Nga")).toBe(flagGradient("NGA"));
	});

	it("returns the neutral fallback for unknown codes", () => {
		expect(flagGradient("XXX")).toBe(FALLBACK_FLAG);
		expect(flagGradient("")).toBe(FALLBACK_FLAG);
	});
});

describe("hasFlag", () => {
	it("returns true for mapped codes regardless of case", () => {
		expect(hasFlag("NGA")).toBe(true);
		expect(hasFlag("nga")).toBe(true);
	});

	it("returns false for unmapped codes", () => {
		expect(hasFlag("TUV")).toBe(false);
		expect(hasFlag("")).toBe(false);
	});
});
