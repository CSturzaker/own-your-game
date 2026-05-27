/**
 * Letter frontmatter schema.
 *
 * Each `content/letter/{lang}.md` carries a YAML frontmatter block
 * describing the language, text direction, and the UI labels around
 * the letter prose (salutation, sign-off, share buttons). The body
 * itself is markdown — this schema validates only the metadata.
 *
 * The renderer in the letter epic reads this through `gray-matter`,
 * then this Zod schema is the gate before any value reaches the page.
 * A missing field or a typo in `direction` aborts the build with a
 * named error rather than rendering a broken letter.
 *
 * Coordinate any change here with `docs/ops/letter-editing.md` — the
 * field-by-field guidance for translators lives there.
 */

import { z } from "zod";

/**
 * Supported display languages. Mirrors the file set in
 * `content/letter/`. Adding a language means:
 *   1. Adding the code here
 *   2. Creating `content/letter/{code}.md` with translated body
 *   3. Wiring the language switcher (epic 5+ — not in scope here)
 */
export const LETTER_LANGS = ["en", "es", "fr", "ar", "pt"] as const;

export type LetterLang = (typeof LETTER_LANGS)[number];

export const letterFrontmatterSchema = z.object({
	/** BCP 47 language tag (subset — must match a file under content/letter/). */
	lang: z.enum(LETTER_LANGS),

	/**
	 * CSS writing direction. `rtl` for Arabic; `ltr` for everything
	 * else. The renderer sets `dir={direction}` on the letter
	 * container and Tailwind's logical properties handle the rest.
	 */
	direction: z.enum(["ltr", "rtl"]),

	/** "Dear FIFA," in the local language. */
	salutation: z.string().min(1).max(80),

	/** Italic line above the campaign name in the sign-off ("Ours,"). */
	signoff_italic: z.string().min(1).max(40),

	/**
	 * Block-set campaign name in the sign-off ("Own Your Game"). Usually
	 * untranslated — the brand stays English — but exposed in
	 * frontmatter so translators can override on a per-language basis
	 * if a transliteration is preferred.
	 */
	signoff_block: z.string().min(1).max(40),

	/** Labels for the share buttons under the letter. */
	share: z.object({
		copyLinkLabel: z.string().min(1).max(40),
		shareAsImageLabel: z.string().min(1).max(40),
	}),
});

export type LetterFrontmatter = z.infer<typeof letterFrontmatterSchema>;
