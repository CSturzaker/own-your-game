import { describe, expect, it } from "vitest";

import { LOGO_ALT, LOGO_LINK_LABEL, LOGO_SRC, wordmarkVariant } from "~/lib/wordmark";

describe("LOGO constants", () => {
	it("points at the agency SVG in public/assets", () => {
		expect(LOGO_SRC).toBe("/assets/own-your-game-logo.svg");
	});

	it("uses the campaign name as alt text and a 'home' suffix for the link", () => {
		expect(LOGO_ALT).toBe("Own Your Game");
		expect(LOGO_LINK_LABEL).toBe("Own Your Game — home");
	});
});

describe("wordmarkVariant", () => {
	it("renders header as a link with the responsive 36/48px height pair", () => {
		const v = wordmarkVariant("header");
		expect(v.isLink).toBe(true);
		expect(v.imgClass).toContain("h-9");
		expect(v.imgClass).toContain("lg:h-12");
		expect(v.height).toBeUndefined();
	});

	it("renders footer as a link with a fixed 64px height", () => {
		const v = wordmarkVariant("footer");
		expect(v.isLink).toBe(true);
		expect(v.imgClass).toContain("h-16");
		expect(v.height).toBeUndefined();
	});

	it("renders hero as a plain image at 200px by default", () => {
		const v = wordmarkVariant("hero");
		expect(v.isLink).toBe(false);
		expect(v.height).toBe(200);
	});

	it("honours a consumer-set hero height", () => {
		expect(wordmarkVariant("hero", 120).height).toBe(120);
		expect(wordmarkVariant("hero", 96).height).toBe(96);
	});

	it("ignores a height argument on header/footer variants", () => {
		// Passing height to non-hero sizes is allowed by the signature
		// but must not affect the variant — header and footer are
		// locked to the design tokens via Tailwind utilities.
		expect(wordmarkVariant("header", 999).height).toBeUndefined();
		expect(wordmarkVariant("footer", 999).height).toBeUndefined();
	});
});
