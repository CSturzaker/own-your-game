#!/usr/bin/env tsx
/**
 * build-voices — DEV-104 intake → Cloudflare → campaign-sheet ingest.
 *
 * A standalone ops tool, run by hand from a dev machine with
 * credentials. NOT part of CI and NOT part of the 2-hourly pipeline.
 * See scripts/ingest/README.md for setup and the layer map.
 *
 *   pnpm tsx scripts/ingest/build-voices.ts \
 *     [--input <xlsx>] [--apply] [--campaign-csv <existing.csv>] \
 *     [--out <import.csv>] [--published-at <iso>] [--manifest <path>]
 *
 * `--dry-run` (the default) reads the intake sheet and prints the triage
 * report, touching nothing. `--apply` uploads media to Cloudflare,
 * updates the manifest atomically per asset, and writes the merged
 * campaign-import CSV for human review (open question #1: we emit a CSV,
 * we do NOT write the live Google Sheet).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { readIntake, REQUIRED_INTAKE_FIELDS, type IntakeHeaderIndex } from "./intake";
import { loadManifest, saveManifestAtomic, MANIFEST_PATH } from "./manifest";
import { parseCampaignCsv, serialiseCampaignCsv, type CampaignRow } from "./merge";
import { formatReport } from "./report";
import { assessRows } from "./triage";

const DEFAULT_INPUT = "content/Youth video list for website.xlsx";
const DEFAULT_OUT = "scripts/ingest/voices-import.csv";
const ENV_LOCAL = ".env.local";

/**
 * Auto-load `.env.local` (gitignored) so `CF_*` / `GOOGLE_APPLICATION_
 * CREDENTIALS` don't have to be exported by hand each session. Standalone
 * tsx scripts don't go through Vite, so nothing loads dotenv for us —
 * Node 22's built-in `process.loadEnvFile` does it here. Plain dotenv
 * format only (`KEY=value`, no `export`); a real shell env var already
 * set takes precedence. Missing file is fine (CI / shell-exported env).
 */
function loadLocalEnv(): void {
	if (!existsSync(ENV_LOCAL)) return;
	try {
		process.loadEnvFile(ENV_LOCAL);
		console.error(`Loaded ${ENV_LOCAL}`);
	} catch (err) {
		console.error(`Warning: could not parse ${ENV_LOCAL}: ${(err as Error).message}`);
	}
}

interface Cli {
	readonly input: string;
	readonly apply: boolean;
	readonly campaignCsv: string | null;
	readonly out: string;
	readonly publishedAt: string | null;
	readonly manifest: string;
}

function parseArgs(argv: readonly string[]): Cli {
	let input = DEFAULT_INPUT;
	let apply = false;
	let campaignCsv: string | null = null;
	let out = DEFAULT_OUT;
	let publishedAt: string | null = null;
	let manifest = MANIFEST_PATH;

	const rest = [...argv];
	const next = (flag: string): string => {
		const value = rest.shift();
		if (value === undefined) {
			console.error(`${flag} requires a value`);
			process.exit(2);
		}
		return value;
	};

	while (rest.length > 0) {
		const arg = rest.shift() as string;
		if (arg === "--apply") apply = true;
		else if (arg === "--dry-run") apply = false;
		else if (arg === "--input") input = next("--input");
		else if (arg === "--campaign-csv") campaignCsv = next("--campaign-csv");
		else if (arg === "--out") out = next("--out");
		else if (arg === "--published-at") publishedAt = next("--published-at");
		else if (arg === "--manifest") manifest = next("--manifest");
		else {
			console.error(`Unknown argument: ${arg}`);
			console.error(
				"Usage: build-voices.ts [--input <xlsx>] [--apply] [--campaign-csv <csv>] [--out <csv>] [--published-at <iso>] [--manifest <path>]",
			);
			process.exit(2);
		}
	}
	return { input, apply, campaignCsv, out, publishedAt, manifest };
}

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

