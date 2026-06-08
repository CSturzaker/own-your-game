import { describe, expect, it } from "vitest";

import { LOCALES } from "~/i18n/config";
import {
	DEFAULT_OG_IMAGE,
	ogLocale,
	ogLocaleAlternates,
	resolveCanonical,
	resolveOgImage,
} from "~/lib/seo";

describe("resolveOgImage", () => {
	it("falls back to the default path when no input is provided", () => {
		expect(resolveOgImage(undefined)).toBe(DEFAULT_OG_IMAGE);
	});

	it("returns a root-relative path unchanged when site is unknown", () => {
		expect(resolveOgImage("/og/letter.png")).toBe("/og/letter.png");
	});

	it("upgrades a root-relative path to an absolute URL when site is provided", () => {
		const site = new URL("https://ownyour.game/");
		expect(resolveOgImage("/og/letter.png", site)).toBe("https://ownyour.game/og/letter.png");
	});

	it("upgrades the default path against site for crawler compatibility", () => {
		const site = new URL("https://ownyour.game/");
		expect(resolveOgImage(undefined, site)).toBe(`https://ownyour.game${DEFAULT_OG_IMAGE}`);
	});

	it("returns absolute http(s) URLs untouched even when site is provided", () => {
		const site = new URL("https://ownyour.game/");
		expect(resolveOgImage("https://cdn.example.com/og.png", site)).toBe(
			"https://cdn.example.com/og.png",
		);
		expect(resolveOgImage("http://cdn.example.com/og.png", site)).toBe(
			"http://cdn.example.com/og.png",
		);
	});
});

describe("ogLocale", () => {
	it("maps each route locale to its language_TERRITORY form", () => {
		expect(ogLocale("en")).toBe("en_GB");
		expect(ogLocale("es")).toBe("es_ES");
		expect(ogLocale("fr")).toBe("fr_FR");
		expect(ogLocale("ar")).toBe("ar_AR");
		expect(ogLocale("pt")).toBe("pt_BR");
	});

	it("has a mapping for every routed locale", () => {
		for (const locale of LOCALES) {
			expect(ogLocale(locale)).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
		}
	});
});

describe("ogLocaleAlternates", () => {
	it("lists every other locale's OG form, excluding the current one", () => {
		expect(ogLocaleAlternates("en")).toEqual(["es_ES", "fr_FR", "ar_AR", "pt_BR"]);
		expect(ogLocaleAlternates("ar")).toEqual(["en_GB", "es_ES", "fr_FR", "pt_BR"]);
	});

	it("always returns one fewer than the locale count", () => {
		for (const locale of LOCALES) {
			const alts = ogLocaleAlternates(locale);
			expect(alts).toHaveLength(LOCALES.length - 1);
			expect(alts).not.toContain(ogLocale(locale));
		}
	});
});

describe("resolveCanonical", () => {
	const site = new URL("https://ownyour.game/");

	it("origin-qualifies the pathname when site is provided", () => {
		expect(resolveCanonical(new URL("https://ownyour.game/letter/"), site)).toBe(
			"https://ownyour.game/letter/",
		);
	});

	it("drops query string and hash so variants share one canonical", () => {
		expect(resolveCanonical(new URL("https://ownyour.game/squad/?country=KE#x"), site)).toBe(
			"https://ownyour.game/squad/",
		);
	});

	it("falls back to the bare pathname when site is unknown", () => {
		expect(resolveCanonical(new URL("https://whatever.test/about/?q=1"))).toBe("/about/");
	});
});
