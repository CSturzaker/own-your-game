/**
 * Triage report (DEV-104) — the campaign team's first-class deliverable.
 *
 * The whole point of the tool for the team is this report: which rows
 * publish, which are held, and exactly why. It's pure (assessments →
 * model → text) so it can be unit-tested and printed identically in
 * `--dry-run` and `--apply`.
 */

import type { RowAssessment, TriageStatus } from "./triage";

export interface StatusCounts {
	readonly ready: number;
	readonly needsFolderResolve: number;
	readonly mediaOnly: number;
	readonly blocked: number;
	readonly total: number;
}

export interface ReportModel {
	readonly counts: StatusCounts;
	readonly consentHeld: readonly RowAssessment[];
	readonly longQuotes: readonly RowAssessment[];
	readonly nameReview: readonly RowAssessment[];
	readonly folderResolve: readonly RowAssessment[];
	readonly unmappedCountry: readonly RowAssessment[];
	readonly unmappedLanguage: readonly RowAssessment[];
	readonly languageDefaulted: readonly RowAssessment[];
	readonly themeMissing: readonly RowAssessment[];
}

function count(assessments: readonly RowAssessment[], status: TriageStatus): number {
	return assessments.filter((a) => a.status === status).length;
}

/** Reduce assessments to the report model (counts + the report lists). */
export function buildReport(assessments: readonly RowAssessment[]): ReportModel {
	return {
		counts: {
			ready: count(assessments, "ready"),
			needsFolderResolve: count(assessments, "needs-folder-resolve"),
			mediaOnly: count(assessments, "media-only"),
			blocked: count(assessments, "blocked"),
			total: assessments.length,
		},
		consentHeld: assessments.filter((a) => a.flags.noConsent),
		longQuotes: assessments.filter((a) => a.flags.quoteTooLong),
		nameReview: assessments.filter((a) => a.flags.nameNeedsReview),
		folderResolve: assessments.filter((a) => a.flags.videoIsFolder),
		unmappedCountry: assessments.filter((a) => a.flags.unmappedCountry),
		unmappedLanguage: assessments.filter((a) => a.flags.unmappedLanguage),
		languageDefaulted: assessments.filter((a) => a.flags.languageDefaulted),
		themeMissing: assessments.filter((a) => a.flags.themeMissing),
	};
}

function label(a: RowAssessment): string {
	const who = a.row.name.trim() || "(no name)";
	const where = a.row.country.trim() || "??";
	return `row ${a.row.rowNumber} · ${who} (${where})`;
}

function section(
	title: string,
	rows: readonly RowAssessment[],
	line: (a: RowAssessment) => string,
): string {
	if (rows.length === 0) return `\n${title}: none`;
	const body = rows.map((a) => `  - ${line(a)}`).join("\n");
	return `\n${title} (${rows.length}):\n${body}`;
}

/**
 * Format the full text report. `apply` toggles the mode banner only —
 * the plan and the held lists are identical either way, by design.
 */
export function formatReport(
	assessments: readonly RowAssessment[],
	opts: { readonly apply: boolean; readonly input: string },
): string {
	const m = buildReport(assessments);
	const c = m.counts;

	const lines: string[] = [];
	lines.push("=== DEV-104 intake triage ===");
	lines.push(`input: ${opts.input}`);
	lines.push(
		`mode:  ${opts.apply ? "--apply (will upload + write)" : "--dry-run (no uploads, no writes)"}`,
	);
	lines.push("");
	lines.push("status:");
	lines.push(`  READY                ${c.ready}`);
	lines.push(`  NEEDS-FOLDER-RESOLVE ${c.needsFolderResolve}`);
	lines.push(`  MEDIA-ONLY           ${c.mediaOnly}`);
	lines.push(`  BLOCKED              ${c.blocked}`);
	lines.push(`  total                ${c.total}`);

	// A row's media is uploadable iff it cleared the Phase-A gates
	// (READY, NEEDS-FOLDER-RESOLVE, or MEDIA-ONLY). BLOCKED never uploads.
	const uploadable = assessments.filter((a) => a.status !== "blocked");
	const publishable = assessments.filter((a) => a.status === "ready");
	lines.push("");
	lines.push("plan:");
	lines.push(
		`  media-eligible rows: ${uploadable.length} (video + portrait uploads, gated by consent/video)`,
	);
	lines.push(
		`  auto-publishable now: ${publishable.length} (clean schema, direct-file video, single-token name)`,
	);

	lines.push(section("Consent held — never uploaded or written", m.consentHeld, label));
	lines.push(
		section(
			"Quotes over 120 chars — editorial trim, never truncated",
			m.longQuotes,
			(a) => `${label(a)} — ${a.quote.length} chars`,
		),
	);
	lines.push(
		section(
			"Name review — multi-token (surname never published)",
			m.nameReview,
			(a) =>
				`${label(a)} — propose "${a.name.firstName}"${a.flags.givenNameLast ? " (VN given-name-last)" : ""}`,
		),
	);
	lines.push(
		section(
			"Folder Drive links — resolve to a file by MIME",
			m.folderResolve,
			(a) => `${label(a)} — ${a.video?.kind === "folder" ? a.video.id : "?"}`,
		),
	);
	lines.push(
		section(
			"Unmapped country",
			m.unmappedCountry,
			(a) => `${label(a)} — "${a.row.country.trim()}"`,
		),
	);
	lines.push(
		section(
			"Unmapped language",
			m.unmappedLanguage,
			(a) => `${label(a)} — "${a.row.language.trim() || "blank"}"`,
		),
	);
	lines.push(
		section(
			"Language defaulted — confirm",
			m.languageDefaulted,
			(a) => `${label(a)} — "${a.row.language.trim()}" → ${a.language.ok ? a.language.value : "?"}`,
		),
	);
	lines.push(
		section(
			"Theme missing/unknown — blocked from CSV (media may still upload)",
			m.themeMissing,
			(a) => `${label(a)} — "${a.row.theme.trim() || "blank"}"`,
		),
	);

	return lines.join("\n") + "\n";
}
