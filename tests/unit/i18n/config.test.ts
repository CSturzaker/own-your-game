import { describe, expect, it } from "vitest";

import {
	DEFAULT_LOCALE,
	isLocale,
	isRtl,
	LOCALES,
	NON_DEFAULT_LOCALES,
	resolveLocale,
	RTL_LOCALES,
} from "~/i18n/config";

describe("i18n config", () => {
	it("ships the five launch locales with English as the default", () => {
		expect(LOCALES).toEqual(["en", "es", "fr", "ar", "pt"]);
		expect(DEFAULT_LOCALE).toBe("en");
	});

	it("derives the non-default locales by removing the default", () => {
		expect(NON_DEFAULT_LOCALES).toEqual(["es", "fr", "ar", "pt"]);
		expect(NON_DEFAULT_LOCALES).not.toContain(DEFAULT_LOCALE);
	});

	it("treats only Arabic as right-to-left", () => {
		expect(RTL_LOCALES).toEqual(["ar"]);
		expect(isRtl("ar")).toBe(true);
		for (const locale of ["en", "es", "fr", "pt"]) {
			expect(isRtl(locale)).toBe(false);
		}
		// Unknown input resolves to the (LTR) default.
		expect(isRtl(undefined)).toBe(false);
		expect(isRtl("xx")).toBe(false);
	});

	describe("isLocale", () => {
		it("accepts known locales", () => {
			for (const locale of LOCALES) expect(isLocale(locale)).toBe(true);
		});

		it("rejects unknown values and undefined", () => {
			expect(isLocale("en-GB")).toBe(false);
			expect(isLocale("de")).toBe(false);
			expect(isLocale(undefined)).toBe(false);
			expect(isLocale("")).toBe(false);
		});
	});

	describe("resolveLocale", () => {
		it("returns the input when it's a known locale", () => {
			expect(resolveLocale("es")).toBe("es");
			expect(resolveLocale("ar")).toBe("ar");
		});

		it("falls back to the default for unknown or missing input", () => {
			expect(resolveLocale(undefined)).toBe("en");
			expect(resolveLocale("en-GB")).toBe("en");
			expect(resolveLocale("klingon")).toBe("en");
		});
	});
});
