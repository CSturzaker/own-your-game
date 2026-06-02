import { describe, expect, it } from "vitest";

import { interpolate } from "~/i18n/interpolate";

describe("interpolate", () => {
	it("returns the template unchanged when there are no vars", () => {
		expect(interpolate("Hello world")).toBe("Hello world");
		expect(interpolate("Hello world", {})).toBe("Hello world");
	});

	it("substitutes a single placeholder", () => {
		expect(interpolate("Load {count} more", { count: 24 })).toBe("Load 24 more");
	});

	it("substitutes multiple placeholders", () => {
		expect(interpolate("Showing {shown} of {total} voices", { shown: 24, total: 56 })).toBe(
			"Showing 24 of 56 voices",
		);
	});

	it("accepts string and number values", () => {
		expect(interpolate("{a} and {b}", { a: "x", b: 2 })).toBe("x and 2");
	});

	it("leaves an unmatched placeholder intact rather than blanking it", () => {
		expect(interpolate("Hi {name}", { other: "x" })).toBe("Hi {name}");
	});

	it("substitutes every occurrence of a repeated placeholder", () => {
		expect(interpolate("{n} + {n}", { n: 3 })).toBe("3 + 3");
	});
});
