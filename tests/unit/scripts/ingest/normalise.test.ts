import { describe, expect, it } from "vitest";

import {
	checkConsent,
	coerceAge,
	lookupKey,
	makeVoiceId,
	normaliseQuote,
	proposeFirstName,
	resolveCountry,
	resolveLanguage,
	slugify,
} from "../../../../scripts/ingest/normalise";

describe("lookupKey", () => {
	it("strips diacritics, punctuation, and whitespace", () => {
		expect(lookupKey("Côte d’Ivoire ")).toBe("cotedivoire");
		expect(lookupKey("Viet Nam")).toBe("vietnam");
		expect(lookupKey("  English  ")).toBe("english");
	});
});

describe("resolveCountry", () => {
	it("maps every country in the intake data, tolerating accents and whitespace", () => {
		expect(resolveCountry("Egypt")).toEqual({ ok: true, value: "EG" });
		expect(resolveCountry("Viet Nam")).toEqual({ ok: true, value: "VN" });
		expect(resolveCountry("Côte d’Ivoire")).toEqual({ ok: true, value: "CI" });
		expect(resolveCountry("Ecuador ")).toEqual({ ok: true, value: "EC" });
	});

	it("reports blanks and unknown countries instead of guessing", () => {
		expect(resolveCountry("")).toMatchObject({ ok: false });
		expect(resolveCountry("Atlantis")).toMatchObject({ ok: false });
	});
});

describe("resolveLanguage", () => {
	it("maps full names to BCP 47 tags", () => {
		expect(resolveLanguage("Spanish")).toEqual({ ok: true, value: "es" });
		expect(resolveLanguage("Arabic ")).toEqual({ ok: true, value: "ar" });
		expect(resolveLanguage("Slovenian")).toEqual({ ok: true, value: "sl" });
		expect(resolveLanguage("Vietnamese")).toEqual({ ok: true, value: "vi" });
	});

	it("maps Filipino and Tagalog to the BCP 47 tag 'fil'", () => {
		expect(resolveLanguage("Filipino")).toEqual({ ok: true, value: "fil" });
		expect(resolveLanguage("Tagalog")).toEqual({ ok: true, value: "fil" });
	});

	it("defaults 'English and Shona' to en with a note (open question #2)", () => {
		const r = resolveLanguage("English and Shona");
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.value).toBe("en");
			expect(r.note).toBeDefined();
		}
	});

	it("reports a blank language", () => {
		expect(resolveLanguage("")).toMatchObject({ ok: false });
	});
});

describe("proposeFirstName", () => {
	it("takes the first token and does not flag a single-token name", () => {
		expect(proposeFirstName("Ahmed")).toMatchObject({
			firstName: "Ahmed",
			needsReview: false,
			givenNameLast: false,
		});
	});

	it("takes the first token of a multi-token name and flags it for review", () => {
		const r = proposeFirstName("Yamal Julián Pino Villan");
		expect(r.firstName).toBe("Yamal");
		expect(r.needsReview).toBe(true);
		expect(r.tokens).toHaveLength(4);
	});

	it("takes the LAST token for given-name-last (Vietnamese) names, still flagged", () => {
		const r = proposeFirstName("Phạm Thị Minh Thu", { givenNameLast: true });
		expect(r.firstName).toBe("Thu");
		expect(r.needsReview).toBe(true);
		expect(r.givenNameLast).toBe(true);
	});

	it("yields an empty firstName for a blank name (caller blocks it)", () => {
		expect(proposeFirstName("   ").firstName).toBe("");
	});
});

describe("slugify / makeVoiceId", () => {
	it("produces URL-safe slugs without diacritics", () => {
		expect(slugify("Agustín")).toBe("agustin");
		expect(slugify("Côte d’Ivoire")).toBe("cote-d-ivoire");
	});

	it("builds a 3-digit zero-padded id matching the campaign convention", () => {
		expect(makeVoiceId("mariam", "EG", 1)).toBe("mariam-eg-001");
		expect(makeVoiceId("carlos", "BR", 2)).toBe("carlos-br-002");
		expect(makeVoiceId("amina", "KE", 12)).toBe("amina-ke-012");
	});
});

describe("normaliseQuote", () => {
	it("strips wrapping straight and curly quotes", () => {
		expect(normaliseQuote('"Football is passion."')).toBe("Football is passion.");
		expect(normaliseQuote("“Football is passion.”")).toBe("Football is passion.");
	});

	it("leaves an unwrapped quote untouched apart from trimming", () => {
		expect(normaliseQuote("  Football is passion.  ")).toBe("Football is passion.");
	});
});

describe("checkConsent", () => {
	it("accepts yes case- and whitespace-insensitively, rejects everything else", () => {
		expect(checkConsent("Yes")).toBe(true);
		expect(checkConsent(" yes ")).toBe(true);
		expect(checkConsent("")).toBe(false);
		expect(checkConsent("no")).toBe(false);
		expect(checkConsent("y")).toBe(false);
	});
});

describe("coerceAge", () => {
	it("coerces only whole-number strings (no range gate — any integer)", () => {
		expect(coerceAge("18")).toBe(18);
		expect(coerceAge("9")).toBe(9);
		expect(coerceAge("99")).toBe(99);
		expect(coerceAge("")).toBeNull();
		expect(coerceAge("14.5")).toBeNull();
		expect(coerceAge("fourteen")).toBeNull();
	});
});
