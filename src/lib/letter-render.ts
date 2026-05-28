/**
 * Letter body parser + directive class resolvers.
 *
 * The letter prose in `content/letter/{lang}.md` carries seven custom
 * directive blocks (`::name … ::`) and four waypoint anchor comments
 * (`<!-- waypoint:NAME -->`) on top of plain paragraphs. This module
 * turns that markdown body into a flat list of typed blocks the
 * `LetterBody.astro` shell maps to markup, and exposes the per-directive
 * Tailwind class strings so Vitest can pin every designed moment without
 * rendering Astro (same pattern as `src/lib/primitives.ts`).
 *
 * Why a hand-rolled tokenizer rather than a remark plugin: the letter is
 * small and the directive grammar is trivial (top-level `::` blocks, no
 * nesting, no inline markdown in the body). A tokenizer is cleaner and
 * far more testable here than wiring unified → rehype → component map
 * through Astro's build — the issue (DEV-53) and the epic kickoff both
 * sanction this alternative.
 *
 * Visual treatment follows `design/handoff/project/hifi-letter.jsx`
 * lines 110–375 (the prototype), per DEV-53's "visual match to
 * prototype" acceptance criterion. Where the issue's Scope text named
 * different px/colours, the prototype wins; the divergences are logged
 * on the issue.
 */

/** Directive names recognised in `::name … ::` blocks. */
export const LETTER_DIRECTIVE_NAMES = [
	"dropcap",
	"reframe",
	"tagline-question",
	"pivot",
	"values",
	"ask",
	"closing-call",
] as const;

export type LetterDirectiveName = (typeof LETTER_DIRECTIVE_NAMES)[number];

/** Waypoint anchor names recognised in `<!-- waypoint:NAME -->` comments. */
export const WAYPOINT_NAMES = ["opening", "question", "ask", "signoff"] as const;

export type WaypointName = (typeof WAYPOINT_NAMES)[number];

export type LetterBlock =
	| { type: "waypoint"; name: WaypointName }
	| { type: "paragraph"; text: string }
	| { type: "dropcap"; text: string }
	| { type: "reframe"; text: string }
	| { type: "tagline-question"; text: string }
	| { type: "pivot"; text: string }
	| { type: "ask"; text: string }
	| { type: "closing-call"; text: string }
	| { type: "values"; items: string[] };

const WAYPOINT_RE = /^<!--\s*waypoint:([a-z-]+)\s*-->$/;
const DIRECTIVE_OPEN_RE = /^::([a-z-]+)$/;
const DIRECTIVE_CLOSE = "::";

function isDirectiveName(name: string): name is LetterDirectiveName {
	return (LETTER_DIRECTIVE_NAMES as readonly string[]).includes(name);
}

function isWaypointName(name: string): name is WaypointName {
	return (WAYPOINT_NAMES as readonly string[]).includes(name);
}

function buildDirective(name: LetterDirectiveName, inner: string[]): LetterBlock {
	if (name === "values") {
		const items = inner
			.map((line) => line.trim())
			.filter((line) => line.startsWith("- "))
			.map((line) => line.slice(2).trim())
			.filter(Boolean);
		return { type: "values", items };
	}
	const text = inner
		.map((line) => line.trim())
		.filter(Boolean)
		.join(" ");
	return { type: name, text };
}

/**
 * Parse a letter markdown body (frontmatter already stripped by
 * `getLetter()`) into an ordered list of typed blocks.
 *
 * Throws on an unknown directive or waypoint name so a typo in the
 * canonical content aborts the build with a named error rather than
 * silently dropping a designed moment.
 */
export function parseLetterBody(markdown: string): LetterBlock[] {
	const lines = markdown.split("\n");
	const blocks: LetterBlock[] = [];
	let paragraph: string[] = [];

	const flushParagraph = () => {
		const text = paragraph.join(" ").trim();
		if (text) blocks.push({ type: "paragraph", text });
		paragraph = [];
	};

	let i = 0;
	while (i < lines.length) {
		const line = (lines[i] ?? "").trim();

		if (line === "") {
			flushParagraph();
			i++;
			continue;
		}

		const waypoint = WAYPOINT_RE.exec(line);
		if (waypoint) {
			flushParagraph();
			const name = waypoint[1] ?? "";
			if (!isWaypointName(name)) {
				throw new Error(
					`Unknown letter waypoint "${name}" — expected one of ${WAYPOINT_NAMES.join(", ")}`,
				);
			}
			blocks.push({ type: "waypoint", name });
			i++;
			continue;
		}

		const open = DIRECTIVE_OPEN_RE.exec(line);
		if (open) {
			flushParagraph();
			const name = open[1] ?? "";
			if (!isDirectiveName(name)) {
				throw new Error(
					`Unknown letter directive "::${name}" — expected one of ${LETTER_DIRECTIVE_NAMES.join(", ")}`,
				);
			}
			const inner: string[] = [];
			i++;
			while (i < lines.length && (lines[i] ?? "").trim() !== DIRECTIVE_CLOSE) {
				inner.push(lines[i] ?? "");
				i++;
			}
			i++; // step past the closing "::"
			blocks.push(buildDirective(name, inner));
			continue;
		}

		paragraph.push(line);
		i++;
	}

	flushParagraph();
	return blocks;
}

