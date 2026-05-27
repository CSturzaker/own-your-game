import { describe, expect, it } from "vitest";

import { HOME_COPY, ctaSquadLabel } from "~/lib/home";

describe("HOME_COPY", () => {
	it("exposes the desktop kicker that includes the World Cup suffix", () => {
		expect(HOME_COPY.kickerDesktop).toBe("An open letter · 2026 World Cup");
	});

	it("exposes a shorter mobile kicker that drops the World Cup suffix", () => {
		expect(HOME_COPY.kickerMobile).toBe("An open letter · 2026");
	});

	it("uses the campaign tagline verbatim — referenced by other pages too", () => {
		expect(HOME_COPY.tagline).toBe("Whose game is it anyway?");
	});

	it("primary CTA label matches the prototype", () => {
		expect(HOME_COPY.ctaLetter).toBe("Read the letter");
	});
});

describe("ctaSquadLabel", () => {
	it("templates the voice count into the ghost CTA label", () => {
		expect(ctaSquadLabel(247)).toBe("Meet all 247");
	});

	it("renders cleanly with a zero count — campaign at-launch state", () => {
		expect(ctaSquadLabel(0)).toBe("Meet all 0");
	});

	it("applies the en-US thousands separator for counts above 999", () => {
		expect(ctaSquadLabel(1247)).toBe("Meet all 1,247");
	});
});
