import { describe, expect, it } from "vitest";

import { parseLegalBody, renderInline, type LegalBlock } from "~/lib/legal-render";

describe("renderInline", () => {
	it("escapes HTML-unsafe characters in plain text", () => {
		expect(renderInline("Tom & Jerry <3 > 2")).toBe("Tom &amp; Jerry &lt;3 &gt; 2");
	});

	it("renders a mailto link without a rel", () => {
		expect(renderInline("Email [us](mailto:hi@example.org) today")).toBe(
			'Email <a href="mailto:hi@example.org">us</a> today',
		);
	});

	it("adds a safe rel to external http(s) links", () => {
		expect(renderInline("See [WCAG](https://www.w3.org/TR/WCAG21/)")).toBe(
			'See <a href="https://www.w3.org/TR/WCAG21/" rel="noopener noreferrer">WCAG</a>',
		);
	});

	it("leaves relative links without a rel", () => {
		expect(renderInline("Go [home](/)")).toBe('Go <a href="/">home</a>');
	});

	it("renders multiple links in one line", () => {
		expect(renderInline("[a](/a) and [b](https://b.test)")).toBe(
			'<a href="/a">a</a> and <a href="https://b.test" rel="noopener noreferrer">b</a>',
		);
	});

	it("escapes link label text", () => {
		expect(renderInline("[A & B](/x)")).toBe('<a href="/x">A &amp; B</a>');
	});
});

describe("parseLegalBody", () => {
	it("parses ## and ### headings at the right level", () => {
		const blocks = parseLegalBody("## Section\n\n### Subsection");
		expect(blocks).toEqual<LegalBlock[]>([
			{ type: "heading", level: 2, text: "Section" },
			{ type: "heading", level: 3, text: "Subsection" },
		]);
	});

	it("clamps headings deeper than ### to level 3", () => {
		expect(parseLegalBody("#### Deep")).toEqual<LegalBlock[]>([
			{ type: "heading", level: 3, text: "Deep" },
		]);
	});

	it("groups blank-line-separated paragraphs", () => {
		const blocks = parseLegalBody("First para.\n\nSecond para.");
		expect(blocks).toEqual<LegalBlock[]>([
			{ type: "paragraph", html: "First para." },
			{ type: "paragraph", html: "Second para." },
		]);
	});

	it("joins wrapped paragraph lines with a space before inline parsing", () => {
		// A link that straddles a source line break must still resolve.
		const blocks = parseLegalBody("See the [long\nlink](https://x.test) here.");
		expect(blocks).toEqual<LegalBlock[]>([
			{
				type: "paragraph",
				html: 'See the <a href="https://x.test" rel="noopener noreferrer">long link</a> here.',
			},
		]);
	});

	it("parses an unordered list and renders each item", () => {
		const blocks = parseLegalBody("- one\n- two");
		expect(blocks).toEqual<LegalBlock[]>([{ type: "list", items: ["one", "two"] }]);
	});

	it("appends an indented continuation line to the current list item", () => {
		const blocks = parseLegalBody("- first line\n  continues here\n- second");
		expect(blocks).toEqual<LegalBlock[]>([
			{ type: "list", items: ["first line continues here", "second"] },
		]);
	});

	it("separates a paragraph, a heading, and a list as distinct blocks", () => {
		const blocks = parseLegalBody("Intro.\n\n## Title\n\n- a\n- b\n\nOutro.");
		expect(blocks.map((b) => b.type)).toEqual(["paragraph", "heading", "list", "paragraph"]);
		expect(blocks[1]).toEqual({ type: "heading", level: 2, text: "Title" });
	});

	it("strips HTML comments, including multi-line ones", () => {
		const blocks = parseLegalBody("<!-- a\nmulti-line\ncomment -->\n\nReal text.");
		expect(blocks).toEqual<LegalBlock[]>([{ type: "paragraph", html: "Real text." }]);
	});

	it("treats a comment between blocks as a separator, not a join", () => {
		const blocks = parseLegalBody("Para one.\n<!-- note -->\n- bullet");
		expect(blocks).toEqual<LegalBlock[]>([
			{ type: "paragraph", html: "Para one." },
			{ type: "list", items: ["bullet"] },
		]);
	});

	it("returns an empty array for empty or whitespace-only input", () => {
		expect(parseLegalBody("")).toEqual([]);
		expect(parseLegalBody("\n\n   \n")).toEqual([]);
	});
});
