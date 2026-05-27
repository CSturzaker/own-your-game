import { describe, expect, it } from "vitest";

import { hashSeed, pickPortraitVariant, SILHOUETTES, TONES } from "~/lib/portrait";

describe("hashSeed", () => {
	it("returns a non-negative integer for every input", () => {
		for (const seed of ["", "0", "voice-247", "abc", "العربية"]) {
			const h = hashSeed(seed);
			expect(h).toBeGreaterThanOrEqual(0);
			expect(Number.isInteger(h)).toBe(true);
		}
	});

	it("is deterministic — same seed always returns the same hash", () => {
		expect(hashSeed("voice-247")).toBe(hashSeed("voice-247"));
		expect(hashSeed("abc")).toBe(hashSeed("abc"));
	});

	it("typically produces different hashes for different seeds", () => {
		const samples = ["a", "b", "voice-1", "voice-2", "voice-42", "voice-247"];
		const hashes = new Set(samples.map(hashSeed));
		// Collisions are possible with a 32-bit hash but extremely
		// unlikely across this set — protects against retyping the
		// algorithm with a degenerate constant.
		expect(hashes.size).toBeGreaterThan(samples.length - 2);
	});
});

describe("pickPortraitVariant", () => {
	it("returns the same variant for the same seed", () => {
		const a = pickPortraitVariant("voice-247");
		const b = pickPortraitVariant("voice-247");
		expect(a).toEqual(b);
	});

	it("constrains every field to its documented range", () => {
		for (let i = 0; i < 200; i++) {
			const v = pickPortraitVariant(`seed-${i}`);
			expect(v.toneIndex).toBeGreaterThanOrEqual(0);
			expect(v.toneIndex).toBeLessThan(TONES.length);
			expect(v.silhouetteIndex).toBeGreaterThanOrEqual(0);
			expect(v.silhouetteIndex).toBeLessThan(SILHOUETTES.length);
			expect(v.offsetX).toBeGreaterThanOrEqual(-2);
			expect(v.offsetX).toBeLessThanOrEqual(2);
			expect(v.offsetY).toBeGreaterThanOrEqual(0);
			expect(v.offsetY).toBeLessThanOrEqual(3);
			expect(v.silWidth).toBeGreaterThanOrEqual(72);
			expect(v.silWidth).toBeLessThan(84);
		}
	});

	it("eventually hits every silhouette across a modest seed range", () => {
		const seen = new Set<number>();
		for (let i = 0; i < 200 && seen.size < SILHOUETTES.length; i++) {
			seen.add(pickPortraitVariant(`s${i}`).silhouetteIndex);
		}
		expect(seen.size).toBe(SILHOUETTES.length);
	});

	it("eventually hits every tone across a modest seed range", () => {
		const seen = new Set<number>();
		for (let i = 0; i < 200 && seen.size < TONES.length; i++) {
			seen.add(pickPortraitVariant(`t${i}`).toneIndex);
		}
		expect(seen.size).toBe(TONES.length);
	});
});

describe("TONES and SILHOUETTES", () => {
	it("ships seven distinct silhouette markups", () => {
		expect(SILHOUETTES).toHaveLength(7);
		expect(new Set(SILHOUETTES).size).toBe(7);
	});

	it("ships eight warm-grey tone palettes with hex values", () => {
		expect(TONES).toHaveLength(8);
		for (const tone of TONES) {
			expect(tone.a).toMatch(/^#[0-9A-F]{6}$/i);
			expect(tone.b).toMatch(/^#[0-9A-F]{6}$/i);
			expect(tone.s).toMatch(/^#[0-9A-F]{6}$/i);
		}
	});
});
