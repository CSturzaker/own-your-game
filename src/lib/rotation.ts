/**
 * Pure helpers for the starting-eleven rotation.
 *
 * The React island (`src/islands/RotatingEleven.tsx`) is a thin shell
 * over these functions — the timer + React state plumbing is the only
 * part that genuinely needs a component. Keeping the shuffle / swap
 * logic here means Vitest can pin every interesting edge case
 * (deterministic seeds, pool-wrap, duplicate-position guard) without
 * touching the DOM.
 *
 * Randomness: the runtime call uses `Math.random()` via
 * {@link defaultRandom}, but every function accepts an injected
 * `random` so the tests can pin behaviour with a seeded PRNG and
 * confirm deterministic results.
 */

/** [0, 1) — the standard `Math.random` shape. */
export type RandomFn = () => number;

/** Default RNG. Replaced in tests with a seeded PRNG for determinism. */
export const defaultRandom: RandomFn = Math.random;

/**
 * Fisher-Yates shuffle. Returns a NEW array; the input is not
 * mutated. Deterministic when `random` is seeded.
 */
export function shuffle<T>(items: readonly T[], random: RandomFn = defaultRandom): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j]!, out[i]!];
	}
	return out;
}

/**
 * Choose `count` distinct positions from `[0, total)`. Used to pick
 * which 6 of the 11 visible tiles to swap on each rotation tick.
 *
 * Returns the indices in ascending order — the caller doesn't care
 * about pick order; the sort makes the test contract stable.
 *
 * Edge cases:
 *   - `count >= total` → all positions, no randomness
 *   - `count <= 0`     → empty array
 */
export function pickPositions(
	total: number,
	count: number,
	random: RandomFn = defaultRandom,
): number[] {
	if (count <= 0) return [];
	if (count >= total) return Array.from({ length: total }, (_, i) => i);

	const indices = Array.from({ length: total }, (_, i) => i);
	// Partial Fisher-Yates: only swap the first `count` elements into
	// place, then slice them off. O(count) random calls.
	for (let i = 0; i < count; i++) {
		const j = i + Math.floor(random() * (total - i));
		[indices[i], indices[j]] = [indices[j]!, indices[i]!];
	}
	return indices.slice(0, count).sort((a, b) => a - b);
}

/**
 * One rotation step.
 *
 * Given the currently visible `current` array, a `pool` of all
 * available items, the `poolIndex` we've consumed up to, and the
 * `positions` to swap this tick, returns the next `current` plus
 * the advanced `poolIndex`. Pool consumption wraps when it overruns.
 *
 * The function deliberately avoids duplicates against the *current
 * visible set* — if the next pool item already shows somewhere in
 * `current`, it advances to the following pool item until it finds
 * one that isn't visible. This keeps the user from seeing the same
 * voice in two tiles after a rotation. Guard runs at most `pool.length`
 * steps so a tiny pool (only N visible) won't spin forever.
 */
export function rotateOnce<T extends { id: string }>(
	current: readonly T[],
	pool: readonly T[],
	poolIndex: number,
	positions: readonly number[],
): { next: T[]; poolIndex: number } {
	const next = [...current];
	let idx = poolIndex;

	for (const pos of positions) {
		const visible = new Set(next.map((item) => item.id));
		// Remove the slot we're about to replace so the *incoming* item
		// is allowed to share an id with the *outgoing* one (shouldn't
		// happen with normal pools, but the check is cheap).
		visible.delete(next[pos]!.id);

		// Find the next pool entry that isn't already visible.
		let candidate: T | undefined;
		for (let tries = 0; tries < pool.length; tries++) {
			const item = pool[idx % pool.length]!;
			idx += 1;
			if (!visible.has(item.id)) {
				candidate = item;
				break;
			}
		}

		// If the pool is so small that every entry is visible, leave
		// the slot unchanged. The caller (which controls pool sizing)
		// should ensure pool.length > current.length to avoid this.
		if (candidate) {
			next[pos] = candidate;
		}
	}

	return { next, poolIndex: idx };
}

/**
 * Diff two `currentVoices` arrays and return the set of ids that
 * are present in `next` but were not present in `prev`. Used by the
 * island to drive the 1.5s flash highlight on newly-arrived tiles.
 */
export function arrivedIds<T extends { id: string }>(
	prev: readonly T[],
	next: readonly T[],
): Set<string> {
	const prevIds = new Set(prev.map((item) => item.id));
	const arrived = new Set<string>();
	for (const item of next) {
		if (!prevIds.has(item.id)) arrived.add(item.id);
	}
	return arrived;
}

/** Default tick interval — 8 seconds per the prototype + the issue. */
export const ROTATION_INTERVAL_MS = 8_000;

/** How many of the 11 positions swap each tick. Half-ish. */
export const SWAP_COUNT = 6;

/** Visible position count on desktop (1-4-3-3). */
export const VISIBLE_COUNT = 11;

/** Visible position count on mobile (2×4). */
export const MOBILE_VISIBLE_COUNT = 8;

/** Duration of the amber flash on a newly-arrived tile. */
export const FLASH_DURATION_MS = 1_500;
