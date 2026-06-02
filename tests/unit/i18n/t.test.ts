import { describe, expect, it } from "vitest";

import type { Locale } from "~/i18n/config";
import { makeT } from "~/i18n/astro";
import { createTranslator, t, tList, TODO_MARKER, type Dictionary } from "~/i18n/t";

describe("t (real dictionaries)", () => {
	it("returns the English string for the default locale", () => {
		expect(t("header.nav.home", "en")).toBe("Home");
		expect(t("tagline.question", "en")).toBe("Whose game is it anyway?");
	});

	it("returns the delivered translation for a locale", () => {
		expect(t("tagline.question", "es")).toBe("¿De quién es este juego?");
		expect(t("home.startingEleven.kicker", "fr")).toBe("LES ONZE DU JOUR");
		expect(t("about.answer", "ar")).toBe("إنها لنا.");
	});

	it("substitutes {var} placeholders", () => {
		expect(t("home.ctaSquad", "en", { count: "247" })).toBe("Meet all 247");
		expect(t("letter.headline", "en", { count: "1,024" })).toBe("From 1,024 young people to FIFA");
	});

	it("throws on a key missing from English too", () => {
		expect(() => t("does.not.exist", "en")).toThrow(/Missing i18n string/);
	});
});

describe("tList (real dictionaries)", () => {
	it("returns the English array for the default locale", () => {
		expect(tList("about.body", "en")).toHaveLength(5);
		expect(tList("about.closing", "en")).toHaveLength(2);
	});

	it("returns the translated array for a locale", () => {
		const esBody = tList("about.body", "es");
		expect(esBody).toHaveLength(5);
		expect(esBody[0]).toContain("Fix My Food");
	});

	it("throws on a key with no array anywhere", () => {
		expect(() => tList("header.nav.home", "en")).toThrow(/Missing i18n list/);
	});
});

describe("fallback + TODO sentinel (synthetic dictionaries)", () => {
	// The shipped dictionaries are currently fully translated, so the
	// fallback path can't be exercised through them. A synthetic set keeps
	// that behaviour under test independent of translation completeness.
	const empty: Record<Locale, Dictionary> = { en: {}, es: {}, fr: {}, ar: {}, pt: {} };
	const dicts: Record<Locale, Dictionary> = {
		...empty,
		en: { greeting: "Hello", who: { name: "World" }, list: ["a", "b"] },
		// `who.name` is stubbed and `list` carries the sentinel instead of
		// an array — both should fall back to English.
		es: { greeting: "Hola", who: { name: TODO_MARKER }, list: TODO_MARKER },
	};
	const { t: tx, tList: txList } = createTranslator(dicts);

	it("returns the locale value when it is translated", () => {
		expect(tx("greeting", "es")).toBe("Hola");
	});

	it("falls back to English when the locale value is the TODO sentinel", () => {
		expect(tx("who.name", "es")).toBe("World");
	});

	it("falls back to English when the key is missing in the locale", () => {
		expect(tx("greeting", "fr")).toBe("Hello");
	});

	it("falls back to the English array when a locale stubs the list", () => {
		expect(txList("list", "es")).toEqual(["a", "b"]);
	});
});

describe("makeT", () => {
	it("binds t and tList to a resolved locale", () => {
		const { t: tEs, tList: tListEs, locale } = makeT("es");
		expect(locale).toBe("es");
		expect(tEs("tagline.question")).toBe("¿De quién es este juego?");
		expect(tListEs("about.body")).toHaveLength(5);
	});

	it("resolves an unknown locale to the default", () => {
		const { locale, t: tX } = makeT("xx");
		expect(locale).toBe("en");
		expect(tX("header.share")).toBe("Share");
	});
});
