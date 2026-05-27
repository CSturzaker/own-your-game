/**
 * Row → Voice transformation. Pure functions; no IO, no global state.
 *
 * The CSV parser hands the pipeline rows as `string[]` (one cell per
 * column). This module turns each row into either a validated `Voice`
 * or a structured error report, applying the row-level skip rules
 * (empty row, missing Stream UID) before validation runs.
 */

import { voiceSchema, type Voice } from "~/lib/voice";

import type { HeaderIndex, RequiredField } from "./headers";

/**
 * Outcome of running a single sheet row through the pipeline.
 *
 * - `accepted`: row passed validation and goes into `voices.json`.
 * - `rejected`: row failed validation; reported to Slack.
 * - `skipped`: row was deliberately ignored (empty, no Stream UID
 *   yet, or `publishedAt` is still in the future). Silent — neither a
 *   success nor a failure.
 */
export type RowResult =
	| { readonly kind: "accepted"; readonly rowNumber: number; readonly voice: Voice }
	| {
			readonly kind: "rejected";
			readonly rowNumber: number;
			readonly id: string | null;
			readonly errors: readonly string[];
	  }
	| {
			readonly kind: "skipped";
			readonly rowNumber: number;
			readonly reason: "empty" | "no-video" | "scheduled";
	  };

/**
 * True if every cell in the row is blank after trimming. Empty rows
 * are common in Google Sheets (the team deletes the data but leaves
 * an empty row behind) and should not count as a validation error.
 */
export function isEmptyRow(row: readonly string[]): boolean {
	return row.every((cell) => cell.trim() === "");
}

/**
 * Pull each required field's raw string out of the row using the
 * header index. Cells the sheet doesn't supply come back as empty
 * strings; the caller distinguishes "blank" from "missing".
 */
function pluck(
	row: readonly string[],
	columns: ReadonlyMap<RequiredField, number>,
): Record<RequiredField, string> {
	const result = {} as Record<RequiredField, string>;
	for (const [field, index] of columns) {
		result[field] = (row[index] ?? "").trim();
	}
	return result;
}

/**
 * Apply the schema-driven type coercions. The CSV parser yields
 * strings for everything; the schema expects an integer for `age`.
 * We do that single coercion here and leave the rest as trimmed
 * strings (the schema's `z.string()` calls handle the rest).
 *
 * `age` is coerced via `Number()` so values like "14" pass, while
 * "14.5", "fourteen", and "" fail at the schema's `int()` check.
 */
function coerce(plucked: Record<RequiredField, string>): Record<RequiredField, unknown> {
	const ageValue = plucked.age === "" ? Number.NaN : Number(plucked.age);
	return { ...plucked, age: ageValue };
}

/**
 * Transform one sheet row into a `RowResult`. The order of checks
 * matters:
 *
 * 1. Drop entirely-empty rows first (cheap; common).
 * 2. Drop rows without a Stream UID (the campaign team's "drafted"
 *    state). These pre-staged rows might fail validation in other
 *    fields too, but the team's intent is "this isn't ready yet" — we
 *    shouldn't yell about it.
 * 3. Hand the rest to Zod and translate any errors into row-scoped
 *    messages.
 *
 * @param row     - The raw cells from the CSV row.
 * @param header  - The header index built from the sheet's first row.
 * @param rowNumber - 1-based row number as the campaign team sees it
 *                    in Google Sheets (header row is `1`, first data
 *                    row is `2`, …). Used in error messages.
 */
export function transformRow(
	row: readonly string[],
	header: HeaderIndex,
	rowNumber: number,
): RowResult {
	if (isEmptyRow(row)) {
		return { kind: "skipped", rowNumber, reason: "empty" };
	}

	const plucked = pluck(row, header.columns);

	if (plucked.videoId === "") {
		return { kind: "skipped", rowNumber, reason: "no-video" };
	}

	const candidate = coerce(plucked);
	const parsed = voiceSchema.safeParse(candidate);

	if (parsed.success) {
		return { kind: "accepted", rowNumber, voice: parsed.data };
	}

	const errors = parsed.error.issues.map((issue) => {
		const path = issue.path.join(".");
		return path ? `${path}: ${issue.message}` : issue.message;
	});

	return {
		kind: "rejected",
		rowNumber,
		id: plucked.id || null,
		errors,
	};
}

/**
 * Apply the "publishedAt is in the future" filter. Returns the voices
 * that should be emitted now plus the row numbers that were deferred
 * to a later run.
 *
 * Separated from `transformRow` because future-dated rows are still
 * fully valid Voices — they just shouldn't appear on the site yet.
 * The campaign team uses this to coordinate a batch launch: stage
 * tomorrow's voices today, the next pipeline run after midnight picks
 * them up automatically.
 */
export function filterPublished(
	accepted: readonly (RowResult & { kind: "accepted" })[],
	now: Date,
): {
	readonly emit: readonly (RowResult & { kind: "accepted" })[];
	readonly deferred: readonly (RowResult & { kind: "accepted" })[];
} {
	const emit: (RowResult & { kind: "accepted" })[] = [];
	const deferred: (RowResult & { kind: "accepted" })[] = [];

	for (const result of accepted) {
		const publishedAt = new Date(result.voice.publishedAt);
		if (publishedAt.getTime() <= now.getTime()) {
			emit.push(result);
		} else {
			deferred.push(result);
		}
	}

	return { emit, deferred };
}
