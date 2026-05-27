/**
 * Deterministic ordering for the output file.
 *
 * `voices.json` lands in git. If the array's order depends on sheet
 * row order, or on iteration of an unordered Map, every pipeline run
 * produces a fresh diff and the campaign team's commits become noise.
 * Sorting by `id` is the canonical order: stable, locale-independent,
 * and trivially reproducible by anyone reading the file by hand.
 */

import type { Voice } from "~/lib/voice";

/**
 * Return a new array sorted ascending by `id`. Uses bare `<`/`>`
 * comparison rather than `localeCompare` so the order doesn't depend
 * on the host's locale — important because the script runs both
 * locally and in CI, often on different machines.
 *
 * `id` is constrained to `[a-z0-9-]+` by the schema, so the byte
 * comparison gives the same result as ASCII-only collation.
 */
export function sortVoicesById(voices: readonly Voice[]): Voice[] {
	return [...voices].sort((a, b) => {
		if (a.id < b.id) return -1;
		if (a.id > b.id) return 1;
		return 0;
	});
}
