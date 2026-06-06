/**
 * Row triage (DEV-104) — pure classification of each intake row into a
 * status plus the report flags that explain it. No IO, no network: the
 * offline reader runs this over the real `.xlsx` to produce the plan the
 * campaign team eyeballs before any upload.
 *
 * Status precedence (first match wins):
 *   1. BLOCKED               — fails a Phase-A gate; never uploaded.
 *                              (no consent / age out of 15–25 / no video)
 *   2. MEDIA-ONLY (schema)   — media uploads, but the row can't satisfy
 *                              `voiceSchema` (over-length quote, missing
 *                              theme, unmapped country/language).
 *   3. NEEDS-FOLDER-RESOLVE  — schema-valid, but the video link is a
 *                              folder whose child must be resolved first.
 *   4. MEDIA-ONLY (held)     — schema-valid + direct file, but held from
 *                              auto-publish pending an editorial nod
 *                              (multi-token name, or a defaulted language).
 *   5. READY                 — upload + auto-publish.
 *
 * Age is a Phase-A gate per the DEV-104 spec: an out-of-range row can
 * never publish, so we don't burn a Stream upload on it. (This is the one
 * deliberate divergence from the pre-DEV-96 planning snapshot, which
 * counted those rows as media-only.)
 */

import { THEMES, voiceSchema, type Theme } from "~/lib/voice";

import { parseDriveLink, type DriveRef } from "./drive";
import {
	ageInRange,
	checkConsent,
	coerceAge,
	normaliseQuote,
	proposeFirstName,
	resolveCountry,
	resolveLanguage,
	slugify,
	type NameProposal,
	type Resolution,
} from "./normalise";
import type { IntakeRow } from "./intake";

export type TriageStatus = "ready" | "needs-folder-resolve" | "media-only" | "blocked";

/** Placeholder for the upload-supplied videoId while checking schema validity. */
const PLACEHOLDER_VIDEO_ID = "0000000000000000";
/** Placeholder publishedAt; the real value is assigned once, at apply time. */
const PLACEHOLDER_PUBLISHED_AT = "2026-01-01T00:00:00Z";

/** Orthogonal report flags — a row can carry several at once. */
export interface ReviewFlags {
	readonly noConsent: boolean;
	readonly noVideo: boolean;
	readonly ageOutOfRange: boolean;
	readonly quoteTooLong: boolean;
	readonly themeMissing: boolean;
	readonly unmappedCountry: boolean;
	readonly unmappedLanguage: boolean;
	readonly languageDefaulted: boolean;
	readonly nameNeedsReview: boolean;
	readonly givenNameLast: boolean;
	readonly videoIsFolder: boolean;
}

export interface RowAssessment {
	readonly row: IntakeRow;
	readonly status: TriageStatus;
	/** Human-readable reasons this row isn't READY (empty when READY). */
	readonly reasons: readonly string[];
	readonly flags: ReviewFlags;

	// Normalised pieces (carried so Phase B / the report don't redo the work).
	readonly consentOk: boolean;
	readonly age: number | null;
	readonly video: DriveRef | null;
	readonly photo: DriveRef | null;
	readonly country: Resolution<string>;
	readonly language: Resolution<string>;
	readonly name: NameProposal;
	readonly quote: string;
	readonly theme: Theme | null;
	/** The proposed slug stem (`<firstname>-<cc>`), before the `-NN` suffix. */
	readonly slugStem: string | null;
	/** True when the editable fields satisfy `voiceSchema`. */
	readonly schemaValid: boolean;
}

function isTheme(value: string): value is Theme {
	return (THEMES as readonly string[]).includes(value);
}

/**
 * Assess one intake row. Pure — the same row always yields the same
 * assessment. `givenNameLast` country codes (Vietnamese) flip the name
 * proposal to the last token, but such rows are held regardless.
 */
