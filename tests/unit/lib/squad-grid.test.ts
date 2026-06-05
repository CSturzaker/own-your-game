import { describe, expect, it } from "vitest";

import {
	FADE_MS,
	loadMoreCount,
	PAGE_SIZE,
	readSquadVoices,
	sortByNewest,
	squadTileHref,
} from "~/lib/squad-grid";
import type { Voice } from "~/lib/voice";

/** Minimal Voice factory — only the fields the grid helpers read. */
function voice(overrides: Partial<Voice> & Pick<Voice, "id">): Voice {
	return {
		firstName: "Sam",
		age: 14,
		countryCode: "KE",
		city: "Nairobi",
		theme: "fairness",
		pullQuote: "Sport is for everyone.",
		language: "sw",
		videoId: "a1b2c3d4e5f6a7b8",
		portraitImageId: "sam",
		publishedAt: "2026-05-01T09:00:00Z",
		...overrides,
	};
}

describe("PAGE_SIZE / FADE_MS", () => {
	it("page size is the three-rows-on-desktop default", () => {
		expect(PAGE_SIZE).toBe(24);
	});

	it("fade matches the 240ms tile transition", () => {
		expect(FADE_MS).toBe(240);
	});
});

describe("sortByNewest", () => {
	it("orders by publishedAt descending (newest first)", () => {
		const out = sortByNewest([
			voice({ id: "old", publishedAt: "2026-05-01T00:00:00Z" }),
			voice({ id: "new", publishedAt: "2026-05-20T00:00:00Z" }),
			voice({ id: "mid", publishedAt: "2026-05-10T00:00:00Z" }),
		]);
		expect(out.map((v) => v.id)).toEqual(["new", "mid", "old"]);
	});

	it("breaks ties on id so order is stable", () => {
		const ts = "2026-05-05T12:00:00Z";
		const out = sortByNewest([
			voice({ id: "charlie", publishedAt: ts }),
			voice({ id: "alpha", publishedAt: ts }),
			voice({ id: "bravo", publishedAt: ts }),
		]);
		expect(out.map((v) => v.id)).toEqual(["alpha", "bravo", "charlie"]);
	});

	it("does not mutate the input array", () => {
		const input = [
			voice({ id: "a", publishedAt: "2026-05-01T00:00:00Z" }),
			voice({ id: "b", publishedAt: "2026-05-02T00:00:00Z" }),
		];
		const before = input.map((v) => v.id);
		sortByNewest(input);
		expect(input.map((v) => v.id)).toEqual(before);
	});
});

describe("squadTileHref", () => {
	it("links to the player card tagged with the squad origin", () => {
		expect(squadTileHref(voice({ id: "amara-ng-001" }), {})).toBe("/voice/amara-ng-001?from=squad");
	});

	it("carries the active filter set after from=squad", () => {
		const href = squadTileHref(voice({ id: "kai-jp-009" }), {
			theme: "friendship",
			country: "JP",
			language: "ja",
			age: 16,
		});
		expect(href).toBe(
			"/voice/kai-jp-009?from=squad&theme=friendship&country=JP&language=ja&age=16",
		);
	});

	it("includes only the dimensions that are set", () => {
		expect(squadTileHref(voice({ id: "x" }), { theme: "family" })).toBe(
			"/voice/x?from=squad&theme=family",
		);
	});
});

describe("loadMoreCount", () => {
	it("reveals a full page when more than a page remains", () => {
		expect(loadMoreCount(0, 100)).toBe(24);
		expect(loadMoreCount(24, 100)).toBe(24);
	});

	it("reveals only the remainder on the tail", () => {
		expect(loadMoreCount(24, 38)).toBe(14);
		expect(loadMoreCount(24, 40)).toBe(16);
	});

	it("is zero once everything is shown (never negative)", () => {
		expect(loadMoreCount(38, 38)).toBe(0);
		expect(loadMoreCount(40, 38)).toBe(0);
	});
});

// The load-more label and the below-grid indicator moved into the
// dictionary (DEV-70) and are interpolated in the `SquadGrid` island;
// `loadMoreCount` above remains the pure next-batch size.

describe("readSquadVoices", () => {
	function docWith(scriptBody: string | null): Document {
		const doc = document.implementation.createHTMLDocument("squad");
		if (scriptBody !== null) {
			const script = doc.createElement("script");
			script.type = "application/json";
			script.id = "squad-data";
			script.textContent = scriptBody;
			doc.body.appendChild(script);
		}
		return doc;
	}

	it("parses the voices array out of the #squad-data block", () => {
		const voices = [voice({ id: "a" }), voice({ id: "b" })];
		const out = readSquadVoices(docWith(JSON.stringify({ voices })));
		expect(out.map((v) => v.id)).toEqual(["a", "b"]);
	});

	it("returns an empty array when the block is absent", () => {
		expect(readSquadVoices(docWith(null))).toEqual([]);
	});

	it("returns an empty array on malformed JSON without throwing", () => {
		expect(readSquadVoices(docWith("{ not json"))).toEqual([]);
	});

	it("returns an empty array when the block has no voices key", () => {
		expect(readSquadVoices(docWith(JSON.stringify({})))).toEqual([]);
	});
});
