/**
 * Legal-page frontmatter schema (DEV-82).
 *
 * The Privacy, Terms, and Accessibility pages are plain prose documents
 * stored as markdown at `content/legal/{lang}/{slug}.md`. Each file
 * carries a small YAML frontmatter block; the body is ordinary markdown
 * (headings, paragraphs, links, the odd list — no bespoke directives).
 *
 * `src/lib/content.ts`'s `getLegalPage` reads a file through
 * `gray-matter`, then this Zod schema is the gate before any value
 * reaches the page. A missing field or a bad `slug`/`lang` aborts the
 * build with a named error rather than rendering a broken legal page.
 *
 * Mirrors `schemas/letter.ts`. The language set is deliberately reused
 * from there (`LETTER_LANGS`) rather than forked — the routed locales,
 * letter languages, and legal languages are one and the same set.
 */

import { z } from "zod";

import { LETTER_LANGS } from "./letter";

/**
 * The three legal documents. Each maps to a `{slug}.md` file under every
 * `content/legal/{lang}/` directory and to a `/{slug}` route.
 */
export const LEGAL_SLUGS = ["privacy", "terms", "accessibility"] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

/**
 * Supported languages — reused verbatim from the letter schema so the
 * two sets can never drift (`en/es/fr/ar/pt`). Only `en` files exist
 * today; the other locales fall back to English at load time until
 * UNICEF supplies translations (see `getLegalPage`).
 */
export { LETTER_LANGS as LEGAL_LANGS } from "./letter";
export type { LetterLang as LegalLang } from "./letter";

export const legalFrontmatterSchema = z.object({
	/** The document's display title — rendered as the page `<h1>`. */
	title: z.string().min(1),

	/**
	 * Human-readable "last revised" string (e.g. `"June 2026"`), rendered
	 * verbatim. Deliberately a free-text string, not a parsed date: the
	 * wording is part of the UNICEF-approved copy, so reformatting it
	 * risks showing a day that was never signed off.
	 */
	lastUpdated: z.string().min(1),

	/** BCP 47 language tag — must match the file's parent directory. */
	lang: z.enum(LETTER_LANGS),

	/** Which document this is — must match the file's basename. */
	slug: z.enum(LEGAL_SLUGS),
});

export type LegalFrontmatter = z.infer<typeof legalFrontmatterSchema>;
