import { describe, expect, it } from "vitest";

import { languageName } from "~/lib/languages";

describe("languageName", () => {
	it("resolves a plain BCP 47 tag to its English name", () => {
		expect(languageName("es")).toBe("Spanish");
		expect(languageName("ar")).toBe("Arabic");
	});

	it("resolves a region-qualified tag", () => {
		// e.g. "es-MX" → "Mexican Spanish" via Intl.DisplayNames.
		expect(languageName("es-MX")).toMatch(/spanish/i);
	});

	it("falls back to the tag itself for an unassigned but well-formed tag", () => {
		expect(languageName("zz")).toBe("zz");
	});

	it("falls back to the tag itself when Intl throws on a malformed tag", () => {
		// A single-letter subtag is structurally invalid — Intl.DisplayNames
		// throws a RangeError, which the helper must swallow.
		expect(languageName("a")).toBe("a");
	});
});
