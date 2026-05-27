import { describe, expect, it } from "vitest";

import {
	buttonClasses,
	chipClasses,
	KICKER_CLASSES,
	TAGLINE_CLASSES,
	tagClasses,
	type ButtonSize,
	type ButtonVariant,
	type TagTheme,
} from "~/lib/primitives";

const ALL_BUTTON_VARIANTS: readonly ButtonVariant[] = ["primary", "ghost", "amber", "deep"];
const ALL_BUTTON_SIZES: readonly ButtonSize[] = ["sm", "md", "lg"];
const ALL_THEMES: readonly TagTheme[] = [
	"fairness",
	"belonging",
	"friendship",
	"confidence",
	"family",
	"community",
];

describe("buttonClasses", () => {
	it("includes the shared base classes on every variant", () => {
		for (const variant of ALL_BUTTON_VARIANTS) {
			const classes = buttonClasses(variant, "md");
			expect(classes).toContain("rounded-pill");
			expect(classes).toContain("inline-flex");
			expect(classes).toContain("active:scale-[0.98]");
		}
	});

	it("primary uses ink fill paper text with the deep-cyan hover", () => {
		const classes = buttonClasses("primary", "md");
		expect(classes).toContain("bg-ink");
		expect(classes).toContain("text-paper");
		expect(classes).toContain("hover:bg-deep-cyan");
	});

	it("ghost is transparent until hover", () => {
		const classes = buttonClasses("ghost", "md");
		expect(classes).toContain("bg-transparent");
		expect(classes).toContain("text-ink");
		expect(classes).toContain("hover:bg-ink");
		expect(classes).toContain("hover:text-paper");
	});

	it("amber and deep use the AA-safe darker variants with white text", () => {
		// Pantone 1505 (bg-brand-orange) and Process Cyan (bg-brand-cyan)
		// fail WCAG AA at 14px against white. Defaults shift to the
		// Functional / Deep variants which pass — see the note in
		// src/lib/primitives.ts above BUTTON_VARIANT for the trade-off.
		const amber = buttonClasses("amber", "md");
		expect(amber).toContain("bg-fn-orange");
		expect(amber).toContain("text-white");
		expect(amber).toContain("hover:bg-confidence");

		const deep = buttonClasses("deep", "md");
		expect(deep).toContain("bg-deep-cyan");
		expect(deep).toContain("text-white");
		expect(deep).toContain("hover:bg-ink");
	});

	it("size sm/md/lg map to the prototype's min-heights", () => {
		expect(buttonClasses("primary", "sm")).toContain("min-h-9");
		expect(buttonClasses("primary", "md")).toContain("min-h-11");
		expect(buttonClasses("primary", "lg")).toContain("min-h-13");
	});

	it("appends the consumer-supplied class string when provided", () => {
		const classes = buttonClasses("primary", "md", "w-full custom-tracker");
		expect(classes).toContain("w-full");
		expect(classes).toContain("custom-tracker");
	});

	it("defaults variant to primary and size to md", () => {
		const defaults = buttonClasses();
		expect(defaults).toBe(buttonClasses("primary", "md"));
	});

	it("renders every variant × size combination without duplicate tokens", () => {
		for (const variant of ALL_BUTTON_VARIANTS) {
			for (const size of ALL_BUTTON_SIZES) {
				const classes = buttonClasses(variant, size).split(/\s+/).filter(Boolean);
				const unique = new Set(classes);
				expect(unique.size, `${variant}/${size}`).toBe(classes.length);
			}
		}
	});
});

describe("tagClasses", () => {
	it("emits one bg-<theme> utility per filled theme", () => {
		for (const theme of ALL_THEMES) {
			const classes = tagClasses(theme);
			expect(classes).toContain(`bg-${theme}`);
			expect(classes).toContain("text-white");
		}
	});

	it("outline drops the fill, uses currentColor border and ink-2 text", () => {
		const outline = tagClasses("fairness", "outline");
		expect(outline).toContain("bg-transparent");
		expect(outline).toContain("border-current");
		expect(outline).toContain("text-ink-2");
		expect(outline).not.toContain("bg-fairness");
	});

	it("defaults to the filled variant", () => {
		expect(tagClasses("belonging")).toBe(tagClasses("belonging", "filled"));
	});
});

describe("chipClasses", () => {
	it("default chip carries the rule border and ink-2 text with ink-on-hover", () => {
		const classes = chipClasses();
		expect(classes).toContain("bg-paper");
		expect(classes).toContain("border-rule");
		expect(classes).toContain("text-ink-2");
		expect(classes).toContain("hover:text-ink");
	});

	it("active chip uses the amber-50 fill and brand-orange border", () => {
		const classes = chipClasses("active");
		expect(classes).toContain("bg-amber-50");
		expect(classes).toContain("border-brand-orange");
		expect(classes).toContain("text-ink");
	});

	it("accepts an extra-classes suffix", () => {
		expect(chipClasses("default", "ml-2")).toContain("ml-2");
	});
});

describe("KICKER_CLASSES and TAGLINE_CLASSES", () => {
	it("kicker is the uppercase top-bordered eyebrow", () => {
		expect(KICKER_CLASSES).toContain("uppercase");
		expect(KICKER_CLASSES).toContain("tracking-kicker");
		expect(KICKER_CLASSES).toContain("border-t-2");
		expect(KICKER_CLASSES).toContain("border-ink");
	});

	it("tagline is the italic display motif with balanced wrap", () => {
		expect(TAGLINE_CLASSES).toContain("font-display");
		expect(TAGLINE_CLASSES).toContain("italic");
		expect(TAGLINE_CLASSES).toContain("text-balance");
	});
});
