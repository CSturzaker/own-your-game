import { describe, expect, it } from "vitest";

import { FOOTER_COLUMNS, LANGUAGES, META_LINKS, footerDescription } from "~/lib/footer";

describe("FOOTER_COLUMNS", () => {
	it("renders the three columns left to right", () => {
		expect(FOOTER_COLUMNS.map((c) => c.heading)).toEqual(["The Letter", "The Squad", "Project"]);
	});

	it("routes Letter and Squad columns at their public pages", () => {
		const letterTop = FOOTER_COLUMNS[0]!.items[0]!;
		const squadTop = FOOTER_COLUMNS[1]!.items[0]!;
		expect(letterTop).toMatchObject({ label: "Read the letter", href: "/letter" });
		expect(squadTop).toMatchObject({ label: "All voices", href: "/squad" });
	});

	it("trims The Letter and The Squad to their core links", () => {
		const letter = FOOTER_COLUMNS.find((c) => c.heading === "The Letter")!;
		const squad = FOOTER_COLUMNS.find((c) => c.heading === "The Squad")!;
		expect(letter.items.map((i) => i.label)).toEqual(["Read the letter"]);
		expect(squad.items.map((i) => i.label)).toEqual(["All voices", "By country"]);
	});

	it("links Project to About internally and Fix My Food externally", () => {
		const project = FOOTER_COLUMNS.find((c) => c.heading === "Project")!;
		expect(project.items.map((i) => i.label)).toEqual(["About", "Fix My Food"]);

		const about = project.items.find((i) => i.label === "About")!;
		expect(about).toMatchObject({ href: "/about" });
		expect(about.external).toBeUndefined();

		const fixMyFood = project.items.find((i) => i.label === "Fix My Food")!;
		expect(fixMyFood).toMatchObject({
			href: "https://www.unicef.org/take-action/campaign/fix-my-food",
			external: true,
		});
	});
});

describe("META_LINKS", () => {
	it("includes Privacy, Terms, Accessibility — each stubbed to DEV-82", () => {
		expect(META_LINKS.map((l) => l.label)).toEqual(["Privacy", "Terms", "Accessibility"]);
		for (const link of META_LINKS) {
			expect(link.href).toBe("#");
			expect(link.todo).toBe("DEV-82");
		}
	});
});

describe("LANGUAGES", () => {
	it("ships English (United Kingdom) first plus four launch languages", () => {
		expect(LANGUAGES.map((l) => l.code)).toEqual(["en-GB", "es", "fr", "ar", "pt"]);
		expect(LANGUAGES[0]!.label).toBe("English (United Kingdom)");
	});

	it("uses each language's native label, not English exonyms", () => {
		expect(LANGUAGES.find((l) => l.code === "ar")!.label).toBe("العربية");
		expect(LANGUAGES.find((l) => l.code === "es")!.label).toBe("Español");
	});
});

describe("footerDescription", () => {
	it("returns the campaign brand line", () => {
		expect(footerDescription()).toBe("Own Your Game, a youth-led campaign");
	});
});
