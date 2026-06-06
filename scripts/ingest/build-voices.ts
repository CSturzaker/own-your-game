#!/usr/bin/env tsx
/**
 * build-voices — DEV-104 intake → Cloudflare → campaign-sheet ingest.
 *
 * A standalone ops tool, run by hand from a dev machine with
 * credentials. NOT part of CI and NOT part of the 2-hourly pipeline.
 *
 * Built in layers (see scripts/ingest/README.md): this entrypoint
 * currently wires Layer 1 — the offline reader + triage report. It reads
 * the intake `.xlsx`, classifies every row, and prints the report. No
 * network, no writes. `--dry-run` is the default; `--apply` (which
 * performs uploads and emits the campaign CSV) is added in later layers.
 *
 *   pnpm tsx scripts/ingest/build-voices.ts [--input <path>] [--apply]
 */

import { fileURLToPath } from "node:url";

import { readIntake, REQUIRED_INTAKE_FIELDS, type IntakeHeaderIndex } from "./intake";
import { formatReport } from "./report";
import { assessRows } from "./triage";

const DEFAULT_INPUT = "content/Youth video list for website.xlsx";

interface Cli {
	readonly input: string;
	readonly apply: boolean;
}

function parseArgs(argv: readonly string[]): Cli {
	let input = DEFAULT_INPUT;
	let apply = false;
	const rest = [...argv];
	while (rest.length > 0) {
		const arg = rest.shift() as string;
		if (arg === "--apply") {
			apply = true;
		} else if (arg === "--dry-run") {
			apply = false;
		} else if (arg === "--input") {
			const value = rest.shift();
			if (!value) {
				console.error("--input requires a path");
				process.exit(2);
			}
			input = value;
		} else if (arg.startsWith("--input=")) {
			input = arg.slice("--input=".length);
		} else {
			console.error(`Unknown argument: ${arg}`);
			console.error("Usage: build-voices.ts [--input <path>] [--apply]");
			process.exit(2);
		}
	}
	return { input, apply };
}

/** Abort with a clear message when the sheet is missing required columns. */
function assertHeaders(header: IntakeHeaderIndex): void {
	if (header.missing.length === 0 && header.duplicates.length === 0) return;
	console.error("✗ Intake sheet header problem — cannot proceed.");
	if (header.missing.length > 0) {
		console.error(`  Missing required columns: ${header.missing.join(", ")}`);
		console.error(`  (required: ${REQUIRED_INTAKE_FIELDS.join(", ")})`);
	}
	if (header.duplicates.length > 0) {
		console.error(`  Duplicate columns: ${header.duplicates.join(", ")}`);
	}
	process.exit(1);
}

function main(): void {
	const cli = parseArgs(process.argv.slice(2));

	let intake;
	try {
		intake = readIntake(cli.input);
	} catch (err) {
		console.error(`Could not read intake sheet at ${cli.input}: ${(err as Error).message}`);
		process.exit(1);
	}

	assertHeaders(intake.header);

	const assessments = assessRows(intake.rows);
	process.stdout.write(formatReport(assessments, { apply: cli.apply, input: cli.input }));

	if (cli.apply) {
		console.error(
			"\n--apply is not wired yet (Phase A/B land in later layers). No uploads or writes performed.",
		);
		process.exit(3);
	}
}

const isDirectInvoke = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectInvoke) {
	main();
}

export { parseArgs };
