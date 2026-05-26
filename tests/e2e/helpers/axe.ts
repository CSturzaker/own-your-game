import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export interface RunAxeOptions {
	/**
	 * CSS selectors to include in the scan (default: the whole page).
	 * Pass a narrow selector when only a region is meaningful — e.g.
	 * a modal that's open over an inert background.
	 */
	include?: string[];
	/**
	 * CSS selectors to exclude from the scan.
	 */
	exclude?: string[];
	/**
	 * Axe rule IDs to disable for this run. Use sparingly and always
	 * justify in a comment at the call site — the project gate is
	 * zero WCAG 2.1 A/AA violations.
	 */
	disableRules?: string[];
}

/**
 * Runs axe-core against the current page and asserts zero violations
 * across WCAG 2.1 A and AA. The campaign's a11y budget is
 * non-negotiable; this is the authoritative gate.
 *
 * Default scope: WCAG 2.1 A + AA tags only. Best-practice and ARIA
 * experimental rules are deliberately not enforced — too noisy for
 * a strict gate and the spec is the actionable line.
 */
export async function runAxe(page: Page, options: RunAxeOptions = {}): Promise<void> {
	let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);

	if (options.include?.length) {
		for (const selector of options.include) {
			builder = builder.include(selector);
		}
	}
	if (options.exclude?.length) {
		for (const selector of options.exclude) {
			builder = builder.exclude(selector);
		}
	}
	if (options.disableRules?.length) {
		builder = builder.disableRules(options.disableRules);
	}

	const results = await builder.analyze();
	expect(results.violations, formatViolations(results.violations)).toEqual([]);
}

function formatViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]): string {
	if (violations.length === 0) return "";
	return [
		`axe-core found ${violations.length} violation(s):`,
		...violations.map((v) => {
			const nodes = v.nodes.map((n) => `      - ${n.target.join(" › ")}`).join("\n");
			return `\n  ${v.id} (${v.impact}): ${v.help}\n    ${v.helpUrl}\n${nodes}`;
		}),
	].join("\n");
}
