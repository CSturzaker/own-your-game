/**
 * A tiny markdown renderer for the legal prose pages (DEV-82).
 *
 * The Privacy / Terms / Accessibility bodies are ordinary, controlled
 * markdown — `##`/`###` headings, paragraphs, inline links (including
 * `mailto:`), and the odd unordered list. They have *no* bespoke
 * grammar, so this is deliberately **not** `letter-render.ts` (that
 * tokenizer is for the letter's `::directive::` blocks and waypoints).
 *
 * Why hand-rolled rather than a dependency: a full markdown pipeline
 * (`@astrojs/markdown-remark` / remark / micromark) sits in the tree
 * only transitively (pnpm, unhoisted) and is a heavy CommonMark/GFM
 * engine; these three small, author-templated documents need a tight,
 * fully-testable subset instead. This follows the project's "pure
 * resolver in `src/lib/`, every branch pinned by Vitest" convention
 * (the same one `letter-render.ts` and the squad helpers follow).
 *
 * The output is **semantic HTML only** — no presentation classes. The
 * block elements (`<h2>`/`<h3>`/`<p>`/`<ul>`/`<li>`) are emitted by
 * `LegalDocument.astro` and carry the token utility classes there; the
 * inline HTML this module produces (escaped text + `<a>` links) is set
 * into them via `set:html`, and the rendered links are styled through a
 * scoped `[data-legal-prose] a` rule in that component.
 *
 * Supported grammar (anything else is treated as paragraph text):
 *   - `## ` / `### ` ATX headings (levels deeper than 3 clamp to 3)
 *   - blank-line-separated paragraphs; wrapped source lines are joined
 *     with a space *before* inline parsing, so a `[link](url)` that
 *     straddles a line break still resolves
 *   - `- ` / `* ` unordered list items; an indented continuation line
 *     appends to the current item
 *   - inline `[text](url)` links — `http(s)://` targets get a safe
 *     `rel="noopener noreferrer"`; `mailto:` and relative targets pass
 *     through unchanged
 *   - HTML comments (`<!-- ... -->`, including multi-line) are stripped
 */

export interface LegalHeadingBlock {
	readonly type: "heading";
	readonly level: 2 | 3;
	/**
	 * Raw heading text. Headings carry no inline markup, so this is the
	 * plain string — the component renders it as a child expression (which
	 * Astro auto-escapes), keeping the heading's content statically visible
	 * to the `jsx-a11y/heading-has-content` rule rather than hidden behind
	 * `set:html`.
	 */
	readonly text: string;
}

export interface LegalParagraphBlock {
	readonly type: "paragraph";
	/** Inline HTML (escaped text; links rendered). */
	readonly html: string;
}

export interface LegalListBlock {
	readonly type: "list";
	/** Each item is inline HTML (escaped text; links rendered). */
	readonly items: readonly string[];
}

export type LegalBlock = LegalHeadingBlock | LegalParagraphBlock | LegalListBlock;

const HEADING = /^(#{2,6})\s+(.+)$/;
const LIST_ITEM = /^[-*]\s+(.+)$/;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Escape the three characters that are unsafe in HTML text content. */
function escapeText(input: string): string {
	return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Escape for a double-quoted attribute value (text-unsafe chars + `"`). */
function escapeAttr(input: string): string {
	return escapeText(input).replace(/"/g, "&quot;");
}

/**
 * Render inline markdown (currently just `[text](url)` links) to HTML.
 * All non-link text is HTML-escaped. External `http(s)` links carry a
 * safe `rel`; `mailto:`/relative links don't. Exported for unit tests.
 */
export function renderInline(text: string): string {
	let out = "";
	let lastIndex = 0;
	LINK.lastIndex = 0;

	let match: RegExpExecArray | null;
	while ((match = LINK.exec(text)) !== null) {
		out += escapeText(text.slice(lastIndex, match.index));
		const label = match[1] ?? "";
		const url = (match[2] ?? "").trim();
		const isExternal = /^https?:\/\//i.test(url);
		const rel = isExternal ? ' rel="noopener noreferrer"' : "";
		out += `<a href="${escapeAttr(url)}"${rel}>${escapeText(label)}</a>`;
		lastIndex = match.index + match[0].length;
	}
	out += escapeText(text.slice(lastIndex));
	return out;
}

/**
 * Parse a legal-page markdown body into an ordered list of blocks. Pure
 * and synchronous; the caller renders each block to a classed element.
 */
export function parseLegalBody(markdown: string): LegalBlock[] {
	const source = markdown.replace(HTML_COMMENT, "");
	const lines = source.split(/\r?\n/);

	const blocks: LegalBlock[] = [];
	let paragraph: string[] = [];
	let listItems: string[] = [];
	let mode: "none" | "paragraph" | "list" = "none";

	const flush = (): void => {
		if (mode === "paragraph" && paragraph.length > 0) {
			blocks.push({ type: "paragraph", html: renderInline(paragraph.join(" ")) });
		} else if (mode === "list" && listItems.length > 0) {
			blocks.push({ type: "list", items: listItems.map(renderInline) });
		}
		paragraph = [];
		listItems = [];
		mode = "none";
	};

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed === "") {
			flush();
			continue;
		}

		const heading = HEADING.exec(trimmed);
		if (heading) {
			flush();
			const level = Math.min(heading[1]!.length, 3) as 2 | 3;
			blocks.push({ type: "heading", level, text: heading[2]! });
			continue;
		}

		const listItem = LIST_ITEM.exec(trimmed);
		if (listItem) {
			if (mode !== "list") flush();
			mode = "list";
			listItems.push(listItem[1]!);
			continue;
		}

		// Continuation / paragraph text. Inside a list it extends the
		// current item; otherwise it builds (or starts) a paragraph.
		if (mode === "list" && listItems.length > 0) {
			listItems[listItems.length - 1] += ` ${trimmed}`;
		} else {
			mode = "paragraph";
			paragraph.push(trimmed);
		}
	}

	flush();
	return blocks;
}
