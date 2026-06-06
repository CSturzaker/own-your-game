/**
 * End-to-end pipeline tests. Each test feeds a CSV string and asserts
 * on the structured PipelineRun (or HeaderError) coming out.
 */

import { describe, expect, it } from "vitest";

import type { VoicesFile } from "~/lib/voice";

import { isHeaderError, preserveGeneratedAt, processCsv } from "../../../scripts/pipeline/run";

const HEADER_ROW =
	"ID,First name,Age,Country code,City,Theme,Pull quote,Language,Video ID,Portrait image ID,Published at";

const VALID_ROW_1 =
	"amara-ng-001,Amara,15,NG,Lagos,belonging,On the pitch I am the striker.,en,a1b2c3d4e5f6a7b8,amara-ng-001,2026-05-01T09:00:00Z";
const VALID_ROW_2 =
	"yusuf-eg-002,Yusuf,16,EG,Cairo,friendship,My team is the reason I show up.,ar,b2c3d4e5f6a7b8c9,yusuf-eg-002,2026-05-03T11:30:00Z";

const now = new Date("2026-05-27T12:00:00Z");

describe("processCsv — header errors", () => {
	it("flags missing required headers", () => {
		const csv = "ID,First name,Age\nfoo,Bar,14";
		const out = processCsv({ csv, now });
		expect(isHeaderError(out)).toBe(true);
		if (isHeaderError(out)) {
			expect(out.missing).toContain("countryCode");
			expect(out.missing).toContain("publishedAt");
		}
	});

	it("flags duplicate headers", () => {
		const csv = `${HEADER_ROW},first_name\n${VALID_ROW_1},Extra`;
		const out = processCsv({ csv, now });
		expect(isHeaderError(out)).toBe(true);
		if (isHeaderError(out)) {
			expect(out.duplicates).toEqual(["firstName"]);
		}
	});
});

describe("processCsv — happy path", () => {
	it("emits validated voices sorted by id", () => {
		const csv = `${HEADER_ROW}\n${VALID_ROW_2}\n${VALID_ROW_1}`;
		const out = processCsv({ csv, now });
		if (isHeaderError(out)) throw new Error("unexpected header error");
		expect(out.voicesFile.voices.map((v) => v.id)).toEqual(["amara-ng-001", "yusuf-eg-002"]);
		expect(out.rejected).toHaveLength(0);
		expect(out.skipped).toHaveLength(0);
	});

	it("includes the schemaVersion and generatedAt in the file", () => {
		const csv = `${HEADER_ROW}\n${VALID_ROW_1}`;
		const out = processCsv({ csv, now });
		if (isHeaderError(out)) throw new Error("unexpected header error");
		expect(out.voicesFile.schemaVersion).toBe(1);
		expect(out.voicesFile.generatedAt).toBe("2026-05-27T12:00:00.000Z");
	});

	it("is byte-identical on a second run (deterministic JSON)", () => {
		const csv = `${HEADER_ROW}\n${VALID_ROW_2}\n${VALID_ROW_1}`;
		const a = processCsv({ csv, now });
		const b = processCsv({ csv, now });
		if (isHeaderError(a) || isHeaderError(b)) throw new Error("unexpected");
		expect(JSON.stringify(a.voicesFile)).toEqual(JSON.stringify(b.voicesFile));
	});
});

