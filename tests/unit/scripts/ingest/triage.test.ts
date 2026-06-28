import { describe, expect, it } from "vitest";

import type { IntakeRow } from "../../../../scripts/ingest/intake";
import { assessRow, assessRows, findDuplicateVideoLinks } from "../../../../scripts/ingest/triage";

const fileLink = (id: string): string => `https://drive.google.com/file/d/${id}/view`;

/** A clean, READY row; overrides tweak one dimension at a time. */
function row(overrides: Partial<IntakeRow> = {}): IntakeRow {
	return {
		rowNumber: 2,
		country: "Egypt",
		name: "Ahmed",
		age: "17",
		city: "Cairo",
		theme: "Belonging",
		quote: '"Football is where I feel at home."',
		videoLink: "https://drive.google.com/file/d/abc123def456/view?usp=drive_link",
		photoLink: "https://drive.google.com/file/d/zzz999/view",
		consent: "Yes",
		language: "Arabic",
		...overrides,
	};
}

describe("assessRow — status", () => {
	it("classifies a clean single-token row as READY", () => {
		const a = assessRow(row());
		expect(a.status).toBe("ready");
		expect(a.schemaValid).toBe(true);
		expect(a.reasons).toEqual([]);
	});

	it("BLOCKS a row without consent (never uploaded)", () => {
		expect(assessRow(row({ consent: "" })).status).toBe("blocked");
		expect(assessRow(row({ consent: "no" })).status).toBe("blocked");
	});

	it("accepts any integer age now the 15–25 range gate is dropped (READY)", () => {
		expect(assessRow(row({ age: "14" })).status).toBe("ready");
		expect(assessRow(row({ age: "28" })).status).toBe("ready");
		expect(assessRow(row({ age: "9" })).status).toBe("ready");
	});

	it("holds a non-integer or blank age as MEDIA-ONLY (schema needs an integer; not blocked)", () => {
		// Age must still be an integer for voiceSchema, but it's no longer a
		// hard block — the media still uploads.
		expect(assessRow(row({ age: "" })).status).toBe("media-only");
		expect(assessRow(row({ age: "17.5" })).status).toBe("media-only");
	});

	it("BLOCKS a row with no resolvable video", () => {
		expect(assessRow(row({ videoLink: "" })).status).toBe("blocked");
		expect(assessRow(row({ videoLink: "https://example.com/x" })).status).toBe("blocked");
	});

	it("holds an over-120-char quote as MEDIA-ONLY (reported, not truncated)", () => {
		const long = '"' + "x".repeat(130) + '"';
		const a = assessRow(row({ quote: long }));
		expect(a.status).toBe("media-only");
		expect(a.flags.quoteTooLong).toBe(true);
		expect(a.quote.length).toBe(130);
	});

	it("holds a missing theme as MEDIA-ONLY (media can still upload)", () => {
		const a = assessRow(row({ theme: "" }));
		expect(a.status).toBe("media-only");
		expect(a.flags.themeMissing).toBe(true);
	});

	it("routes a clean folder-video row to NEEDS-FOLDER-RESOLVE", () => {
		const a = assessRow(row({ videoLink: "https://drive.google.com/drive/folders/fff111" }));
		expect(a.status).toBe("needs-folder-resolve");
		expect(a.flags.videoIsFolder).toBe(true);
	});

	it("holds a multi-token name as MEDIA-ONLY with the surname stripped from the proposal", () => {
		const a = assessRow(row({ name: "Yamal Julián Pino Villan" }));
		expect(a.status).toBe("media-only");
		expect(a.flags.nameNeedsReview).toBe(true);
		expect(a.name.firstName).toBe("Yamal");
	});

	it("treats a VN folder row as NEEDS-FOLDER-RESOLVE and proposes the last token", () => {
		const a = assessRow(
			row({
				country: "Viet Nam",
				name: "Phạm Thị Minh Thu",
				language: "Vietnamese",
				videoLink: "https://drive.google.com/drive/folders/vnfolder",
			}),
		);
		expect(a.status).toBe("needs-folder-resolve");
		expect(a.flags.givenNameLast).toBe(true);
		expect(a.name.firstName).toBe("Thu");
		expect(a.flags.nameNeedsReview).toBe(true);
	});

	it("holds a defaulted language (English and Shona → en) for confirmation", () => {
		const a = assessRow(row({ language: "English and Shona" }));
		expect(a.status).toBe("media-only");
		expect(a.flags.languageDefaulted).toBe(true);
		expect(a.language.ok && a.language.value).toBe("en");
	});

	it("blocks-first: consent outranks every other flag", () => {
		const a = assessRow(row({ consent: "", theme: "", videoLink: "" }));
		expect(a.status).toBe("blocked");
		expect(a.flags.noConsent).toBe(true);
	});
});

describe("findDuplicateVideoLinks", () => {
	it("flags two rows that share a video file id", () => {
		const dups = findDuplicateVideoLinks(
			assessRows([
				row({ rowNumber: 2, name: "Đức", videoLink: fileLink("SHARED") }),
				row({ rowNumber: 4, name: "Dương", videoLink: fileLink("SHARED") }),
			]),
		);
		expect(dups).toHaveLength(1);
		expect(dups[0]?.fileId).toBe("SHARED");
		expect(dups[0]?.rows.map((r) => r.rowNumber)).toEqual([2, 4]);
		expect(dups[0]?.rows.map((r) => r.name)).toEqual(["Đức", "Dương"]);
	});

	it("returns nothing when every video link is unique", () => {
		expect(
			findDuplicateVideoLinks(
				assessRows([
					row({ videoLink: fileLink("VID1") }),
					row({ name: "Mariam", videoLink: fileLink("VID2") }),
				]),
			),
		).toEqual([]);
	});

	it("ignores a shared link on a blocked row (it never uploads)", () => {
		// One consenting row + one without consent sharing the same link: the
		// blocked row can't corrupt anything, so it isn't a duplicate.
		expect(
			findDuplicateVideoLinks(
				assessRows([
					row({ videoLink: fileLink("SHARED") }),
					row({ name: "Mariam", consent: "no", videoLink: fileLink("SHARED") }),
				]),
			),
		).toEqual([]);
	});

	it("does not compare folder links (resolved at upload time)", () => {
		const folder = "https://drive.google.com/drive/folders/FOLDER";
		expect(
			findDuplicateVideoLinks(
				assessRows([row({ videoLink: folder }), row({ name: "Mariam", videoLink: folder })]),
			),
		).toEqual([]);
	});
});
