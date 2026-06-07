/**
 * Campaign-sheet merge (DEV-104) — pure CSV merge semantics.
 *
 * A re-run is a MERGE, not a regenerate. The rules (all enforced here, no
 * IO):
 *  - Match an existing campaign row to a candidate by `id` (the voiceId).
 *  - Fill-only-blank: fill empty cells from the candidate, append new
 *    rows, but NEVER modify a cell that already has a value — this is
 *    what protects editorial edits (trimmed quotes, assigned themes) made
 *    directly in the sheet.
 *  - `id` and `publishedAt` are immutable once written.
 *  - Never delete a campaign row; a row that dropped out of intake is
 *    reported as a divergence, not evicted.
 *  - Where a candidate value differs from a non-empty sheet value, report
 *    the conflict — never auto-resolve.
 *
 * Output target is a reviewed CSV the team imports (open question #1
 * default), not a direct write to the live Google Sheet.
 */

import Papa from "papaparse";

import { REQUIRED_FIELDS, type RequiredField } from "../pipeline/headers";
import type { Voice } from "~/lib/voice";

/** A campaign row as string cells, keyed by schema field. */
export type CampaignRow = Record<RequiredField, string>;

/**
 * Human column headers, in canonical order, paired with their schema
 * field. Matches the published sheet + `docs/ops/sample-voices-sheet.csv`
 * and round-trips through the pipeline's `normaliseHeader`.
 */
export const CAMPAIGN_COLUMNS: ReadonlyArray<readonly [header: string, field: RequiredField]> = [
	["ID", "id"],
	["First name", "firstName"],
	["Age", "age"],
	["Country code", "countryCode"],
	["City", "city"],
	["Theme", "theme"],
	["Pull quote", "pullQuote"],
	["Language", "language"],
	["Video ID", "videoId"],
	["Portrait image ID", "portraitImageId"],
	["Published at", "publishedAt"],
];

/** Fields that, once written, are never changed or conflict-checked. */
const IMMUTABLE_FIELDS: ReadonlySet<RequiredField> = new Set(["id", "publishedAt"]);

const HEADER_BY_FIELD = new Map(CAMPAIGN_COLUMNS.map(([h, f]) => [f, h]));

function emptyRow(): CampaignRow {
	return Object.fromEntries(REQUIRED_FIELDS.map((f) => [f, ""])) as CampaignRow;
}

/** Serialise a validated Voice into a string-cell campaign row. */
export function voiceToRow(voice: Voice): CampaignRow {
	return {
		id: voice.id,
		firstName: voice.firstName,
		age: String(voice.age),
		countryCode: voice.countryCode,
		city: voice.city,
		theme: voice.theme,
		pullQuote: voice.pullQuote,
		language: voice.language,
		videoId: voice.videoId,
		portraitImageId: voice.portraitImageId ?? "",
		publishedAt: voice.publishedAt,
	};
}

/**
 * Parse an existing campaign CSV into rows keyed by schema field. Header
 * matching reuses the pipeline's normalisation so any header casing the
 * sheet uses is accepted. Unknown columns are ignored; missing columns
 * come back blank.
 */
export function parseCampaignCsv(csv: string): CampaignRow[] {
	const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });
	const matrix = parsed.data;
	const headerRow = matrix[0] ?? [];
	const fieldByCol = new Map<number, RequiredField>();
	headerRow.forEach((h, i) => {
		const norm = h.toLowerCase().replace(/[\s_-]+/g, "");
		const match = CAMPAIGN_COLUMNS.find(
			([label]) => label.toLowerCase().replace(/[\s_-]+/g, "") === norm,
		);
		if (match) fieldByCol.set(i, match[1]);
	});
	const rows: CampaignRow[] = [];
	for (let i = 1; i < matrix.length; i++) {
		const cells = matrix[i] ?? [];
		const row = emptyRow();
		for (const [col, field] of fieldByCol) row[field] = (cells[col] ?? "").trim();
		rows.push(row);
	}
	return rows;
}

/** Serialise merged rows to CSV with the canonical human headers. */
export function serialiseCampaignCsv(rows: readonly CampaignRow[]): string {
	const header = CAMPAIGN_COLUMNS.map(([h]) => h);
	const data = rows.map((r) => CAMPAIGN_COLUMNS.map(([, f]) => r[f]));
	return `${Papa.unparse([header, ...data], { newline: "\n" })}\n`;
}

export interface FieldConflict {
	readonly id: string;
	readonly field: RequiredField;
	readonly header: string;
	readonly existing: string;
	readonly candidate: string;
}

export interface MergeResult {
	readonly rows: readonly CampaignRow[];
	/** Candidate ids appended as brand-new rows. */
	readonly appended: readonly string[];
	/** `${id}.${field}` blanks filled from the candidate. */
	readonly filled: readonly string[];
	/** Non-empty cells where the candidate disagrees (kept the sheet value). */
	readonly conflicts: readonly FieldConflict[];
	/** Existing rows with no matching candidate (kept; never deleted). */
	readonly divergences: readonly string[];
}

/**
 * Merge candidate rows into the existing campaign rows under the
 * fill-only-blank / never-delete / report-conflicts rules. Pure: returns
 * a new row set plus the report deltas, mutating nothing.
 */
export function mergeRows(
	existing: readonly CampaignRow[],
	candidates: readonly CampaignRow[],
): MergeResult {
	const byId = new Map<string, CampaignRow>();
	const order: string[] = [];
	for (const row of existing) {
		const id = row.id;
		if (id === "") continue;
		byId.set(id, { ...row });
		order.push(id);
	}

	const appended: string[] = [];
	const filled: string[] = [];
	const conflicts: FieldConflict[] = [];
	const candidateIds = new Set<string>();

	for (const cand of candidates) {
		candidateIds.add(cand.id);
		const current = byId.get(cand.id);
		if (!current) {
			byId.set(cand.id, { ...cand });
			order.push(cand.id);
			appended.push(cand.id);
			continue;
		}
		for (const field of REQUIRED_FIELDS) {
			if (IMMUTABLE_FIELDS.has(field)) continue;
			const have = current[field];
			const want = cand[field];
			if (want === "") continue;
			if (have === "") {
				current[field] = want;
				filled.push(`${cand.id}.${field}`);
			} else if (have !== want) {
				conflicts.push({
					id: cand.id,
					field,
					header: HEADER_BY_FIELD.get(field) ?? field,
					existing: have,
					candidate: want,
				});
			}
		}
	}

	const divergences = order.filter((id) => !candidateIds.has(id));
	const rows = order.map((id) => byId.get(id) as CampaignRow);
	return { rows, appended, filled, conflicts, divergences };
}
