import { describe, expect, it } from "vitest";

import { slideOffset } from "~/lib/player-transition";

describe("slideOffset", () => {
	it("enters from the right for next, the left for previous (LTR)", () => {
		expect(slideOffset(true)).toBe(24);
		expect(slideOffset(false)).toBe(-24);
	});

	it("reverses the entering edge under RTL", () => {
		expect(slideOffset(true, { rtl: true })).toBe(-24);
		expect(slideOffset(false, { rtl: true })).toBe(24);
	});

	it("honours a custom distance", () => {
		expect(slideOffset(true, { distance: 40 })).toBe(40);
		expect(slideOffset(false, { rtl: true, distance: 40 })).toBe(40);
	});
});
