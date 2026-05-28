import { describe, expect, it } from "vitest";

import {
	ageChipLabel,
	countryChipLabel,
	countryOptions,
	hasActiveFilter,
	languageChipLabel,
	languageName,
	languageOptions,
	themeChipLabel,
	themeOptions,
} from "~/lib/squad-filters";
import { SAMPLE_VOICES } from "../../fixtures/voices";

describe("themeOptions", () => {
	it("lists all six themes, title-cased", () => {
		const opts = themeOptions();
		expect(opts).toHaveLength(6);
		expect(opts.map((o) => o.value)).toContain("friendship");
		expect(opts.find((o) => o.value === "friendship")?.label).toBe("Friendship");
	});
});

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

describe("hasActiveFilter", () => {
	it("is false for an empty selection", () => {
		expect(hasActiveFilter({})).toBe(false);
	});

	it("is true when any dimension is set, including age 11", () => {
		expect(hasActiveFilter({ theme: "fairness" })).toBe(true);
		expect(hasActiveFilter({ age: 11 })).toBe(true);
		expect(hasActiveFilter({ country: "NG" })).toBe(true);
	});
});

describe("chip labels", () => {
	it("show 'All' when unset and the value when set", () => {
		expect(themeChipLabel(undefined)).toBe("Theme: All");
		expect(themeChipLabel("friendship")).toBe("Theme: Friendship");
		expect(countryChipLabel(undefined)).toBe("Country: All");
		expect(countryChipLabel("NG")).toBe("Country: Nigeria");
		expect(languageChipLabel(undefined)).toBe("Language: All");
		expect(ageChipLabel(undefined)).toBe("Age: All");
		expect(ageChipLabel(14)).toBe("Age: 14");
	});
});
