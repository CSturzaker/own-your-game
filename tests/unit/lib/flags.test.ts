import { describe, expect, it } from "vitest";

import { FALLBACK_FLAG, flagGradient, hasFlag } from "~/lib/flags";

describe("flagGradient", () => {
	it("maps the prototype countries to their gradient stripes", () => {
		expect(flagGradient("NG")).toContain("#008751");
		expect(flagGradient("BR")).toContain("#009c3b");
		expect(flagGradient("IT")).toContain("#009246");
	});

	it("maps ZW (Zimbabwe) to its gradient stripes", () => {
		expect(flagGradient("ZW")).toContain("#006400");
		expect(flagGradient("zw")).toBe(flagGradient("ZW"));
	});

	it("maps LB (Lebanon) and LY (Libya) to their gradient stripes", () => {
		expect(flagGradient("LB")).toContain("#ed1c24");
		expect(flagGradient("LY")).toContain("#239e46");
		expect(flagGradient("LB")).not.toBe(FALLBACK_FLAG);
		expect(flagGradient("LY")).not.toBe(FALLBACK_FLAG);
	});

	it("is case-insensitive on the country code", () => {
		expect(flagGradient("ng")).toBe(flagGradient("NG"));
		expect(flagGradient("Ng")).toBe(flagGradient("NG"));
	});

	it("returns the neutral fallback for unknown codes", () => {
		expect(flagGradient("XX")).toBe(FALLBACK_FLAG);
		expect(flagGradient("")).toBe(FALLBACK_FLAG);
	});
});

describe("hasFlag", () => {
	it("returns true for mapped codes regardless of case", () => {
		expect(hasFlag("NG")).toBe(true);
		expect(hasFlag("ng")).toBe(true);
		expect(hasFlag("ZW")).toBe(true);
		expect(hasFlag("zw")).toBe(true);
	});

	it("returns false for unmapped codes", () => {
		expect(hasFlag("TV")).toBe(false);
		expect(hasFlag("")).toBe(false);
	});
});