describe("processCsv — skip + defer behaviour", () => {
	it("silently skips rows with no Video ID", () => {
		const draft = VALID_ROW_1.replace("a1b2c3d4e5f6a7b8", "");
		const csv = `${HEADER_ROW}\n${draft}\n${VALID_ROW_2}`;
		const out = processCsv({ csv, now });
		if (isHeaderError(out)) throw new Error("unexpected");
		expect(out.voicesFile.voices.map((v) => v.id)).toEqual(["yusuf-eg-002"]);
		expect(out.skipped[0]?.reason).toBe("no-video");
		expect(out.rejected).toHaveLength(0);
	});

	it("silently skips entirely empty rows", () => {
		const csv = `${HEADER_ROW}\n${VALID_ROW_1}\n,,,,,,,,,,\n${VALID_ROW_2}`;
		const out = processCsv({ csv, now });
		if (isHeaderError(out)) throw new Error("unexpected");
		expect(out.voicesFile.voices).toHaveLength(2);
		expect(out.skipped[0]?.reason).toBe("empty");
	});

	it("defers rows whose publishedAt is in the future", () => {
		const future = VALID_ROW_2.replace("2026-05-03T11:30:00Z", "2026-12-01T00:00:00Z");
		const csv = `${HEADER_ROW}\n${VALID_ROW_1}\n${future}`;
		const out = processCsv({ csv, now });
		if (isHeaderError(out)) throw new Error("unexpected");
		expect(out.voicesFile.voices.map((v) => v.id)).toEqual(["amara-ng-001"]);
		expect(out.deferred).toHaveLength(1);
		expect(out.deferred[0]?.voice.id).toBe("yusuf-eg-002");
	});

	it("picks up a previously-deferred row once the clock advances", () => {
		const future = VALID_ROW_2.replace("2026-05-03T11:30:00Z", "2026-06-01T00:00:00Z");
		const csv = `${HEADER_ROW}\n${VALID_ROW_1}\n${future}`;
		const before = processCsv({ csv, now: new Date("2026-05-15T00:00:00Z") });
		const after = processCsv({ csv, now: new Date("2026-06-15T00:00:00Z") });
		if (isHeaderError(before) || isHeaderError(after)) throw new Error("unexpected");
		expect(before.voicesFile.voices).toHaveLength(1);
		expect(after.voicesFile.voices).toHaveLength(2);
	});
});

describe("preserveGeneratedAt", () => {
	const voice = {
		id: "amara-ng-001",
		firstName: "Amara",
		age: 15,
		countryCode: "NG",
		city: "Lagos",
		theme: "belonging",
		pullQuote: "x",
		language: "en",
		videoId: "a1b2c3d4e5f6a7b8",
		portraitImageId: "amara-ng-001",
		publishedAt: "2026-05-01T09:00:00Z",
	} as const;

	const baseline: VoicesFile = {
		generatedAt: "2026-05-20T10:00:00.000Z",
		schemaVersion: 1,
		voices: [voice],
	};

	it("returns next unchanged when there is no previous file", () => {
		const next: VoicesFile = { ...baseline, generatedAt: "2026-05-27T12:00:00.000Z" };
		expect(preserveGeneratedAt(next, null)).toBe(next);
	});

	it("reuses the previous generatedAt when voices are identical", () => {
		const next: VoicesFile = { ...baseline, generatedAt: "2026-05-27T12:00:00.000Z" };
		const out = preserveGeneratedAt(next, baseline);
		expect(out.generatedAt).toBe("2026-05-20T10:00:00.000Z");
		expect(out.voices).toEqual(next.voices);
	});

	it("keeps the new generatedAt when voices changed", () => {
		const next: VoicesFile = {
			generatedAt: "2026-05-27T12:00:00.000Z",
			schemaVersion: 1,
			voices: [voice, { ...voice, id: "yusuf-eg-002", firstName: "Yusuf" }],
		};
		expect(preserveGeneratedAt(next, baseline).generatedAt).toBe("2026-05-27T12:00:00.000Z");
	});

	it("keeps the new generatedAt when schemaVersion changed", () => {
		const next: VoicesFile = {
			...baseline,
			generatedAt: "2026-05-27T12:00:00.000Z",
			schemaVersion: 1,
		};
		const oldSchema = { ...baseline, schemaVersion: 0 as unknown as 1 };
		expect(preserveGeneratedAt(next, oldSchema).generatedAt).toBe("2026-05-27T12:00:00.000Z");
	});

	it("produces a byte-identical JSON output on no-op runs", () => {
		const next: VoicesFile = { ...baseline, generatedAt: "2026-05-27T12:00:00.000Z" };
		const merged = preserveGeneratedAt(next, baseline);
		expect(JSON.stringify(merged)).toBe(JSON.stringify(baseline));
	});
});

describe("processCsv — validation failures", () => {
	it("rejects rows with bad data and includes the row number", () => {
		const bad = VALID_ROW_2.replace(",16,EG,", ",999,EG,"); // age=999
		const csv = `${HEADER_ROW}\n${VALID_ROW_1}\n${bad}`;
		const out = processCsv({ csv, now });
		if (isHeaderError(out)) throw new Error("unexpected");
		expect(out.voicesFile.voices).toHaveLength(1);
		expect(out.rejected).toHaveLength(1);
		expect(out.rejected[0]?.rowNumber).toBe(3);
		expect(out.rejected[0]?.errors.some((e) => e.startsWith("age:"))).toBe(true);
	});
});
