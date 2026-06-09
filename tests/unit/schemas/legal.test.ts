import { describe, expect, it } from "vitest";

import { LEGAL_SLUGS, legalFrontmatterSchema } from "../../../schemas/legal";

const VALID = {
	title: "Privacy Notice",
	lastUpdated: "June 2026",
	lang: "en",
	slug: "privacy",
} as const;

describe("legalFrontmatterSchema", () => {
	it("accepts a valid frontmatter block", () => {
		const result = legalFrontmatterSchema.safeParse(VALID);
		expect(result.success).toBe(true);
	});

	it("exposes the three document slugs", () => {
		expect(LEGAL_SLUGS).toEqual(["privacy", "terms", "accessibility"]);
	});

	it("rejects an unknown slug", () => {
		const result = legalFrontmatterSchema.safeParse({ ...VALID, slug: "cookies" });
		expect(result.success).toBe(false);
	});

	it("rejects an unknown lang", () => {
		const result = legalFrontmatterSchema.safeParse({ ...VALID, lang: "de" });
		expect(result.success).toBe(false);
	});

	it("requires a non-empty title", () => {
		expect(legalFrontmatterSchema.safeParse({ ...VALID, title: "" }).success).toBe(false);
		const { title: _title, ...withoutTitle } = VALID;
		expect(legalFrontmatterSchema.safeParse(withoutTitle).success).toBe(false);
	});

	it("requires a non-empty lastUpdated", () => {
		expect(legalFrontmatterSchema.safeParse({ ...VALID, lastUpdated: "" }).success).toBe(false);
		const { lastUpdated: _lastUpdated, ...withoutDate } = VALID;
		expect(legalFrontmatterSchema.safeParse(withoutDate).success).toBe(false);
	});
});
