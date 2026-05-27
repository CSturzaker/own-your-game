/**
 * Letter file integrity. Every `content/letter/{lang}.md` must:
 *   1. Parse as valid gray-matter (no broken YAML)
 *   2. Carry a frontmatter block that conforms to `letterFrontmatterSchema`
 *   3. Have a non-empty body
 *
 * This is a defence-in-depth check — the campaign team edits letters
 * by PR, and "broken YAML in a frontmatter block" is the most common
 * failure mode for that workflow. Catching it at test time means no
 * broken-letter pages ever reach the live site.
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { LETTER_LANGS, letterFrontmatterSchema } from "../../../schemas/letter";

const LETTER_DIR = resolve(__dirname, "../../../content/letter");

describe("letter content files", () => {
	it("has one .md file per supported language and no extras", () => {
		const onDisk = readdirSync(LETTER_DIR)
			.filter((f) => f.endsWith(".md"))
			.map((f) => f.replace(/\.md$/, ""))
			.sort();
		expect(onDisk).toEqual([...LETTER_LANGS].sort());
	});

	for (const lang of LETTER_LANGS) {
		describe(`${lang}.md`, () => {
			const filePath = resolve(LETTER_DIR, `${lang}.md`);
			const raw = readFileSync(filePath, "utf8");
			const { data, content } = matter(raw);

			it("parses as valid gray-matter", () => {
				expect(data).toBeTypeOf("object");
			});

			it("has frontmatter that conforms to letterFrontmatterSchema", () => {
				const result = letterFrontmatterSchema.safeParse(data);
				if (!result.success) {
					throw new Error(`Frontmatter validation failed for ${lang}.md:\n${result.error.message}`);
				}
				expect(result.data.lang).toBe(lang);
			});

			it("has a non-empty body", () => {
				expect(content.trim().length).toBeGreaterThan(0);
			});
		});
	}

	it("the English file's direction is ltr", () => {
		const { data } = matter(readFileSync(resolve(LETTER_DIR, "en.md"), "utf8"));
		expect(data.direction).toBe("ltr");
	});

	it("the Arabic file's direction is rtl", () => {
		const { data } = matter(readFileSync(resolve(LETTER_DIR, "ar.md"), "utf8"));
		expect(data.direction).toBe("rtl");
	});
});
