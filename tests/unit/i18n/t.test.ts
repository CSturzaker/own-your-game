import { describe, expect, it } from "vitest";

import { makeT } from "~/i18n/astro";
import { t, tList } from "~/i18n/t";

describe("t", () => {
	it("returns the English string for the default locale", () => {
		expect(t("header.nav.home", "en")).toBe("Home");
		expect(t("tagline.question", "en")).toBe("Whose game is it anyway?");
	});

	it("returns a delivered translation when present", () => {
		expect(t("tagline.question", "es")).toBe("¿De quién es este juego?");
		expect(t("home.startingEleven.kicker", "fr")).toBe("LES ONZE DU JOUR");
	});

	it("falls back to English for an untranslated (TODO) key", () => {
		// es has not translated the header nav yet — should show English.
		expect(t("header.nav.home", "es")).toBe("Home");
		expect(t("header.share", "ar")).toBe("Share");
	});

	it("substitutes {var} placeholders", () => {
		expect(t("home.ctaSquad", "en", { count: "247" })).toBe("Meet all 247");
		expect(t("letter.headline", "en", { count: "1,024" })).toBe("From 1,024 young people to FIFA");
	});

	it("throws on a key missing from English too", () => {
		expect(() => t("does.not.exist", "en")).toThrow(/Missing i18n string/);
	});
});

describe("tList", () => {
	it("returns the English array for the default locale", () => {
		expect(tList("about.body", "en")).toHaveLength(5);
		expect(tList("about.closing", "en")).toHaveLength(2);
	});

	it("returns the translated array when delivered", () => {
		const esBody = tList("about.body", "es");
		expect(esBody).toHaveLength(5);
		expect(esBody[0]).toContain("Fix My Food");
	});

	it("falls back to the English array when a locale stubs the list", () => {
		// pt stubs about.body as the marker string, not an array.
		expect(tList("about.body", "pt")).toEqual(tList("about.body", "en"));
	});

	it("throws on a key with no array anywhere", () => {
		expect(() => tList("header.nav.home", "en")).toThrow(/Missing i18n list/);
	});
});

describe("makeT", () => {
	it("binds t and tList to a resolved locale", () => {
		const { t: tEs, tList: tListEs, locale } = makeT("es");
		expect(locale).toBe("es");
		expect(tEs("tagline.question")).toBe("¿De quién es este juego?");
		expect(tEs("header.nav.home")).toBe("Home"); // English fallback
		expect(tListEs("about.body")).toHaveLength(5);
	});

	it("resolves an unknown locale to the default", () => {
		const { locale, t: tX } = makeT("xx");
		expect(locale).toBe("en");
		expect(tX("header.share")).toBe("Share");
	});
});
