import { describe, expect, it } from "vitest";

import { NAV_ITEMS, formatVoiceCount, type ActiveNav } from "~/lib/header";

describe("NAV_ITEMS", () => {
	it("exposes the four primary nav items in the agency-specified order", () => {
		expect(NAV_ITEMS.map((i) => i.id)).toEqual<ActiveNav[]>(["home", "letter", "squad", "about"]);
	});

	it("maps each id to its public URL", () => {
		const byId = Object.fromEntries(NAV_ITEMS.map((i) => [i.id, i.href]));
		expect(byId).toEqual({
			home: "/",
			letter: "/letter",
			squad: "/squad",
			about: "/about",
		});
	});

	it("uses the prototype's English labels", () => {
		const labels = NAV_ITEMS.map((i) => i.label);
		expect(labels).toEqual(["Home", "The Letter", "The Squad", "About"]);
	});
});

describe("formatVoiceCount", () => {
	it("renders small numbers without grouping", () => {
		expect(formatVoiceCount(0)).toBe("0");
		expect(formatVoiceCount(247)).toBe("247");
	});

	it("inserts thousands separators in en-US for larger counts", () => {
		expect(formatVoiceCount(1247)).toBe("1,247");
		expect(formatVoiceCount(1_000_000)).toBe("1,000,000");
	});
});
