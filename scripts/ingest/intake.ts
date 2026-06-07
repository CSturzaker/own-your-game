/**
 * Intake spreadsheet reader (DEV-104) — the `Youth video list for
 * website.xlsx` the country offices fill in.
 *
 * This is NOT the campaign voices sheet. Its columns are descriptive
 * prose headers (`"Country (in alphabetical order)"`, `"Consent form
 * signed (yes/no)"`) with stray trailing whitespace, and editorial may
 * add the Theme column anywhere — so columns are matched by normalised
 * keyword, never by position. Reading is the only IO here; everything
 * the row carries is a raw trimmed string for the pure layer to
 * normalise.
 */

import { readFileSync } from "node:fs";

import * as XLSX from "xlsx";

/** Canonical intake columns. `theme`/`photoLink` are optional (may be absent). */
export const INTAKE_FIELDS = [
	"country",
	"name",
	"age",
	"city",
	"theme",
	"quote",
	"videoLink",
	"photoLink",
	"consent",
	"language",
] as const;

export type IntakeField = (typeof INTAKE_FIELDS)[number];

/**
 * Columns whose absence aborts the run — there's nothing useful we can
 * produce without them. `theme` and `photoLink` are deliberately not
 * here: a missing Theme column is handled gracefully (every row reported
 * theme-missing), and a missing Photo column just means no portraits.
 */
export const REQUIRED_INTAKE_FIELDS: readonly IntakeField[] = [
	"country",
	"name",
	"age",
	"city",
	"quote",
	"videoLink",
	"consent",
	"language",
];

/**
 * Field → ordered keyword predicates over the normalised (trim +
 * lowercase) header text. First field whose predicate matches claims the
 * column; the order guards against overlap (e.g. `city/town`).
 */
const FIELD_MATCHERS: ReadonlyArray<readonly [IntakeField, (h: string) => boolean]> = [
	["country", (h) => h.includes("country")],
	["name", (h) => h.includes("name")],
	["age", (h) => h === "age" || h.startsWith("age")],
	["city", (h) => h.includes("city") || h.includes("town")],
	["theme", (h) => h.includes("theme")],
	["quote", (h) => h.includes("quote")],
	["videoLink", (h) => h.includes("video")],
	["photoLink", (h) => h.includes("photo") || h.includes("image")],
	["consent", (h) => h.includes("consent")],
	["language", (h) => h.includes("language")],
];

/** Match one header cell to its intake field, or `null` if unrecognised. */
export function intakeHeaderToField(header: string): IntakeField | null {
	const h = header.trim().toLowerCase();
	if (h === "") return null;
	for (const [field, test] of FIELD_MATCHERS) {
		if (test(h)) return field;
	}
	return null;
}

export interface IntakeHeaderIndex {
	readonly columns: ReadonlyMap<IntakeField, number>;
	readonly missing: readonly IntakeField[];
	readonly duplicates: readonly IntakeField[];
}

/** Build the field → column-index map from the header row. */
export function buildIntakeHeaderIndex(headerRow: readonly string[]): IntakeHeaderIndex {
	const columns = new Map<IntakeField, number>();
	const seenTwice = new Set<IntakeField>();

	headerRow.forEach((header, index) => {
		const field = intakeHeaderToField(header);
		if (!field) return;
		if (columns.has(field)) {
			seenTwice.add(field);
			return;
		}
		columns.set(field, index);
	});

	const missing = REQUIRED_INTAKE_FIELDS.filter((f) => !columns.has(f));
	const duplicates = INTAKE_FIELDS.filter((f) => seenTwice.has(f));
	return { columns, missing, duplicates };
}

/**
 * One intake row, raw. `rowNumber` is the 1-based spreadsheet row the
 * office sees (header is row 1, first data row is 2) so report lines are
 * actionable. Optional columns come back as `""` when absent.
 */
export interface IntakeRow {
	readonly rowNumber: number;
	readonly country: string;
	readonly name: string;
	readonly age: string;
	readonly city: string;
	readonly theme: string;
	readonly quote: string;
	readonly videoLink: string;
	readonly photoLink: string;
	readonly consent: string;
	readonly language: string;
}

export interface IntakeFile {
	readonly header: IntakeHeaderIndex;
	readonly rows: readonly IntakeRow[];
}

/** True when every cell in the row is blank after trimming. */
function isBlankRow(cells: readonly string[]): boolean {
	return cells.every((c) => c.trim() === "");
}

/**
 * Map a raw cell array to an `IntakeRow` using the header index. Cells
 * the sheet doesn't supply (or that fall past the row's length) become
 * empty strings; values are trimmed.
 */
function toIntakeRow(
	cells: readonly string[],
	columns: ReadonlyMap<IntakeField, number>,
	rowNumber: number,
): IntakeRow {
	const get = (field: IntakeField): string => {
		const idx = columns.get(field);
		if (idx === undefined) return "";
		return (cells[idx] ?? "").trim();
	};
	return {
		rowNumber,
		country: get("country"),
		name: get("name"),
		age: get("age"),
		city: get("city"),
		theme: get("theme"),
		quote: get("quote"),
		videoLink: get("videoLink"),
		photoLink: get("photoLink"),
		consent: get("consent"),
		language: get("language"),
	};
}

/**
 * Turn a parsed worksheet (array-of-arrays, header in row 0) into the
 * header index plus the data rows. Blank rows are dropped (offices leave
 * them behind), so they never count as errors. Pure given the matrix —
 * the only IO is in `readIntake`.
 */
export function parseIntakeMatrix(matrix: ReadonlyArray<readonly string[]>): IntakeFile {
	const headerRow = matrix[0] ?? [];
	const header = buildIntakeHeaderIndex(headerRow);
	const rows: IntakeRow[] = [];
	for (let i = 1; i < matrix.length; i++) {
		const cells = matrix[i] ?? [];
		if (isBlankRow(cells)) continue;
		rows.push(toIntakeRow(cells, header.columns, i + 1));
	}
	return { header, rows };
}

/**
 * Read and parse the intake `.xlsx` at `path`. The only side effect is
 * the file read; parsing is delegated to the pure `parseIntakeMatrix`.
 * Cells are coerced to strings (`raw: false`) so dates/numbers arrive as
 * the office typed them.
 */
export function readIntake(path: string): IntakeFile {
	const workbook = XLSX.read(readFileSync(path), { type: "buffer" });
	const sheetName = workbook.SheetNames[0];
	if (!sheetName) throw new Error(`intake workbook has no sheets: ${path}`);
	const sheet = workbook.Sheets[sheetName];
	if (!sheet) throw new Error(`intake workbook sheet "${sheetName}" is empty: ${path}`);
	const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
		header: 1,
		defval: "",
		raw: false,
		blankrows: false,
	});
	return parseIntakeMatrix(matrix);
}
