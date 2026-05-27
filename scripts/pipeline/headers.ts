/**
 * Header normalisation — maps sheet column headers to schema field names.
 *
 * The campaign team can type headers a few different ways and the
 * pipeline still has to recognise them: `"First name"`, `"first name"`,
 * `"first_name"`, and `"first-name"` all resolve to `firstName`. The
 * rule is "lowercase, strip whitespace/dashes/underscores, look up in
 * a fixed table." Unknown headers are silently dropped (the campaign
 * team can keep notes columns); required fields with no matching
 * column abort the whole run, because there's nothing partial we can
 * produce.
 *
 * Coordinate any change in this file with `schemas/voice.ts` and
 * `docs/ops/sheet-schema.md` — the sheet docs are the source of truth
 * for the campaign team and must agree with the lookup below.
 */

import type { Voice } from "~/lib/voice";

/**
 * Schema fields the sheet must supply. Order is the canonical column
 * order in the template — used in error messages so an engineer can
 * eyeball "what's missing" without cross-referencing the spec.
 */
export const REQUIRED_FIELDS = [
	"id",
	"firstName",
	"age",
	"countryCode",
	"city",
	"theme",
	"pullQuote",
	"language",
	"videoId",
	"portraitFile",
	"publishedAt",
] as const satisfies readonly (keyof Voice)[];

export type RequiredField = (typeof REQUIRED_FIELDS)[number];

/**
 * Normalised header text → schema field name. The normaliser strips
 * whitespace, dashes, and underscores, and lowercases everything; only
 * the resulting compact token needs an entry here.
 */
const HEADER_LOOKUP: Readonly<Record<string, RequiredField>> = {
	id: "id",
	firstname: "firstName",
	age: "age",
	countrycode: "countryCode",
	city: "city",
	theme: "theme",
	pullquote: "pullQuote",
	language: "language",
	videoid: "videoId",
	portraitfile: "portraitFile",
	publishedat: "publishedAt",
};

/**
 * Compact a header cell into its lookup key. Lowercase, strip all
 * whitespace, dashes, and underscores. `"First name"`, `"first_name"`,
 * `"First-Name"`, and `"FIRST NAME "` all collapse to `"firstname"`.
 */
export function normaliseHeader(header: string): string {
	return header.toLowerCase().replace(/[\s_-]+/g, "");
}

/**
 * Map a header cell to its schema field, or `null` if the cell isn't
 * a known column (the row's value gets ignored).
 */
export function headerToField(header: string): RequiredField | null {
	return HEADER_LOOKUP[normaliseHeader(header)] ?? null;
}

export interface HeaderIndex {
	/** Field → column index (0-based) in the original row. */
	readonly columns: ReadonlyMap<RequiredField, number>;
	/** Required fields the sheet didn't supply. */
	readonly missing: readonly RequiredField[];
	/** Required fields the sheet supplied more than once (ambiguous). */
	readonly duplicates: readonly RequiredField[];
}

/**
 * Build the column index from the sheet's header row. Returns the
 * mapping plus the list of missing / duplicate required fields so the
 * caller can decide whether to abort or proceed.
 */
export function buildHeaderIndex(headerRow: readonly string[]): HeaderIndex {
	const columns = new Map<RequiredField, number>();
	const seenTwice = new Set<RequiredField>();

	headerRow.forEach((header, index) => {
		const field = headerToField(header);
		if (!field) return;
		if (columns.has(field)) {
			seenTwice.add(field);
			return;
		}
		columns.set(field, index);
	});

	const missing = REQUIRED_FIELDS.filter((f) => !columns.has(f));
	const duplicates = REQUIRED_FIELDS.filter((f) => seenTwice.has(f));

	return { columns, missing, duplicates };
}