export function assessRow(row: IntakeRow): RowAssessment {
	const consentOk = checkConsent(row.consent);
	const age = coerceAge(row.age);
	const ageOk = ageInRange(age);
	const video = parseDriveLink(row.videoLink);
	const photo = parseDriveLink(row.photoLink);
	const country = resolveCountry(row.country);
	const language = resolveLanguage(row.language);

	const givenNameLast = country.ok && country.value === "VN";
	const name = proposeFirstName(row.name, { givenNameLast });

	const quote = normaliseQuote(row.quote);
	const themeToken = row.theme.trim().toLowerCase();
	const theme = isTheme(themeToken) ? themeToken : null;

	const slugStem =
		name.firstName !== "" && country.ok
			? `${slugify(name.firstName)}-${country.value.toLowerCase()}`
			: null;

	// Build a candidate with placeholders for the upload-supplied fields
	// and run the real schema, so "passes the script" == "passes the
	// 2-hourly pipeline" by construction.
	const candidate: Record<string, unknown> = {
		id: slugStem ? `${slugStem}-01` : "",
		firstName: name.firstName,
		age: age ?? Number.NaN,
		countryCode: country.ok ? country.value : "",
		city: row.city,
		theme: theme ?? "",
		pullQuote: quote,
		language: language.ok ? language.value : "",
		videoId: PLACEHOLDER_VIDEO_ID,
		publishedAt: PLACEHOLDER_PUBLISHED_AT,
	};
	const parsed = voiceSchema.safeParse(candidate);
	const schemaValid = parsed.success;

	const flags: ReviewFlags = {
		noConsent: !consentOk,
		noVideo: video === null,
		ageOutOfRange: !ageOk,
		quoteTooLong: quote.length > 120,
		themeMissing: theme === null,
		unmappedCountry: !country.ok,
		unmappedLanguage: !language.ok,
		languageDefaulted: language.ok && language.note !== undefined,
		nameNeedsReview: name.needsReview,
		givenNameLast,
		videoIsFolder: video?.kind === "folder",
	};

	const reasons: string[] = [];
	if (flags.noConsent) reasons.push(`consent not "yes" (got "${row.consent.trim() || "blank"}")`);
	if (flags.noVideo) reasons.push("no resolvable video link");
	if (flags.ageOutOfRange) reasons.push(`age out of 15–25 (got "${row.age.trim() || "blank"}")`);
	if (!country.ok) reasons.push(country.reason);
	if (!language.ok) reasons.push(language.reason);
	if (flags.themeMissing)
		reasons.push(row.theme.trim() ? `unknown theme "${row.theme.trim()}"` : "theme missing");
	if (flags.quoteTooLong) reasons.push(`quote ${quote.length} chars (>120)`);
	if (flags.languageDefaulted && language.ok && language.note) reasons.push(language.note);
	if (flags.nameNeedsReview) {
		reasons.push(
			givenNameLast
				? `name review (Vietnamese, given-name-last): propose "${name.firstName}" from "${row.name.trim()}"`
				: `name review (multi-token): propose "${name.firstName}" from "${row.name.trim()}"`,
		);
	}
	if (flags.videoIsFolder) reasons.push("video link is a Drive folder — resolve to the file");

	const status = classify(flags, schemaValid);

	return {
		row,
		status,
		reasons,
		flags,
		consentOk,
		age,
		video,
		photo,
		country,
		language,
		name,
		quote,
		theme,
		slugStem,
		schemaValid,
	};
}

/** Apply the status precedence described in the module header. */
function classify(flags: ReviewFlags, schemaValid: boolean): TriageStatus {
	if (flags.noConsent || flags.noVideo || flags.ageOutOfRange) return "blocked";
	if (!schemaValid) return "media-only";
	if (flags.videoIsFolder) return "needs-folder-resolve";
	if (flags.nameNeedsReview || flags.languageDefaulted) return "media-only";
	return "ready";
}

/** Assess every row in input order. */
export function assessRows(rows: readonly IntakeRow[]): readonly RowAssessment[] {
	return rows.map(assessRow);
}
