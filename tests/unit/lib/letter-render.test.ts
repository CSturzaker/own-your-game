import { describe, expect, it } from "vitest";

import {
	LETTER_VALUES_DOT,
	parseLetterBody,
	splitDropCap,
	valueDotClass,
	valueLabel,
	type LetterBlock,
} from "~/lib/letter-render";

describe("parseLetterBody", () => {
	it("parses a waypoint comment into a typed waypoint block", () => {
		expect(parseLetterBody("<!-- waypoint:opening -->")).toEqual<LetterBlock[]>([
			{ type: "waypoint", name: "opening" },
		]);
	});

	it("parses a directive block, trimming and joining inner lines", () => {
		const md = "::dropcap\nWe are writing to you.\n::";
		expect(parseLetterBody(md)).toEqual<LetterBlock[]>([
			{ type: "dropcap", text: "We are writing to you." },
		]);
	});

	it("parses a values list into its items", () => {
		const md = "::values\n- community\n- friendship\n- belonging\n::";
		expect(parseLetterBody(md)).toEqual<LetterBlock[]>([
			{ type: "values", items: ["community", "friendship", "belonging"] },
		]);
	});

	it("collects consecutive non-blank lines into one paragraph and splits on blank lines", () => {
		const md = "First line\nsame paragraph\n\nSecond paragraph";
		expect(parseLetterBody(md)).toEqual<LetterBlock[]>([
			{ type: "paragraph", text: "First line same paragraph" },
			{ type: "paragraph", text: "Second paragraph" },
		]);
	});

	it("parses the full canonical block sequence in order", () => {
		const md = [
			"<!-- waypoint:opening -->",
			"",
			"::dropcap",
			"We are writing.",
			"::",
			"",
			"A plain paragraph.",
			"",
			"::reframe",
			"That is what sport means.",
			"::",
			"",
			"<!-- waypoint:question -->",
			"",
			"::tagline-question",
			"Whose game is it anyway?",
			"::",
			"",
			"::pivot",
			"People first.",
			"::",
			"",
			"::values",
			"- community",
			"- joy",
			"::",
			"",
			"<!-- waypoint:ask -->",
			"",
			"::ask",
			"Please help.",
			"::",
			"",
			"::closing-call",
			"Kick it out.",
			"::",
			"",
			"<!-- waypoint:signoff -->",
		].join("\n");

		expect(parseLetterBody(md).map((b) => b.type)).toEqual([
			"waypoint",
			"dropcap",
			"paragraph",
			"reframe",
			"waypoint",
			"tagline-question",
			"pivot",
			"values",
			"waypoint",
			"ask",
			"closing-call",
			"waypoint",
		]);
	});

	it("throws on an unknown directive name so a content typo fails the build", () => {
		expect(() => parseLetterBody("::wobble\noops\n::")).toThrow(/Unknown letter directive/);
	});

	it("throws on an unknown waypoint name", () => {
		expect(() => parseLetterBody("<!-- waypoint:middle -->")).toThrow(/Unknown letter waypoint/);
	});
});

describe("splitDropCap", () => {
	it("splits the initial cap from the remainder", () => {
		expect(splitDropCap("We are writing.")).toEqual({ cap: "W", rest: "e are writing." });
	});
});

describe("valueLabel", () => {
	it("renders a values word as the prototype's 'About {word}.' label", () => {
		expect(valueLabel("community")).toBe("About community.");
	});
});

describe("valueDotClass", () => {
	it("maps each canonical value word to its prototype theme fill", () => {
		// The mapping is deliberately cross-keyed (joy → belonging fill,
		// belonging → fairness fill) so the row reads as a multicoloured line.
		expect(valueDotClass("community")).toContain("bg-community");
		expect(valueDotClass("friendship")).toContain("bg-friendship");
		expect(valueDotClass("confidence")).toContain("bg-confidence");
		expect(valueDotClass("joy")).toContain("bg-belonging");
		expect(valueDotClass("belonging")).toContain("bg-fairness");
	});

	it("includes the shared dot geometry classes", () => {
		expect(valueDotClass("community")).toContain(LETTER_VALUES_DOT);
	});

	it("throws on a word with no mapped theme colour", () => {
		expect(() => valueDotClass("courage")).toThrow(/No theme colour mapped/);
	});
});
