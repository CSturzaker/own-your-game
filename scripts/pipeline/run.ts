/**
 * Pure orchestration: CSV text in, structured pipeline result out.
 *
 * All IO (fetch, file write, Slack post) lives in the entrypoint;
 * this module is fully testable with strings.
 */

import Papa from "papaparse";

import type { Voice, VoicesFile } from "~/lib/voice";

import { buildHeaderIndex, type HeaderIndex, type RequiredField } from "./headers";
import { sortVoicesById } from "./sort";
import { filterPublished, transformRow, type RowResult } from "./transform";

export interface PipelineRun {
	/**
	 * The output file. Present even when there are rejections — the
	 * caller decides whether to write it.
	 */
	readonly voicesFile: VoicesFile;
	readonly accepted: readonly Voice[];
	readonly rejected: readonly (RowResult & { kind: "rejected" })[];
	readonly skipped: readonly (RowResult & { kind: "skipped" })[];
	readonly deferred: readonly (RowResult & { kind: "accepted" })[];
}

export interface HeaderError {
	readonly kind: "header-error";
	readonly missing: readonly RequiredField[];
	readonly duplicates: readonly RequiredField[];
}

/**
 * Parse a CSV string, build the header index, and run every data row
 * through the transform pipeline. Returns either a structured run
 * result or a header-error report (when the sheet's columns can't be
 * matched to the schema and no data is recoverable).
 */
export function processCsv(args: {
	csv: string;
	now: Date;
	/** Override schemaVersion in tests; defaults to `1`. */
	schemaVersion?: 1;
}): PipelineRun | HeaderError {
	const { csv, now } = args;

	const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: false });
	const rows = parsed.data;

	if (rows.length === 0) {
		return { kind: "header-error", missing: [], duplicates: [] };
	}

	const headerRow = rows[0] ?? [];
	const header: HeaderIndex = buildHeaderIndex(headerRow);

	if (header.missing.length > 0 || header.duplicates.length > 0) {
		return {
			kind: "header-error",
			missing: header.missing,
			duplicates: header.duplicates,
		};
	}

	const results: RowResult[] = rows.slice(1).map((row, i) => {
		// rowNumber matches the campaign team's view in Google Sheets:
		// header row is 1, first data row is 2.
		const rowNumber = i + 2;
		return transformRow(row, header, rowNumber);
	});

	const accepted = results.filter(
		(r): r is RowResult & { kind: "accepted" } => r.kind === "accepted",
	);
	const rejected = results.filter(
		(r): r is RowResult & { kind: "rejected" } => r.kind === "rejected",
	);
	const skipped = results.filter((r): r is RowResult & { kind: "skipped" } => r.kind === "skipped");

	const { emit, deferred } = filterPublished(accepted, now);
	const voices = sortVoicesById(emit.map((r) => r.voice));

	const voicesFile: VoicesFile = {
		generatedAt: now.toISOString(),
		schemaVersion: args.schemaVersion ?? 1,
		voices,
	};

	return {
		voicesFile,
		accepted: voices,
		rejected,
		skipped,
		deferred,
	};
}

/** Type guard so callers can pattern-match the discriminated union. */
export function isHeaderError(r: PipelineRun | HeaderError): r is HeaderError {
	return "kind" in r && r.kind === "header-error";
}
