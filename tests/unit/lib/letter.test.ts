import { describe, expect, it } from "vitest";

import { LETTER_COPY, letterHeadline } from "~/lib/letter";

describe("LETTER_COPY", () => {
	it("exposes the open-letter kicker", () => {
		expect(LETTER_COPY.kicker).toBe("An open letter");
	});

	it("keeps the human-readable date and its ISO form in sync", () => {
		// "26 May 2026" must describe the same day as dateISO; the ISO
		// string feeds the <time datetime> attribute on the page.
		expect(LETTER_COPY.dateISO).toBe("2026-05-26");
		expect(new Date(LETTER_COPY.dateISO).toISOString().startsWith("2026-05-26")).toBe(true);
	});

	it("subtitle names the three lead themes from the prototype", () => {
		expect(LETTER_COPY.subtitle).toContain("fairness");
		expect(LETTER_COPY.subtitle).toContain("belonging");
		expect(LETTER_COPY.subtitle).toContain("friendship");
	});
});

describe("letterHeadline", () => {
	it("templates the voice count into the headline", () => {
		expect(letterHeadline(247)).toBe("From 247 young people to FIFA");
	});

	it("renders cleanly at the campaign-launch zero state", () => {
		expect(letterHeadline(0)).toBe("From 0 young people to FIFA");
	});

	it("applies the en-US thousands separator above 999", () => {
		expect(letterHeadline(1247)).toBe("From 1,247 young people to FIFA");
	});
});