/**
 * Split a dropcap block's text into its initial cap and the remainder.
 * The cap is the first character only — the rest flows from the adjacent
 * text node so a screen reader still reads "We are writing…" as one
 * phrase (no aria-hidden on the cap).
 */
export function splitDropCap(text: string): { cap: string; rest: string } {
	return { cap: text.slice(0, 1), rest: text.slice(1) };
}

/** Display label for a values-list word: `community` → `About community.` */
export function valueLabel(word: string): string {
	return `About ${word}.`;
}

// ---------------------------------------------------------------
// Directive class strings — prototype-faithful, mobile-first.
// Token utilities (text-answer, text-dropcap, tracking-04) come from
// the @theme block in src/styles/global.css.
// ---------------------------------------------------------------

/** Plain body paragraph + the dropcap paragraph wrapper. */
export const LETTER_PARAGRAPH = "font-body text-ink text-[16px] leading-[1.75] lg:text-[19px]";

/** The floated initial cap — 64px mobile / 96px (text-dropcap) desktop. */
export const LETTER_DROPCAP_CHAR =
	"font-display text-deep-cyan float-left mt-1 mr-2.5 text-[64px] leading-[0.85] font-bold tracking-[-0.02em] lg:mt-1.5 lg:mr-3.5 lg:-mb-1 lg:text-dropcap";

/** Reframing line — display, weight 500, ink. */
export const LETTER_REFRAME =
	"font-display text-ink max-w-[44ch] text-[19px] leading-[1.4] font-medium text-balance lg:text-[22px] lg:leading-[1.45]";

/** "Whose game is it anyway?" — amber hairline + italic display. */
export const LETTER_TAGLINE_OUTER = "border-brand-orange border-l-[3px] pl-4.5 lg:pl-8";
export const LETTER_TAGLINE_INNER =
	"font-display text-ink max-w-[16ch] text-[44px] leading-none font-medium italic tracking-[-0.015em] lg:text-answer";

/** Pivot line — heavier, ink, mixed-case. */
export const LETTER_PIVOT =
	"font-display text-ink max-w-[26ch] text-[22px] leading-[1.3] font-semibold tracking-[-0.01em] lg:text-[28px]";

/** Five-values list — team-sheet display caps, each keyed to a dot. */
export const LETTER_VALUES_UL = "flex list-none flex-col gap-3 lg:gap-3.5";
export const LETTER_VALUES_LI = "flex items-center gap-3.5 lg:gap-5";
export const LETTER_VALUES_DOT = "inline-block size-2.75 shrink-0 rounded-full lg:size-3.5";
export const LETTER_VALUES_LABEL =
	"font-display text-ink text-[19px] leading-none font-bold tracking-04 uppercase lg:text-[26px]";

/** The ask — display, amber hairline, larger than body. */
export const LETTER_ASK_OUTER = "border-brand-orange border-l-[3px] pl-4.5 lg:pl-8";
export const LETTER_ASK_INNER =
	"font-display text-ink max-w-[20ch] text-[26px] leading-[1.2] font-semibold tracking-[-0.015em] text-balance lg:text-[42px] lg:leading-[1.15]";

/** Closing call — slightly weightier than body prose. */
export const LETTER_CLOSING_CALL =
	"font-body text-ink text-[17px] leading-[1.55] font-semibold text-pretty lg:text-[21px]";

/**
 * Theme-palette dot colour per values word. The mapping is the
 * prototype's (hifi-letter.jsx) — deliberately NOT each word's own
 * theme, so the row reads as a multicoloured signature line. Classes
 * are written literally so Tailwind's scanner emits them.
 */
const VALUE_DOT_BG: Record<string, string> = {
	community: "bg-community",
	friendship: "bg-friendship",
	confidence: "bg-confidence",
	joy: "bg-belonging",
	belonging: "bg-fairness",
};

/** Full class for a values dot, including its theme fill. */
export function valueDotClass(word: string): string {
	const bg = VALUE_DOT_BG[word];
	if (!bg) {
		throw new Error(
			`No theme colour mapped for value "${word}" — add it to VALUE_DOT_BG in src/lib/letter-render.ts`,
		);
	}
	return `${LETTER_VALUES_DOT} ${bg}`;
}
