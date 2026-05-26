import { describe, expect, it } from "vitest";

/**
 * Smoke test that proves Vitest itself runs, alias resolution would
 * work (this file lives at the configured include path), and that
 * the runner can collect and report. Replace with real specs as the
 * project grows; do not extend this one.
 */

function sum(a: number, b: number): number {
	return a + b;
}

describe("sum", () => {
	it("adds two integers", () => {
		expect(sum(2, 3)).toBe(5);
	});

	it("treats the missing arg as undefined under noUncheckedIndexedAccess", () => {
		// Catches a regression where the alias or strict mode silently
		// breaks: if this test ever passes with NaN, something has
		// changed about how Vitest compiles src.
		expect(sum(2, 3)).not.toBeNaN();
	});
});
