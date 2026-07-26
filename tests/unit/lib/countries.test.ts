import { describe, expect, it } from "vitest";

import { COUNTRY_NAMES, countryName, hasCountryName } from "~/lib/countries";

describe("countryName", () => {
	it("maps the prototype countries to their English display names", () => {
		expect(countryName("KE")).toBe("Kenya");
		expect(countryName("NG")).toBe("Nigeria");
		expect(countryName("BR")).toBe("Brazil");
		expect(countryName("US")).toBe("United States");
	});

	it("maps every country currently present in voices.json", () => {
		expect(countryName("EG")).toBe("Egypt");
		expect(countryName("KE")).toBe("Kenya");
		expect(countryName("LB")).toBe("Lebanon");
		expect(countryName("LY")).toBe("Libya");
		expect(countryName("MA")).toBe("Morocco");
		expect(countryName("ZW")).toBe("Zimbabwe");
	});

	it("maps the newly added countries", () => {
		expect(countryName("CI")).toBe("Côte d’Ivoire");
		expect(countryName("EC")).toBe("Ecuador");
		expect(countryName("FJ")).toBe("Fiji");
		expect(countryName("GT")).toBe("Guatemala");
		expect(countryName("ID")).toBe("Indonesia");
		expect(countryName("MN")).toBe("Mongolia");
		expect(countryName("PH")).toBe("Philippines");
		expect(countryName("SI")).toBe("Slovenia");
		expect(countryName("KH")).toBe("Cambodia");
		expect(countryName("PK")).toBe("Pakistan");
		expect(countryName("ZA")).toBe("South Africa");
	});

	it("is case-insensitive on input", () => {
		expect(countryName("ke")).toBe("Kenya");
		expect(countryName("Ke")).toBe("Kenya");
	});

	it("falls back to the uppercased code for unknown countries", () => {
		expect(countryName("xx")).toBe("XX");
		expect(countryName("")).toBe("");
	});
});

describe("hasCountryName", () => {
	it("returns true for mapped codes regardless of case", () => {
		expect(hasCountryName("KE")).toBe(true);
		expect(hasCountryName("ke")).toBe(true);
	});

	it("returns false for unmapped codes", () => {
		expect(hasCountryName("XX")).toBe(false);
		expect(hasCountryName("")).toBe(false);
	});

	it("every key in COUNTRY_NAMES is a valid alpha-2 code", () => {
		for (const code of Object.keys(COUNTRY_NAMES)) {
			expect(code).toMatch(/^[A-Z]{2}$/);
		}
	});
});
