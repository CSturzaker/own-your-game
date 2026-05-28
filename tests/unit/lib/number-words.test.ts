import { describe, expect, it } from "vitest";

import { numberToWords } from "~/lib/number-words";

describe("numberToWords", () => {
	it("spells single digits and zero", () => {
		expect(numberToWords(0)).toBe("zero");
		expect(numberToWords(3)).toBe("three");
		expect(numberToWords(9)).toBe("nine");
	});

	it("spells the teens", () => {
		expect(numberToWords(11)).toBe("eleven");
		expect(numberToWords(19)).toBe("nineteen");
	});

	it("hyphenates compound tens", () => {
		expect(numberToWords(20)).toBe("twenty");
		expect(numberToWords(42)).toBe("forty-two");
		expect(numberToWords(99)).toBe("ninety-nine");
	});

	it("uses British 'and' within hundreds", () => {
		expect(numberToWords(100)).toBe("one hundred");
		expect(numberToWords(105)).toBe("one hundred and five");
		expect(numberToWords(247)).toBe("two hundred and forty-seven");
		expect(numberToWords(350)).toBe("three hundred and fifty");
	});

	it("handles thousands", () => {
		expect(numberToWords(1000)).toBe("one thousand");
		expect(numberToWords(1005)).toBe("one thousand and five");
		expect(numberToWords(1200)).toBe("one thousand two hundred");
		expect(numberToWords(2347)).toBe("two thousand three hundred and forty-seven");
	});

	it("falls back to the numeral for invalid input", () => {
		expect(numberToWords(-1)).toBe("-1");
		expect(numberToWords(Number.NaN)).toBe("NaN");
	});

	it("floors non-integer input", () => {
		expect(numberToWords(3.9)).toBe("three");
	});
});
