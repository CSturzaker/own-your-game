import { describe, expect, it } from "vitest";

import { localeFromPath, localiseUrl } from "~/i18n/localise-url";

describe("localiseUrl", () => {
	describe("adding a prefix from the default locale", () => {
		it("prefixes a nested path", () => {
			expect(localiseUrl("/letter", "es")).toBe("/es/letter");
			expect(localiseUrl("/squad", "fr")).toBe("/fr/squad");
			expect(localiseUrl("/about", "pt")).toBe("/pt/about");
		});

		it("prefixes the root path", () => {
			expect(localiseUrl("/", "es")).toBe("/es");
			expect(localiseUrl("/", "ar")).toBe("/ar");
		});

		it("prefixes a deep path", () => {
			expect(localiseUrl("/voice/abc", "es")).toBe("/es/voice/abc");
		});
	});

	describe("re-targeting an already-prefixed path", () => {
		it("swaps one non-default locale for another", () => {
			expect(localiseUrl("/es/letter", "fr")).toBe("/fr/letter");
			expect(localiseUrl("/ar/squad", "pt")).toBe("/pt/squad");
		});

		it("swaps the root of a prefixed locale", () => {
			expect(localiseUrl("/es", "fr")).toBe("/fr");
			expect(localiseUrl("/ar", "es")).toBe("/es");
		});

		it("is idempotent when the target matches the source", () => {
			expect(localiseUrl("/es/letter", "es")).toBe("/es/letter");
			expect(localiseUrl("/letter", "en")).toBe("/letter");
		});
	});

	describe("stripping back to the default locale", () => {
		it("removes a non-default prefix", () => {
			expect(localiseUrl("/es/letter", "en")).toBe("/letter");
			expect(localiseUrl("/ar/squad", "en")).toBe("/squad");
		});

		it("removes a prefix from the localised root", () => {
			expect(localiseUrl("/es", "en")).toBe("/");
			expect(localiseUrl("/ar", "en")).toBe("/");
		});
	});

	describe("preserving query strings and hashes", () => {
		it("keeps a query string", () => {
			expect(localiseUrl("/squad?theme=friendship", "es")).toBe("/es/squad?theme=friendship");
		});

		it("keeps a hash", () => {
			expect(localiseUrl("/squad#by-country", "fr")).toBe("/fr/squad#by-country");
		});

		it("keeps both query and hash", () => {
			expect(localiseUrl("/voice/abc?from=squad&theme=joy#top", "es")).toBe(
				"/es/voice/abc?from=squad&theme=joy#top",
			);
		});

		it("preserves the suffix when stripping back to default", () => {
			expect(localiseUrl("/es/squad?theme=friendship", "en")).toBe("/squad?theme=friendship");
		});

		it("preserves a bare query on the root", () => {
			expect(localiseUrl("/?ref=x", "es")).toBe("/es?ref=x");
		});
	});

	describe("edge cases", () => {
		it("treats an unknown target locale as the default (no prefix)", () => {
			expect(localiseUrl("/letter", "de")).toBe("/letter");
			expect(localiseUrl("/es/letter", "de")).toBe("/letter");
		});

		it("does not treat a non-leading locale-looking segment as a prefix", () => {
			expect(localiseUrl("/about/es", "fr")).toBe("/fr/about/es");
		});

		it("does not strip the default locale code (it never appears as a prefix)", () => {
			// '/en/...' is not a real route, but if one is passed the 'en'
			// segment is left intact rather than silently removed.
			expect(localiseUrl("/en/letter", "es")).toBe("/es/en/letter");
		});

		it("covers the full source × target matrix for a nested path", () => {
			const sources = {
				en: "/letter",
				es: "/es/letter",
				fr: "/fr/letter",
				ar: "/ar/letter",
				pt: "/pt/letter",
			};
			const expected = {
				en: "/letter",
				es: "/es/letter",
				fr: "/fr/letter",
				ar: "/ar/letter",
				pt: "/pt/letter",
			};
			for (const from of Object.values(sources)) {
				for (const [target, want] of Object.entries(expected)) {
					expect(localiseUrl(from, target)).toBe(want);
				}
			}
		});
	});
});

describe("localeFromPath", () => {
	it("reads a non-default locale from the leading segment", () => {
		expect(localeFromPath("/es/letter")).toBe("es");
		expect(localeFromPath("/ar")).toBe("ar");
		expect(localeFromPath("/pt/squad?theme=joy")).toBe("pt");
	});

	it("returns the default locale for unprefixed paths", () => {
		expect(localeFromPath("/letter")).toBe("en");
		expect(localeFromPath("/")).toBe("en");
		expect(localeFromPath("/about/es")).toBe("en");
	});
});
