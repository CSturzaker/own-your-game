/**
 * Legal-content integrity + loader behaviour (DEV-82).
 *
 * The integrity cases run against the real `content/legal/en/*.md` so a
 * broken frontmatter block or an empty body fails CI before it can reach
 * the live site — the same defence-in-depth the letter test provides.
 * The loader cases exercise `getLegalPage` (caching, English fallback,
 * the missing-English error) against path overrides.
 */

import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import matter from "gray-matter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LEGAL_SLUGS, legalFrontmatterSchema } from "../../../schemas/legal";
import {
	__resetContentCacheForTests,
	__resetContentPathsForTests,
	__setContentPathsForTests,
	getLegalPage,
} from "~/lib/content";

const LEGAL_DIR = resolve(__dirname, "../../../content/legal");
const EN_DIR = resolve(LEGAL_DIR, "en");

beforeEach(() => {
	__setContentPathsForTests({ legalDir: LEGAL_DIR });
});

afterEach(() => {
	__resetContentCacheForTests();
	__resetContentPathsForTests();
});

describe("content/legal/en files", () => {
	it("has exactly one .md file per slug", () => {
		const onDisk = readdirSync(EN_DIR)
			.filter((f) => f.endsWith(".md"))
			.map((f) => f.replace(/\.md$/, ""))
			.sort();
		expect(onDisk).toEqual([...LEGAL_SLUGS].sort());
	});

	for (const slug of LEGAL_SLUGS) {
		describe(`${slug}.md`, () => {
			const raw = readFileSync(resolve(EN_DIR, `${slug}.md`), "utf8");
			const { data, content } = matter(raw);

			it("parses as valid gray-matter", () => {
				expect(data).toBeTypeOf("object");
			});

			it("has frontmatter conforming to legalFrontmatterSchema", () => {
				const result = legalFrontmatterSchema.safeParse(data);
				if (!result.success) {
					throw new Error(`Frontmatter validation failed for ${slug}.md:\n${result.error.message}`);
				}
				expect(result.data.lang).toBe("en");
				expect(result.data.slug).toBe(slug);
			});

			it("has a non-empty body", () => {
				expect(content.trim().length).toBeGreaterThan(0);
			});
		});
	}
});

describe("getLegalPage", () => {
	it("loads the English document for the default locale", () => {
		const page = getLegalPage("privacy", "en");
		expect(page.frontmatter.slug).toBe("privacy");
		expect(page.frontmatter.lang).toBe("en");
		expect(page.body.trim().length).toBeGreaterThan(0);
	});

	it("caches per slug+lang — a second call returns the same object", () => {
		expect(getLegalPage("terms", "en")).toBe(getLegalPage("terms", "en"));
	});

	it("falls back to English for a locale with no file, and reports lang=en", () => {
		// No es/fr/ar/pt files exist yet; the loaded content is English, so
		// `frontmatter.lang` is "en" — which is how the page derives ltr for
		// an Arabic route that falls back.
		const arabic = getLegalPage("accessibility", "ar");
		const english = getLegalPage("accessibility", "en");
		expect(arabic.frontmatter.lang).toBe("en");
		expect(arabic.body).toBe(english.body);
	});

	it("throws a named error when the English file is missing", () => {
		const emptyDir = mkdtempSync(resolve(tmpdir(), "legal-empty-"));
		__setContentPathsForTests({ legalDir: emptyDir });
		__resetContentCacheForTests();
		expect(() => getLegalPage("privacy", "en")).toThrow(/Legal page not found/);
	});
});
