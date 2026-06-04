import { describe, expect, it } from "vitest";

import { buildDots, resolveActiveSet } from "~/lib/player-context";
import type { Voice } from "~/lib/voice";

function voice(overrides: Partial<Voice> & Pick<Voice, "id" | "publishedAt">): Voice {
	return {
		firstName: "Test",
		age: 14,
		countryCode: "KE",
		city: "Nairobi",
		theme: "friendship",
		pullQuote: "A quote.",
		language: "sw",
		videoId: "a1b2c3d4e5f6a7b8",
		portraitFile: "x.webp",
		...overrides,
	};
}

// Newest-first order: a (05-04), b (05-03), c (05-02), d (05-01).
const VOICES: readonly Voice[] = [
	voice({ id: "c", publishedAt: "2026-05-02T00:00:00Z", theme: "friendship" }),
	voice({ id: "a", publishedAt: "2026-05-04T00:00:00Z", theme: "friendship" }),
	voice({ id: "d", publishedAt: "2026-05-01T00:00:00Z", theme: "family" }),
	voice({ id: "b", publishedAt: "2026-05-03T00:00:00Z", theme: "family" }),
];

const params = (q: string) => new URLSearchParams(q);

describe("resolveActiveSet", () => {
	it("uses all voices (newest-first) for a direct visit with no params", () => {
		const set = resolveActiveSet("b", VOICES, params(""));
		expect(set.ordered.map((v) => v.id)).toEqual(["a", "b", "c", "d"]);
		expect(set.index).toBe(1);
		expect(set.total).toBe(4);
		expect(set.prev?.id).toBe("a");
		expect(set.next?.id).toBe("c");
	});

	it("narrows to the filtered subset for a squad theme filter", () => {
		const set = resolveActiveSet("c", VOICES, params("from=squad&theme=friendship"));
		expect(set.ordered.map((v) => v.id)).toEqual(["a", "c"]);
		expect(set.index).toBe(1);
		expect(set.total).toBe(2);
		expect(set.prev?.id).toBe("a");
		expect(set.next).toBeUndefined(); // end of the friendship set
	});

	it("has no previous at the start of the set", () => {
		const set = resolveActiveSet("a", VOICES, params("from=squad&theme=friendship"));
		expect(set.prev).toBeUndefined();
		expect(set.next?.id).toBe("c");
	});

	it("falls back to the full list when the voice isn't in the filtered subset", () => {
		// `d` is a family voice but the link claims friendship — degrade to all.
		const set = resolveActiveSet("d", VOICES, params("from=squad&theme=friendship"));
		expect(set.total).toBe(4);
		expect(set.index).toBe(3);
		expect(set.prev?.id).toBe("c");
	});

	it("intersects multiple filter dimensions", () => {
		const set = resolveActiveSet("a", VOICES, params("from=squad&theme=friendship&country=KE"));
		expect(set.ordered.map((v) => v.id)).toEqual(["a", "c"]);
	});
});

describe("buildDots", () => {
	it("renders one dot per voice when within the cap, marking the current", () => {
		const dots = buildDots(2, 5);
		expect(dots).toHaveLength(5);
		expect(dots.filter((d) => d.kind === "dot" && d.active)).toHaveLength(1);
		expect(dots[2]).toEqual({ kind: "dot", active: true });
	});

	it("windows with a trailing ellipsis near the start", () => {
		const dots = buildDots(0, 20, 8);
		expect(dots[0]).toEqual({ kind: "dot", active: true });
		expect(dots.at(-1)).toEqual({ kind: "ellipsis" });
		expect(dots.filter((d) => d.kind === "ellipsis")).toHaveLength(1);
	});

	it("windows with a leading ellipsis near the end", () => {
		const dots = buildDots(19, 20, 8);
		expect(dots[0]).toEqual({ kind: "ellipsis" });
		expect(dots.at(-1)).toEqual({ kind: "dot", active: true });
	});

	it("windows with both ellipses in the middle", () => {
		const dots = buildDots(10, 20, 8);
		expect(dots[0]).toEqual({ kind: "ellipsis" });
		expect(dots.at(-1)).toEqual({ kind: "ellipsis" });
		expect(dots.filter((d) => d.kind === "dot")).toHaveLength(8);
		expect(dots.filter((d) => d.kind === "dot" && d.active)).toHaveLength(1);
	});
});
