import { describe, expect, it } from "vitest";

import { resolveSwipe } from "~/lib/swipe";

describe("resolveSwipe", () => {
	it("maps swipe direction to reading order in LTR", () => {
		expect(resolveSwipe(-120, 0, { dir: "ltr" })).toBe("next");
		expect(resolveSwipe(120, 0, { dir: "ltr" })).toBe("previous");
	});

	it("reverses the mapping in RTL (swipe-right is next)", () => {
		expect(resolveSwipe(-120, 0, { dir: "rtl" })).toBe("previous");
		expect(resolveSwipe(120, 0, { dir: "rtl" })).toBe("next");
	});

	it("defaults to LTR when no dir is given", () => {
		expect(resolveSwipe(-120, 0)).toBe("next");
		expect(resolveSwipe(120, 0)).toBe("previous");
	});

	it("returns null below the distance threshold", () => {
		expect(resolveSwipe(-60, 0)).toBeNull();
		expect(resolveSwipe(60, 0)).toBeNull();
	});

	it("honours a custom threshold", () => {
		expect(resolveSwipe(-90, 0, { threshold: 100 })).toBeNull();
		expect(resolveSwipe(-120, 0, { threshold: 100 })).toBe("next");
	});

	it("rejects a too-vertical drag (a scroll, not a swipe)", () => {
		// |deltaY| beyond ~30° of horizontal → not a swipe.
		expect(resolveSwipe(-120, 100, { dir: "ltr" })).toBeNull();
	});

	it("accepts a shallow drift within ~30°", () => {
		// 120px across, 40px down → ~18°, comfortably within tolerance.
		expect(resolveSwipe(-120, 40, { dir: "ltr" })).toBe("next");
	});
});
