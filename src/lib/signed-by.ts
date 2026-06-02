/**
 * Signature-row selection + formatting (DEV-54).
 *
 * The letter's "Co-signed by" row shows a *deterministic* sample of
 * signers — the first N voices alphabetically by first name — so the row
 * is stable across visits (a signed letter shouldn't reshuffle on every
 * load) and so the social-share OG image (launch readiness) renders the
 * same names every time. NOT a per-visit shuffle.
 *
 * Pure functions so the Astro shell stays thin and Vitest can pin the
 * selection and the tooltip text without rendering.
 */

import { countryName } from "~/lib/countries";
import type { Voice } from "~/lib/voice";

/** The minimum a signer pill + tooltip needs — no surname, ever. */
export interface Signer {
	id: string;
	firstName: string;
	age: number;
	city: string;
	/** Resolved English country name (not the ISO code). */
	country: string;
}

/** Default number of names shown before the "+N more" pill. */
export const DEFAULT_VISIBLE_SIGNERS = 11;

/**
 * The first `visibleCount` voices alphabetically by first name, mapped
 * to the signer shape. Sort is locale-aware (handles accented names like
 * "Aïsha") with the stable voice id as the tiebreaker, so the selection
 * is identical across builds for the same content.
 */
export function selectSigners(
	voices: readonly Voice[],
	visibleCount: number = DEFAULT_VISIBLE_SIGNERS,
): Signer[] {
	return [...voices]
		.sort((a, b) => a.firstName.localeCompare(b.firstName) || a.id.localeCompare(b.id))
		.slice(0, Math.max(0, visibleCount))
		.map((v) => ({
			id: v.id,
			firstName: v.firstName,
			age: v.age,
			city: v.city,
			country: countryName(v.countryCode),
		}));
}

/**
 * How many signers are hidden behind the "+N more" link. Never negative
 * — when the campaign has fewer voices than `visibleCount`, every signer
 * shows and there's no "+N more" pill.
 */
export function remainingSignerCount(
	total: number,
	visibleCount: number = DEFAULT_VISIBLE_SIGNERS,
): number {
	return Math.max(0, total - visibleCount);
}

// The "+N more" overflow label moved into the dictionary in DEV-70
// (`letter.moreSigners`); `SignedBy.astro` resolves it with the remaining
// count and passes it to the `SignedByRow` island.
