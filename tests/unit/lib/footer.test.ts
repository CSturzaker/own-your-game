import { describe, expect, it } from "vitest";

import { FOOTER_COLUMNS, LANGUAGES, META_LINKS, footerDescription } from "~/lib/footer";

describe("FOOTER_COLUMNS", () => {
	it("renders the prototype's four columns left to right", () => {
		expect(FOOTER_COLUMNS.map((c) => c.heading)).toEqual([
			"The Letter",
			"The Squad",
			"Project",
			"UNICEF",
		]);
	});

	it("routes Letter and Squad columns at their public pages", () => {
		const letterTop = FOOTER_COLUMNS[0]!.items[0]!;
		const squadTop = FOOTER_COLUMNS[1]!.items[0]!;
		expect(letterTop).toMatchObject({ label: "Read the letter", href: "/letter" });
		expect(squadTop).toMatchObject({ label: "All voices", href: "/squad" });
	});

	it("marks every UNICEF link as external", () => {
		const unicef = FOOTER_COLUMNS.find((c) => c.heading === "UNICEF")!;
		for (const item of unicef.items) {
			expect(item.external).toBe(true);
			expect(item.href).toMatch(/^https:\/\/(www\.)?unicef\.org/);
		}
	});

	it("flags stubbed Project links with a todo marker and a # href", () => {
		const project = FOOTER_COLUMNS.find((c) => c.heading === "Project")!;
		const stubs = project.items.filter((i) => i.todo);
		expect(stubs.length).toBeGreaterThan(0);
		for (const stub of stubs) {
			expect(stub.href).toBe("#");
			expect(stub.todo).toMatch(/^DEV-/);
		}
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
	it("templates the voice count into the campaign sentence", () => {
		expect(footerDescription(247)).toContain("247 young people");
		expect(footerDescription(247)).toContain("2026 World Cup");
	});

	it("inserts thousands separators in en-US for larger counts", () => {
		expect(footerDescription(1247)).toContain("1,247 young people");
	});
});
