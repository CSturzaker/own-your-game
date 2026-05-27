import { describe, expect, it } from "vitest";

import { buildHeaderIndex } from "../../../scripts/pipeline/headers";
import { filterPublished, isEmptyRow, transformRow } from "../../../scripts/pipeline/transform";

const HEADERS = [
	"ID",
	"First name",
	"Age",
	"Country code",
	"City",
	"Theme",
	"Pull quote",
	"Language",
	"Video ID",
	"Portrait file",
	"Published at",
];

const index = buildHeaderIndex(HEADERS);

/** Build a sheet row from a partial Voice-shaped object. */
function row(overrides: Partial<Record<string, string>> = {}): string[] {
	const base: Record<string, string> = {
		ID: "amara-ng-001",
		"First name": "Amara",
		Age: "14",
		"Country code": "NG",
		City: "Lagos",
		Theme: "belonging",
		"Pull quote": "On the pitch I'm the striker.",
		Language: "en",
		"Video ID": "a1b2c3d4e5f6a7b8",
		"Portrait file": "amara-ng-001.webp",
		"Published at": "2026-05-01T09:00:00Z",
	};
	const merged = { ...base, ...overrides };
	return HEADERS.map((h) => merged[h] ?? "");
}

describe("isEmptyRow", () => {
	it("returns true for an array of empty strings", () => {
		expect(isEmptyRow(["", "", ""])).toBe(true);
	});

	it("returns true for whitespace-only cells", () => {
		expect(isEmptyRow(["   ", "\t", ""])).toBe(true);
	});

	it("returns false when any cell has content", () => {
		expect(isEmptyRow(["", "a", ""])).toBe(false);
	});
});

describe("transformRow", () => {
	it("accepts a fully-populated valid row", () => {
		const result = transformRow(row(), index, 2);
		expect(result.kind).toBe("accepted");
		if (result.kind === "accepted") {
			expect(result.voice.id).toBe("amara-ng-001");
			expect(result.voice.age).toBe(14);
		}
	});

	it("skips entirely empty rows", () => {
		const empty = HEADERS.map(() => "");
		const result = transformRow(empty, index, 5);
		expect(result).toEqual({ kind: "skipped", rowNumber: 5, reason: "empty" });
	});

	it("skips rows with no Video ID (drafted state)", () => {
		const result = transformRow(row({ "Video ID": "" }), index, 7);
		expect(result).toEqual({ kind: "skipped", rowNumber: 7, reason: "no-video" });
	});

	it("rejects a row with an out-of-range age", () => {
		const result = transformRow(row({ Age: "999" }), index, 9);
		expect(result.kind).toBe("rejected");
		if (result.kind === "rejected") {
			expect(result.id).toBe("amara-ng-001");
			expect(result.errors.some((e) => e.includes("age"))).toBe(true);
		}
	});

	it("rejects a row with a bad country code (alpha-3 instead of alpha-2)", () => {
		const result = transformRow(row({ "Country code": "NGA" }), index, 9);
		expect(result.kind).toBe("rejected");
		if (result.kind === "rejected") {
			expect(result.errors.some((e) => e.startsWith("countryCode:"))).toBe(true);
		}
	});

	it("rejects when age is non-numeric", () => {
		const result = transformRow(row({ Age: "fourteen" }), index, 9);
		expect(result.kind).toBe("rejected");
	});

	it("preserves the row id even when other fields fail", () => {
		const result = transformRow(row({ Age: "5", City: "" }), index, 11);
		expect(result.kind).toBe("rejected");
		if (result.kind === "rejected") {
			expect(result.id).toBe("amara-ng-001");
		}
	});

	it("reports null id when the id column itself is blank", () => {
		const result = transformRow(row({ ID: "", Age: "5" }), index, 11);
		expect(result.kind).toBe("rejected");
		if (result.kind === "rejected") {
			expect(result.id).toBeNull();
		}
	});

	it("trims whitespace in string cells", () => {
		const result = transformRow(row({ City: "  Lagos  " }), index, 2);
		expect(result.kind).toBe("accepted");
		if (result.kind === "accepted") {
			expect(result.voice.city).toBe("Lagos");
		}
	});
});

describe("filterPublished", () => {
	function accepted(publishedAt: string): {
		kind: "accepted";
		rowNumber: number;
		voice: Parameters<typeof filterPublished>[0][number]["voice"];
	} {
		return {
			kind: "accepted" as const,
			rowNumber: 2,
			voice: {
				id: "a-bc-001",
				firstName: "A",
				age: 14,
				countryCode: "NG",
				city: "Lagos",
				theme: "belonging",
				pullQuote: "x",
				language: "en",
				videoId: "a1b2c3d4e5f6a7b8",
				portraitFile: "a-bc-001.webp",
				publishedAt,
			},
		};
	}

	const now = new Date("2026-05-27T12:00:00Z");

	it("emits voices whose publishedAt is now or earlier", () => {
		const out = filterPublished(
			[accepted("2026-05-27T12:00:00Z"), accepted("2026-05-01T00:00:00Z")],
			now,
		);
		expect(out.emit).toHaveLength(2);
		expect(out.deferred).toHaveLength(0);
	});

	it("defers voices whose publishedAt is in the future", () => {
		const out = filterPublished([accepted("2026-06-01T00:00:00Z")], now);
		expect(out.emit).toHaveLength(0);
		expect(out.deferred).toHaveLength(1);
	});

	it("separates emit from deferred correctly when mixed", () => {
		const out = filterPublished(
			[
				accepted("2026-05-01T00:00:00Z"),
				accepted("2026-06-01T00:00:00Z"),
				accepted("2026-05-26T00:00:00Z"),
			],
			now,
		);
		expect(out.emit).toHaveLength(2);
		expect(out.deferred).toHaveLength(1);
	});
});
