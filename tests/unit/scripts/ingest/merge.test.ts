import { describe, expect, it } from "vitest";

import {
	mergeRows,
	parseCampaignCsv,
	serialiseCampaignCsv,
	voiceToRow,
	type CampaignRow,
} from "../../../../scripts/ingest/merge";
import type { Voice } from "~/lib/voice";

const voice: Voice = {
	id: "mariam-eg-001",
	firstName: "Mariam",
	age: 17,
	countryCode: "EG",
	city: "Cairo",
	theme: "belonging",
	pullQuote: "Football is home.",
	language: "ar",
	videoId: "abc123def456",
	portraitImageId: "mariam-eg-001",
	publishedAt: "2026-06-01T00:00:00Z",
};

function row(overrides: Partial<CampaignRow> = {}): CampaignRow {
	return { ...voiceToRow(voice), ...overrides };
}

describe("voiceToRow", () => {
	it("stringifies a Voice into campaign cells", () => {
		expect(voiceToRow(voice)).toMatchObject({ id: "mariam-eg-001", age: "17", theme: "belonging" });
	});

	it("renders a missing portrait as a blank cell", () => {
		const { portraitImageId, ...rest } = voice;
		void portraitImageId;
		expect(voiceToRow(rest as Voice).portraitImageId).toBe("");
	});
});

describe("CSV round-trip", () => {
	it("serialises and re-parses to the same row", () => {
		const csv = serialiseCampaignCsv([voiceToRow(voice)]);
		expect(csv.split("\n")[0]).toBe(
			"ID,First name,Age,Country code,City,Theme,Pull quote,Language,Video ID,Portrait image ID,Published at",
		);
		const [parsed] = parseCampaignCsv(csv);
		expect(parsed).toEqual(voiceToRow(voice));
	});
});

describe("mergeRows", () => {
	it("appends a brand-new candidate row", () => {
		const result = mergeRows([], [row()]);
		expect(result.appended).toEqual(["mariam-eg-001"]);
		expect(result.rows).toHaveLength(1);
	});

	it("fills only blank cells and never overwrites a non-blank one", () => {
		// Existing sheet has an editorially-trimmed quote and a blank city.
		const existing = row({ pullQuote: "Trimmed by editorial.", city: "" });
		const result = mergeRows(
			[existing],
			[row({ pullQuote: "A much longer original quote.", city: "Cairo" })],
		);
		expect(result.filled).toContain("mariam-eg-001.city");
		expect(result.rows[0]?.city).toBe("Cairo"); // blank filled
		expect(result.rows[0]?.pullQuote).toBe("Trimmed by editorial."); // non-blank preserved
	});

	it("reports a conflict when the candidate disagrees with a non-blank cell", () => {
		const existing = row({ pullQuote: "Trimmed by editorial." });
		const result = mergeRows([existing], [row({ pullQuote: "Original long quote." })]);
		expect(result.conflicts).toHaveLength(1);
		expect(result.conflicts[0]).toMatchObject({ id: "mariam-eg-001", field: "pullQuote" });
		expect(result.rows[0]?.pullQuote).toBe("Trimmed by editorial.");
	});

	it("never conflicts on immutable id / publishedAt", () => {
		const existing = row({ publishedAt: "2025-01-01T00:00:00Z" });
		const result = mergeRows([existing], [row({ publishedAt: "2026-06-01T00:00:00Z" })]);
		expect(result.conflicts).toHaveLength(0);
		expect(result.rows[0]?.publishedAt).toBe("2025-01-01T00:00:00Z"); // immutable
	});

	it("keeps an existing row that dropped out of intake and reports the divergence", () => {
		const orphan = row({ id: "gone-zz-099", firstName: "Gone" });
		const result = mergeRows([orphan], [row()]);
		expect(result.divergences).toEqual(["gone-zz-099"]);
		expect(result.rows.map((r) => r.id)).toContain("gone-zz-099"); // never deleted
		expect(result.appended).toEqual(["mariam-eg-001"]);
	});

	it("is a no-op when candidates equal the existing rows (idempotent re-run)", () => {
		const existing = [voiceToRow(voice)];
		const result = mergeRows(existing, [voiceToRow(voice)]);
		expect(result.appended).toEqual([]);
		expect(result.filled).toEqual([]);
		expect(result.conflicts).toEqual([]);
		expect(serialiseCampaignCsv(result.rows)).toBe(serialiseCampaignCsv(existing));
	});
});
