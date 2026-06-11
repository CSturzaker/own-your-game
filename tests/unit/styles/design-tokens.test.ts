import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Design-token drift spec (deferred from DEV-14).
 *
 * The two-layer token model in src/styles/global.css works only if
 * the :root block stays a faithful mirror of the handoff's
 * design/handoff/project/hifi-tokens.css :root block. If the handoff
 * is updated and the mirror isn't (or vice versa), Tailwind utilities
 * silently resolve to stale values. This spec catches that drift.
 *
 * The original DEV-14 brief suggested asserting via getComputedStyle
 * on a rendered element. jsdom's CSS engine doesn't resolve the
 * var() chain through @theme, so the computed-style approach would
 * have produced a vacuous test. Parsing both files and comparing
 * the declared variables catches drift directly and works in any
 * Node environment.
 */

const PROJECT_ROOT = resolve(import.meta.dirname, "../../..");
const HANDOFF_TOKENS = resolve(PROJECT_ROOT, "design/handoff/project/hifi-tokens.css");
const GLOBAL_CSS = resolve(PROJECT_ROOT, "src/styles/global.css");

/**
 * Extract the first `:root { … }` block from a CSS file and parse
 * the `--name: value;` declarations inside it. Comments and stripped
 * whitespace are tolerated; quoted values (font stacks) are
 * preserved.
 */
function parseRootTokens(filePath: string): Record<string, string> {
	const css = readFileSync(filePath, "utf8");
	// Strip CSS block comments so they don't break our naive declaration scan.
	const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
	const match = stripped.match(/:root\s*\{([\s\S]*?)\}/);
	if (!match || !match[1]) {
		throw new Error(`No :root block found in ${filePath}`);
	}
	const body = match[1];
	const tokens: Record<string, string> = {};
	const declRegex = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
	let m: RegExpExecArray | null;
	while ((m = declRegex.exec(body)) !== null) {
		const name = m[1];
		const rawValue = m[2];
		if (!name || rawValue === undefined) continue;
		tokens[name] = rawValue.trim().replace(/\s+/g, " ");
	}
	return tokens;
}

/**
 * Variables we've deliberately diverged from the handoff to satisfy
 * non-negotiable a11y or correctness constraints. Each entry must
 * carry a reason — the spec asserts the divergence is the only one
 * (no more, no less) so anyone retyping the project value gets a
 * loud failure they can read.
 */
const INTENTIONAL_DIVERGENCES: Record<string, { project: string; reason: string }> = {
	// Handoff #007FB8 → project #007AB1. Same hue family, nudged ~2
	// stops darker so white-on-fairness in tag pills clears WCAG AA
	// (4.44 → ~4.6:1). The handoff's "All clear 4.5:1 with #FFFFFF"
	// claim missed by 0.06 at the original value. Flagged in DEV-25
	// PR for agency review.
	//
	// Reused as the home voice counter card fill in DEV-37
	// (`src/components/home/VoiceCounterCard.astro`). The prototype
	// painted that card in Process Cyan #00AEEF with white type,
	// which lands ~2.5:1 — failing AA at every text size including
	// the 124px number. We use this AA-cleared cyan-family token
	// instead of nudging --c-deep, mirroring the Epic 3 Button
	// precedent (Amber/Deep buttons switched to darker companions
	// rather than relaxing the gate). Two consumers now —
	// `Tag.astro` (fairness theme) and `VoiceCounterCard.astro` —
	// so if this value ever changes, audit both.
	"--c-fairness": {
		project: "#007AB1",
		reason:
			"WCAG AA contrast for white-on-fill — used by Tag (fairness theme, DEV-25) and VoiceCounterCard (DEV-37)",
	},
	// Fonts moved off the Google Fonts CDN to self-hosted, subset
	// @fontsource-variable faces (DEV-75). The family names gain the
	// "Variable" suffix @fontsource uses, each Latin face falls back to
	// Noto Sans Arabic for Arabic glyphs (so /ar resolves to a real
	// face), Noto Sans Display is dropped (it never won the display
	// stack — the italic motif renders as faux-oblique Space Grotesk),
	// and mono drops JetBrains Mono (demo-only) for system monospace.
	"--font-display": {
		project:
			'"Space Grotesk Variable", "Noto Sans Arabic Variable", "Noto Sans Arabic Fallback", "Space Grotesk Fallback", system-ui, sans-serif',
		reason:
			"Self-hosted variable face + Arabic fallback (DEV-75) + metric-matched swap fallbacks (DEV-105 Latin, DEV-128 Arabic)",
	},
	"--font-body": {
		project:
			'"Noto Sans Variable", "Noto Sans Arabic Variable", "Noto Sans Arabic Fallback", "Noto Sans Fallback", system-ui, sans-serif',
		reason:
			"Self-hosted variable face + Arabic fallback (DEV-75) + metric-matched swap fallbacks (DEV-105 Latin, DEV-128 Arabic)",
	},
	"--font-mono": {
		project: "ui-monospace, Menlo, monospace",
		reason: "JetBrains Mono was demo-only; system monospace fallback (DEV-75)",
	},
};

describe("design-token drift", () => {
	const handoffTokens = parseRootTokens(HANDOFF_TOKENS);
	const projectTokens = parseRootTokens(GLOBAL_CSS);

	it("project global.css :root mirrors every handoff :root variable", () => {
		const missing = Object.keys(handoffTokens).filter((name) => !(name in projectTokens));
		expect(missing).toEqual([]);
	});

	it("each shared variable has the same value in both files (or a documented divergence)", () => {
		const drifted = Object.entries(handoffTokens)
			.filter(([name]) => name in projectTokens)
			.filter(([name, handoffValue]) => projectTokens[name] !== handoffValue)
			.map(([name, handoffValue]) => ({
				name,
				handoff: handoffValue,
				project: projectTokens[name],
			}));

		const unexpected = drifted.filter((entry) => {
			const expected = INTENTIONAL_DIVERGENCES[entry.name];
			return !expected || expected.project !== entry.project;
		});
		expect(unexpected).toEqual([]);

		// Every documented divergence must actually be diverging — if
		// the handoff value ever catches up, the entry should be
		// retired from the allowlist.
		const stale = Object.entries(INTENTIONAL_DIVERGENCES).filter(
			([name, { project }]) =>
				name in projectTokens &&
				name in handoffTokens &&
				projectTokens[name] === handoffTokens[name] &&
				projectTokens[name] === project,
		);
		expect(stale).toEqual([]);
	});

	it("the canonical brand colours resolve to their expected hex values", () => {
		// Spot checks that fail loudly if anyone retypes one of the
		// flagship brand values without realising. Update both here AND
		// the handoff if the brand changes.
		expect(handoffTokens["--c-deep"]).toBe("#00AEEF");
		expect(handoffTokens["--c-amber"]).toBe("#F36C21");
		expect(handoffTokens["--c-paper"]).toBe("#F5F0E8");
		expect(handoffTokens["--c-ink"]).toBe("#1A1A1A");
	});
});
