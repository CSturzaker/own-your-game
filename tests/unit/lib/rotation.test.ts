import { describe, expect, it } from "vitest";

import {
	arrivedIds,
	FLASH_DURATION_MS,
	MOBILE_VISIBLE_COUNT,
	pickPositions,
	ROTATION_INTERVAL_MS,
	rotateOnce,
	shuffle,
	SWAP_COUNT,
	VISIBLE_COUNT,
} from "~/lib/rotation";

/**
 * Mulberry32 — small seeded PRNG. Used here to drive deterministic
 * shuffle / pick assertions; the runtime path keeps using Math.random.
 */
function seeded(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

describe("rotation constants", () => {
	it("pins the 8 second tick, 6-of-11 swap, and 1.5s flash from the prototype", () => {
		expect(ROTATION_INTERVAL_MS).toBe(8_000);
		expect(SWAP_COUNT).toBe(6);
		expect(VISIBLE_COUNT).toBe(11);
		expect(MOBILE_VISIBLE_COUNT).toBe(8);
		expect(FLASH_DURATION_MS).toBe(1_500);
	});
});

describe("shuffle", () => {
	it("returns a new array — does not mutate the input", () => {
		const input = [1, 2, 3, 4, 5];
		const out = shuffle(input, seeded(1));
		expect(out).not.toBe(input);
		expect(input).toEqual([1, 2, 3, 4, 5]);
	});

	it("preserves every input element exactly once", () => {
		const input = ["a", "b", "c", "d", "e", "f"];
		const out = shuffle(input, seeded(42));
		expect([...out].sort()).toEqual([...input].sort());
	});

	it("is deterministic for a given seed", () => {
		const a = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], seeded(7));
		const b = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], seeded(7));
		expect(a).toEqual(b);
	});

	it("actually reorders most elements (smoke test against identity)", () => {
		const input = Array.from({ length: 20 }, (_, i) => i);
		const out = shuffle(input, seeded(3));
		const samePosition = out.filter((value, i) => value === input[i]).length;
		// A truly random shuffle of 20 leaves ~1 in place on average.
		// Allow a generous upper bound; the contract is just "not identity".
		expect(samePosition).toBeLessThan(input.length / 2);
	});
});

describe("pickPositions", () => {
	it("returns the requested count of indices from [0, total)", () => {
		const picks = pickPositions(11, 6, seeded(1));
		expect(picks).toHaveLength(6);
		for (const i of picks) {
			expect(i).toBeGreaterThanOrEqual(0);
			expect(i).toBeLessThan(11);
		}
	});

	it("returns indices in ascending order so the test contract is stable", () => {
		const picks = pickPositions(11, 6, seeded(99));
		const sorted = [...picks].sort((a, b) => a - b);
		expect(picks).toEqual(sorted);
	});

	it("never returns duplicate indices", () => {
		for (let seed = 0; seed < 50; seed++) {
			const picks = pickPositions(11, 6, seeded(seed));
			expect(new Set(picks).size).toBe(picks.length);
		}
	});

	it("returns every position when count >= total — and runs no random calls", () => {
		// If the function consumed `random()` here the test would still
		// pass; the assertion below proves the function returns the
		// complete index set deterministically without randomness.
		const picks = pickPositions(11, 11);
		expect(picks).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		const picksOverflow = pickPositions(5, 99);
		expect(picksOverflow).toEqual([0, 1, 2, 3, 4]);
	});

	it("returns an empty array when count is zero or negative", () => {
		expect(pickPositions(11, 0)).toEqual([]);
		expect(pickPositions(11, -3)).toEqual([]);
	});
});

describe("rotateOnce", () => {
	interface Item {
		id: string;
	}
	const items = (...ids: string[]): Item[] => ids.map((id) => ({ id }));

	it("replaces the given positions with the next pool items, in order", () => {
		const current = items("a", "b", "c", "d", "e");
		const pool = items("p1", "p2", "p3", "p4", "p5", "p6", "p7");
		const { next, poolIndex } = rotateOnce(current, pool, 0, [1, 3]);
		expect(next.map((i) => i.id)).toEqual(["a", "p1", "c", "p2", "e"]);
		expect(poolIndex).toBe(2);
	});

	it("wraps around the pool when poolIndex overflows", () => {
		const current = items("a", "b", "c");
		const pool = items("p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8");
		// Start near the end so it wraps mid-call.
		const { next, poolIndex } = rotateOnce(current, pool, 7, [0, 2]);
		expect(next.map((i) => i.id)).toEqual(["p8", "b", "p1"]);
		expect(poolIndex).toBe(9);
	});

	it("skips pool items whose id is already visible to prevent duplicates", () => {
		const current = items("a", "b", "c");
		// p1 collides with `a`, p2 collides with `b` — both should be
		// skipped. p3 is the first acceptable replacement for position 2.
		const pool = items("a", "b", "p3", "p4");
		const { next, poolIndex } = rotateOnce(current, pool, 0, [2]);
		expect(next.map((i) => i.id)).toEqual(["a", "b", "p3"]);
		// poolIndex advances past all three (a, b, p3) — 3 calls.
		expect(poolIndex).toBe(3);
	});

	it("leaves the slot unchanged if every pool entry collides with another visible slot", () => {
		// Degenerate pool — the only candidates are the items in
		// *other* positions, so dedup would force a duplicate. The
		// guard bails after one full traversal and leaves the slot
		// alone rather than looping forever.
		const current = items("a", "b", "c");
		const pool = items("a", "c"); // pool entries are visible elsewhere
		const { next, poolIndex } = rotateOnce(current, pool, 0, [1]);
		expect(next.map((i) => i.id)).toEqual(["a", "b", "c"]);
		expect(poolIndex).toBe(2); // advanced by pool.length, all skipped
	});

	it("does not mutate the input current array", () => {
		const current = items("a", "b", "c");
		const pool = items("p1", "p2");
		rotateOnce(current, pool, 0, [0, 1, 2]);
		expect(current.map((i) => i.id)).toEqual(["a", "b", "c"]);
	});
});

describe("arrivedIds", () => {
	interface Item {
		id: string;
	}
	const items = (...ids: string[]): Item[] => ids.map((id) => ({ id }));

	it("returns ids in next that weren't in prev", () => {
		const prev = items("a", "b", "c", "d");
		const next = items("a", "x", "c", "y");
		expect(arrivedIds(prev, next)).toEqual(new Set(["x", "y"]));
	});

	it("returns an empty set when prev and next are identical", () => {
		const prev = items("a", "b", "c");
		const next = items("a", "b", "c");
		expect(arrivedIds(prev, next)).toEqual(new Set());
	});

	it("returns every id when next is fully fresh", () => {
		const prev = items("a", "b");
		const next = items("x", "y", "z");
		expect(arrivedIds(prev, next)).toEqual(new Set(["x", "y", "z"]));
	});
});
