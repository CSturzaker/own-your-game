import { describe, expect, it } from "vitest";

import { WHY_THIS_COPY, whyThisParagraph2 } from "~/lib/why-this";

describe("WHY_THIS_COPY", () => {
	it("exposes the kicker and heading from the prototype", () => {
		expect(WHY_THIS_COPY.kicker).toBe("Why this letter");
		expect(WHY_THIS_COPY.heading).toBe("The biggest stage. The youngest authors.");
	});

	it("first paragraph carries the 'why now' framing", () => {
		expect(WHY_THIS_COPY.paragraph1).toMatch(/Every four years/);
	});

	it("about link label matches the prototype", () => {
		expect(WHY_THIS_COPY.aboutLinkLabel).toBe("Read more about the project");
	});
});

describe("whyThisParagraph2", () => {
	it("templates the voice count and country count into the sentence", () => {
		const text = whyThisParagraph2(247, 21);
		expect(text).toContain("247 young people across 21 countries");
		expect(text).toContain("wrote, recorded, and signed");
	});

	it("formats large counts with the en-US thousands separator", () => {
		expect(whyThisParagraph2(1247, 42)).toContain("1,247 young people across 42 countries");
	});

	it("renders cleanly at the campaign-launch low end", () => {
		const text = whyThisParagraph2(3, 3);
		expect(text).toContain("3 young people across 3 countries");
	});
});
