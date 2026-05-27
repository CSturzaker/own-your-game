#!/usr/bin/env tsx
/**
 * fetch-voices — sheet → content/voices.json pipeline entrypoint.
 *
 * Reads the published CSV URL from `VOICES_SHEET_CSV_URL`, runs the
 * pure pipeline in `scripts/pipeline/`, and writes the result.
 *
 * Behaviour by exit code:
 *   0 - success, file written (unless --dry-run)
 *   1 - header error (sheet's columns don't match the schema)
 *   2 - validation failures in one or more rows; Slack notified
 *   3 - infrastructure failure (network, file write, env var missing)
 *
 * Invoke via:
 *
 *     pnpm sync:voices [--dry-run] [--verbose]
 *
 * Environment:
 *
 *     VOICES_SHEET_CSV_URL         (required) published-to-web CSV URL
 *     SLACK_PIPELINE_WEBHOOK_URL   (optional) Slack incoming webhook
 *     OUTPUT_PATH                  (optional) defaults to content/voices.json
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { formatSlackMessage, postToSlack } from "./pipeline/slack";
import { isHeaderError, processCsv } from "./pipeline/run";

interface Cli {
	readonly dryRun: boolean;
	readonly verbose: boolean;
}

function parseArgs(argv: readonly string[]): Cli {
	const cli: Cli = {
		dryRun: argv.includes("--dry-run"),
		verbose: argv.includes("--verbose"),
	};
	const unknown = argv.filter((a) => a !== "--dry-run" && a !== "--verbose");
	if (unknown.length > 0) {
		console.error(`Unknown flags: ${unknown.join(", ")}`);
		console.error("Usage: pnpm sync:voices [--dry-run] [--verbose]");
		process.exit(3);
	}
	return cli;
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		console.error(`Missing required environment variable: ${name}`);
		process.exit(3);
	}
	return value;
}

async function main(): Promise<void> {
	const cli = parseArgs(process.argv.slice(2));
	const url = requireEnv("VOICES_SHEET_CSV_URL");
	const outputPath = resolve(process.cwd(), process.env.OUTPUT_PATH ?? "content/voices.json");
	const slackUrl = process.env.SLACK_PIPELINE_WEBHOOK_URL ?? null;

	let csv: string;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(`Sheet fetch failed: HTTP ${response.status}`);
			process.exit(3);
		}
		csv = await response.text();
	} catch (err) {
		console.error(`Sheet fetch failed: ${(err as Error).message}`);
		process.exit(3);
	}

	const run = processCsv({ csv, now: new Date() });

	if (isHeaderError(run)) {
		console.error("✗ Sheet header mismatch — cannot proceed.");
		if (run.missing.length > 0) {
			console.error(`  Missing columns: ${run.missing.join(", ")}`);
		}
		if (run.duplicates.length > 0) {
			console.error(`  Duplicate columns: ${run.duplicates.join(", ")}`);
		}
		// Header errors are loud enough on stdout. Slack still gets a
		// ping so the campaign team knows the next pipeline run will
		// fail until they fix the headers.
		if (slackUrl) {
			const message =
				`*Voices sheet header mismatch* — pipeline cannot run.\n` +
				(run.missing.length > 0 ? `  Missing: ${run.missing.join(", ")}\n` : "") +
				(run.duplicates.length > 0 ? `  Duplicates: ${run.duplicates.join(", ")}\n` : "") +
				`See \`docs/ops/sheet-schema.md\` for the expected column list.`;
			await postToSlack(slackUrl, message);
		}
		process.exit(1);
	}

	const { voicesFile, rejected, skipped, deferred } = run;

	if (cli.verbose) {
		printVerboseSummary(run);
	}

	printSummary({ run, dryRun: cli.dryRun });

	if (rejected.length > 0) {
		const message = formatSlackMessage(rejected);
		if (slackUrl) {
			const ok = await postToSlack(slackUrl, message);
			if (!ok) console.error("Warning: Slack post failed.");
		} else {
			console.error("\n--- Slack message (no webhook configured) ---\n");
			console.error(message);
		}
		process.exit(2);
	}

	if (cli.dryRun) {
		console.log("--dry-run: skipping file write.");
		return;
	}

	const json = `${JSON.stringify(voicesFile, null, 2)}\n`;
	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, json, "utf8");
	console.log(`Wrote ${outputPath}: ${voicesFile.voices.length} voice(s).`);

	// Touch the deferred / skipped counts so they're visible even
	// in non-verbose runs.
	if (deferred.length > 0) {
		console.log(`Deferred ${deferred.length} future-dated row(s) until publishedAt.`);
	}
	if (skipped.length > 0) {
		console.log(`Skipped ${skipped.length} row(s) (empty or no Stream UID).`);
	}
}

function printSummary(args: {
	run: Exclude<ReturnType<typeof processCsv>, { kind: "header-error" }>;
	dryRun: boolean;
}): void {
	const { run, dryRun } = args;
	const themes = new Set(run.voicesFile.voices.map((v) => v.theme));
	const countries = new Set(run.voicesFile.voices.map((v) => v.countryCode));
	console.log("--- pipeline summary ---");
	console.log(`  voices:    ${run.voicesFile.voices.length}`);
	console.log(`  themes:    ${themes.size}`);
	console.log(`  countries: ${countries.size}`);
	console.log(`  rejected:  ${run.rejected.length}`);
	console.log(`  skipped:   ${run.skipped.length}`);
	console.log(`  deferred:  ${run.deferred.length}`);
	if (dryRun) console.log("  mode:      --dry-run");
}

function printVerboseSummary(
	run: Exclude<ReturnType<typeof processCsv>, { kind: "header-error" }>,
): void {
	for (const v of run.voicesFile.voices) {
		console.log(`  ✓ row ?  id=${v.id}  ${v.firstName} (${v.countryCode}) — ${v.theme}`);
	}
	for (const r of run.deferred) {
		console.log(`  ⏳ row ${r.rowNumber}  id=${r.voice.id}  scheduled for ${r.voice.publishedAt}`);
	}
	for (const r of run.skipped) {
		console.log(`  · row ${r.rowNumber}  skipped (${r.reason})`);
	}
	for (const r of run.rejected) {
		const idTag = r.id ? ` id=${r.id}` : "";
		console.log(`  ✗ row ${r.rowNumber}${idTag}`);
		for (const e of r.errors) console.log(`      ${e}`);
	}
}

// Run when invoked directly (not when imported by tests).
const isDirectInvoke = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectInvoke) {
	main().catch((err: unknown) => {
		console.error("Pipeline crashed:", err);
		process.exit(3);
	});
}
