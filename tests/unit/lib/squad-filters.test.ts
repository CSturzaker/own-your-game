import { describe, expect, it } from "vitest";

import {
	applyFilters,
	countryOptions,
	hasActiveFilter,
	languageName,
	languageOptions,
} from "~/lib/squad-filters";
import { SAMPLE_VOICES } from "../../fixtures/voices";

describe("countryOptions", () => {
	it("derives unique countries, sorted by display name", () => {
		const opts = countryOptions(SAMPLE_VOICES);
		const codes = new Set(SAMPLE_VOICES.map((v) => v.countryCode));
		expect(opts).toHaveLength(codes.size);
		// No duplicates.
		expect(new Set(opts.map((o) => o.value)).size).toBe(opts.length);
		// Sorted ascending by label.
		const labels = opts.map((o) => o.label);
		expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
	});

	it("maps codes to country names", () => {
		const opts = countryOptions(SAMPLE_VOICES);
		const ng = opts.find((o) => o.value === "NG");
		expect(ng?.label).toBe("Nigeria");
	});
});

describe("languageOptions / languageName", () => {
	it("resolves BCP 47 tags to English names", () => {
		expect(languageName("en")).toBe("English");
		// Region-qualified tags resolve to a fuller name (engine-dependent
		// wording, but never the raw tag).
		expect(languageName("es-MX")).not.toBe("es-MX");
	});

	it("falls back to the raw tag for a malformed tag", () => {
		// Not a well-formed BCP 47 tag — Intl.DisplayNames throws, and we
		// return the input rather than crashing.
		expect(languageName("@@@")).toBe("@@@");
	});

	it("derives unique languages from the voices", () => {
		const opts = languageOptions(SAMPLE_VOICES);
		const tags = new Set(SAMPLE_VOICES.map((v) => v.language));
		expect(opts).toHaveLength(tags.size);
	});
});

describe("applyFilters", () => {
	it("returns every voice when no filter is set", () => {
		expect(applyFilters(SAMPLE_VOICES, {})).toHaveLength(SAMPLE_VOICES.length);
	});

	it("narrows by a single dimension", () => {
		const arabic = applyFilters(SAMPLE_VOICES, { language: "ar" });
		expect(arabic.length).toBeGreaterThan(0);
		expect(arabic.every((v) => v.language === "ar")).toBe(true);
	});

	it("intersects (AND) across dimensions, not unions", () => {
		const sample = SAMPLE_VOICES[0]!;
		const both = applyFilters(SAMPLE_VOICES, {
			language: sample.language,
			country: sample.countryCode,
		});
		// Every result matches BOTH constraints.
		expect(
			both.every((v) => v.language === sample.language && v.countryCode === sample.countryCode),
		).toBe(true);
		// And the intersection is no larger than either single-dimension set.
		const byLanguage = applyFilters(SAMPLE_VOICES, { language: sample.language });
		expect(both.length).toBeLessThanOrEqual(byLanguage.length);
	});

	it("returns an empty list for an impossible combination", () => {
		const impossible = applyFilters(SAMPLE_VOICES, { country: "ZZ" });
		expect(impossible).toHaveLength(0);
	});
});

describe("hasActiveFilter", () => {
	it("is false for an empty selection", () => {
		expect(hasActiveFilter({})).toBe(false);
	});

	it("is true when any dimension is set", () => {
		expect(hasActiveFilter({ country: "NG" })).toBe(true);
		expect(hasActiveFilter({ language: "ar" })).toBe(true);
	});
});

// The chip labels ("Country: Nigeria", "Language: All") moved into the
// dictionary (DEV-70, `squad.filters.chip*`) and are interpolated in the
// `SquadFilters` island; the option lists above still supply the
// country/language display names the island reuses.
