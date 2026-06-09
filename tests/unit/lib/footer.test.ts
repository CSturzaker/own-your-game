import { describe, expect, it } from "vitest";

import { FOOTER_COLUMNS, META_LINKS } from "~/lib/footer";

// Labels moved into the translation dictionary (DEV-70); these specs pin
// the structural data (column/link keys + routes) the Footer resolves
// through `t()`. The English label values are covered by the dictionary
// parity guard and `t` tests.

describe("FOOTER_COLUMNS", () => {
	it("renders the three columns left to right by key", () => {
		expect(FOOTER_COLUMNS.map((c) => c.key)).toEqual(["letter", "squad", "project"]);
	});

	it("routes Letter and Squad columns at their public pages", () => {
		expect(FOOTER_COLUMNS[0]!.items[0]).toMatchObject({ labelKey: "readLetter", href: "/letter" });
		expect(FOOTER_COLUMNS[1]!.items[0]).toMatchObject({ labelKey: "allVoices", href: "/squad" });
	});

	it("trims The Letter and The Squad to their core links", () => {
		const letter = FOOTER_COLUMNS.find((c) => c.key === "letter")!;
		const squad = FOOTER_COLUMNS.find((c) => c.key === "squad")!;
		expect(letter.items.map((i) => i.labelKey)).toEqual(["readLetter"]);
		expect(squad.items.map((i) => i.labelKey)).toEqual(["allVoices", "byCountry"]);
	});

	it("links Project to About internally and the partner campaigns externally", () => {
		const project = FOOTER_COLUMNS.find((c) => c.key === "project")!;
		expect(project.items.map((i) => i.labelKey ?? i.label)).toEqual([
			"about",
			"Fix My Food",
			"Kick Big Soda Out",
		]);

		const about = project.items.find((i) => i.labelKey === "about")!;
		expect(about).toMatchObject({ href: "/about" });
		expect(about.external).toBeUndefined();

		// "Fix My Food" is a brand name carried as a literal, not a dict key.
		const fixMyFood = project.items.find((i) => i.label === "Fix My Food")!;
		expect(fixMyFood).toMatchObject({
			href: "https://www.unicef.org/take-action/campaign/fix-my-food",
			external: true,
		});

		// "Kick Big Soda Out" — the first non-UNICEF third-party link (DEV-123),
		// placed after Fix My Food and carried as a literal brand label.
		const kickBigSodaOut = project.items.find((i) => i.label === "Kick Big Soda Out")!;
		expect(kickBigSodaOut).toMatchObject({
			href: "https://www.kickbigsodaout.org",
			external: true,
		});
	});
});

describe("META_LINKS", () => {
	it("includes privacy, terms, accessibility — each stubbed to DEV-82", () => {
		expect(META_LINKS.map((l) => l.key)).toEqual(["privacy", "terms", "accessibility"]);
		for (const link of META_LINKS) {
			expect(link.href).toBe("#");
			expect(link.todo).toBe("DEV-82");
		}
	});
});

// The language-switcher options moved to the dictionary (`languages.*`,
// DEV-70) and are keyed by the real routing locales (DEV-72); `Footer.astro`
// resolves them and the LanguageSwitcher island consumes them. Their native
// names are covered by the dictionary parity guard.
