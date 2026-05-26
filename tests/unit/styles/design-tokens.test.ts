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

describe("design-token drift", () => {
	const handoffTokens = parseRootTokens(HANDOFF_TOKENS);
	const projectTokens = parseRootTokens(GLOBAL_CSS);

	it("project global.css :root mirrors every handoff :root variable", () => {
		const missing = Object.keys(handoffTokens).filter((name) => !(name in projectTokens));
		expect(missing).toEqual([]);
	});

	it("each shared variable has the same value in both files", () => {
		const drifted = Object.entries(handoffTokens)
			.filter(([name]) => name in projectTokens)
			.filter(([name, handoffValue]) => projectTokens[name] !== handoffValue)
			.map(([name, handoffValue]) => ({
				name,
				handoff: handoffValue,
				project: projectTokens[name],
			}));
		expect(drifted).toEqual([]);
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
