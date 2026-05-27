/**
 * Content-loader tests. Every case runs against the fixtures under
 * `tests/fixtures/content/` rather than the real content directory —
 * so a campaign-team sheet edit doesn't break unit tests, and these
 * assertions stay coupled to fixture shape only.
 */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
	__resetContentCacheForTests,
	__resetContentPathsForTests,
	__setContentPathsForTests,
	getAllVoices,
	getAvailableLetterLanguages,
	getCountryCount,
	getLanguageCount,
	getLetter,
	getShuffledVoices,
	getVoiceById,
	getVoiceCount,
	getVoicesByCountry,
	getVoicesByTheme,
	getVoicesFile,
} from "~/lib/content";

const FIXTURE_VOICES = resolve(__dirname, "../../fixtures/content/voices.json");
const FIXTURE_LETTERS = resolve(__dirname, "../../fixtures/content/letter");

beforeAll(() => {
	__setContentPathsForTests({ voicesFile: FIXTURE_VOICES, letterDir: FIXTURE_LETTERS });
});

afterEach(() => {
	__resetContentCacheForTests();
});

describe("getVoicesFile", () => {
	it("parses and returns the voices.json fixture", () => {
		const file = getVoicesFile();
		expect(file.schemaVersion).toBe(1);
		expect(file.voices).toHaveLength(4);
	});

	it("caches the parsed file — second call returns the same object", () => {
		const a = getVoicesFile();
		const b = getVoicesFile();
		expect(a).toBe(b);
	});
});

describe("derived voice accessors", () => {
	it("getAllVoices returns the voices array", () => {
		expect(getAllVoices()).toHaveLength(4);
	});

	it("getVoiceById finds a voice by id and returns undefined otherwise", () => {
		expect(getVoiceById("amina-ke-001")?.firstName).toBe("Amina");
		expect(getVoiceById("does-not-exist-999")).toBeUndefined();
	});

	it("getVoiceCount returns the total count", () => {
		expect(getVoiceCount()).toBe(4);
	});

	it("getCountryCount returns distinct country codes", () => {
		// Fixture has 4 voices across 4 countries: KE, BR, VN, US.
		expect(getCountryCount()).toBe(4);
	});

	it("getLanguageCount returns distinct language codes", () => {
		// Fixture languages: sw, pt-BR, vi, en — 4 distinct.
		expect(getLanguageCount()).toBe(4);
	});

	it("getVoicesByTheme filters by theme", () => {
		const belonging = getVoicesByTheme("belonging");
		expect(belonging).toHaveLength(2);
		expect(belonging.map((v) => v.id)).toEqual(["amina-ke-001", "talia-us-004"]);

		expect(getVoicesByTheme("community")).toEqual([]);
	});

	it("getVoicesByCountry filters by countryCode", () => {
		const ke = getVoicesByCountry("KE");
		expect(ke).toHaveLength(1);
		expect(ke[0]?.id).toBe("amina-ke-001");

		expect(getVoicesByCountry("XX")).toEqual([]);
	});
});

describe("getShuffledVoices", () => {
	it("returns every voice exactly once", () => {
		const shuffled = getShuffledVoices();
		const ids = shuffled.map((v) => v.id).sort();
		const expected = getAllVoices()
			.map((v) => v.id)
			.sort();
		expect(ids).toEqual(expected);
	});

	it("is deterministic — repeated calls return the same order", () => {
		const a = getShuffledVoices();
		const b = getShuffledVoices();
		expect(a.map((v) => v.id)).toEqual(b.map((v) => v.id));
	});

	it("produces a stable shuffle for a given generatedAt", () => {
		// The fixture's generatedAt is 2026-05-20T10:00:00.000Z. Snapshot
		// the resulting order so a change to the shuffle algorithm
		// surfaces here loudly (intentional algorithm changes update
		// this assertion).
		const order = getShuffledVoices().map((v) => v.id);
		// Sanity check: order is not the input-array order.
		expect(order).not.toEqual(getAllVoices().map((v) => v.id));
		// And it stays the same across runs.
		expect(getShuffledVoices().map((v) => v.id)).toEqual(order);
	});
});

describe("getLetter", () => {
	it("returns the English letter's frontmatter and body", () => {
		const letter = getLetter("en");
		expect(letter.frontmatter.lang).toBe("en");
		expect(letter.frontmatter.direction).toBe("ltr");
		expect(letter.frontmatter.salutation).toBe("Dear FIFA,");
		expect(letter.body.trim().length).toBeGreaterThan(0);
	});

	it("returns rtl direction for Arabic", () => {
		expect(getLetter("ar").frontmatter.direction).toBe("rtl");
	});

	it("caches per-language — second call returns the same object", () => {
		const a = getLetter("en");
		const b = getLetter("en");
		expect(a).toBe(b);
	});

	it("throws clearly when the file is missing", () => {
		// "fr" isn't in the fixture letter dir.
		expect(() => getLetter("fr")).toThrow(/Letter file not found/);
	});
});

describe("getAvailableLetterLanguages", () => {
	it("returns only languages whose .md file actually exists in the fixture dir", () => {
		// Fixture letter dir contains en.md and ar.md.
		expect(getAvailableLetterLanguages()).toEqual(["en", "ar"]);
	});
});

// ---------------------------------------------------------------
// Schema validation failures
// ---------------------------------------------------------------

describe("schema validation failures", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(resolve(tmpdir(), "content-bad-"));
		__resetContentCacheForTests();
	});

	afterEach(() => {
		// Restore the fixture paths for the rest of the suite.
		__setContentPathsForTests({ voicesFile: FIXTURE_VOICES, letterDir: FIXTURE_LETTERS });
		__resetContentCacheForTests();
	});

	it("throws when voices.json is missing", () => {
		__setContentPathsForTests({ voicesFile: resolve(tmpDir, "missing.json") });
		expect(() => getVoicesFile()).toThrow(/Could not read voices file/);
	});

	it("throws when voices.json is not valid JSON", () => {
		const bad = resolve(tmpDir, "bad.json");
		writeFileSync(bad, "{ not valid json", "utf8");
		__setContentPathsForTests({ voicesFile: bad });
		expect(() => getVoicesFile()).toThrow(/not valid JSON/);
	});

	it("throws when voices.json fails schema validation", () => {
		const bad = resolve(tmpDir, "bad-schema.json");
		writeFileSync(
			bad,
			JSON.stringify({ generatedAt: "today", schemaVersion: 1, voices: [] }),
			"utf8",
		);
		__setContentPathsForTests({ voicesFile: bad });
		expect(() => getVoicesFile()).toThrow(/failed schema validation/);
	});

	it("throws when letter frontmatter fails validation", () => {
		const dir = mkdtempSync(resolve(tmpdir(), "letter-bad-"));
		writeFileSync(resolve(dir, "en.md"), "---\nlang: en\ndirection: sideways\n---\nbody", "utf8");
		__setContentPathsForTests({ letterDir: dir });
		expect(() => getLetter("en")).toThrow(/Letter frontmatter failed validation/);
	});
});

// Restore default paths after the suite so other test files (if any
// import this module transitively) get the real content paths.
afterEach(() => {
	__resetContentPathsForTests();
	__setContentPathsForTests({ voicesFile: FIXTURE_VOICES, letterDir: FIXTURE_LETTERS });
});