function loadExistingCampaign(path: string | null): CampaignRow[] {
	if (!path) return [];
	try {
		return parseCampaignCsv(readFileSync(path, "utf8"));
	} catch (err) {
		console.error(`Could not read existing campaign CSV at ${path}: ${(err as Error).message}`);
		process.exit(1);
	}
}

async function main(): Promise<void> {
	loadLocalEnv();
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

	if (!cli.apply) return; // dry-run: report only

	// --- Phase A + B (credentialed). Lazy-import the real clients so a
	// dry-run never loads googleapis/tus or requires any env. ---
	const { createDriveClient } = await import("./drive-client");
	const { cloudflareConfigFromEnv, createCloudflareClient } = await import("./cloudflare-client");
	const { runPhaseA, runPhaseB } = await import("./orchestrate");
	const { prepareImageForUpload } = await import("./image");

	let drive, cloudflare;
	try {
		drive = createDriveClient();
		cloudflare = createCloudflareClient(cloudflareConfigFromEnv());
	} catch (err) {
		console.error(`\n✗ ${(err as Error).message}`);
		process.exit(3);
	}

	const manifest = loadManifest(cli.manifest);
	const existing = loadExistingCampaign(cli.campaignCsv);
	const publishedAt = cli.publishedAt ?? new Date().toISOString();

	console.error("\n=== phase A: uploading media to Cloudflare ===");
	const phaseA = await runPhaseA(assessments, manifest, {
		drive,
		cloudflare,
		now: () => new Date().toISOString(),
		publishedAt,
		persist: (m) => saveManifestAtomic(cli.manifest, m),
		log: (m) => console.error(m),
		prepareImage: prepareImageForUpload,
	});

	const phaseB = runPhaseB(phaseA.outcomes, phaseA.manifest, existing);

	const merged = serialiseCampaignCsv(phaseB.merge.rows);
	writeFileSync(cli.out, merged, "utf8");

	const uploadedVideos = phaseA.outcomes.filter((o) => o.streamUid && !o.reusedVideo).length;
	const reusedVideos = phaseA.outcomes.filter((o) => o.reusedVideo).length;
	const skipped = phaseA.outcomes.filter((o) => o.resolveError).length;
	const portraitIssues = phaseA.outcomes.filter((o) => o.resolveError === null && o.photoNote);

	console.log("\n=== --apply summary ===");
	console.log(`  videos uploaded:  ${uploadedVideos}`);
	console.log(`  videos reused:    ${reusedVideos}`);
	console.log(`  rows skipped (resolve error): ${skipped}`);
	console.log(`  portraits skipped/failed: ${portraitIssues.length}`);
	console.log(`  published to CSV: ${phaseB.published.length}`);
	console.log(`  held (media only): ${phaseB.held.length}`);
	console.log(`  blanks filled:    ${phaseB.merge.filled.length}`);
	console.log(`  rows appended:    ${phaseB.merge.appended.length}`);
	console.log(`  conflicts:        ${phaseB.merge.conflicts.length}`);
	console.log(`  divergences:      ${phaseB.merge.divergences.length}`);
	console.log(`  manifest:         ${cli.manifest}`);
	console.log(`  import CSV:        ${cli.out} (review before importing to the campaign sheet)`);

	for (const o of portraitIssues) {
		const firstLine = (o.photoNote ?? "").split("\n")[0];
		console.log(`  ⚠️ no portrait ${o.voiceId ?? o.assessment.row.name.trim()}: ${firstLine}`);
	}
	for (const c of phaseB.merge.conflicts) {
		console.log(
			`  ⚠️ conflict ${c.id} · ${c.header}: sheet="${c.existing}" intake="${c.candidate}" (kept sheet)`,
		);
	}
	for (const id of phaseB.merge.divergences) {
		console.log(`  ⚠️ divergence ${id}: in sheet but not in intake (kept, not deleted)`);
	}
}

const isDirectInvoke = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectInvoke) {
	main().catch((err: unknown) => {
		console.error("Ingest crashed:", err);
		process.exit(3);
	});
}

export { parseArgs };
