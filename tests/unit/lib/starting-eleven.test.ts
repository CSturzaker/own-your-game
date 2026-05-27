import { describe, expect, it } from "vitest";

import { SAMPLE_VOICES } from "../../fixtures/voices";
import {
	DESKTOP_TILE_COUNT,
	MOBILE_TILE_COUNT,
	STARTING_ELEVEN_COPY,
	countdownLabel,
	formationRows,
} from "~/lib/starting-eleven";
import type { Voice } from "~/lib/voice";

/**
 * Build a synthetic voices array of arbitrary length by cycling the
 * fixture set — the formation slicer only cares about the array
 * shape, not the voice content, so we can spin up 11 / 7 / 0
 * voices from the same fixtures.
 */
function makeVoices(count: number): Voice[] {
	return Array.from({ length: count }, (_, i) => ({
		...SAMPLE_VOICES[i % SAMPLE_VOICES.length]!,
		// Distinguish each item with a unique id so callers can still
		// compare positions; firstName/countryCode are not asserted on.
		id: `voice-${i}`,
	}));
}

describe("STARTING_ELEVEN_COPY", () => {
	it("exposes the kicker, heading, and supporting paragraph from the prototype", () => {
		expect(STARTING_ELEVEN_COPY.kicker).toBe("Today's starting eleven");
		expect(STARTING_ELEVEN_COPY.heading).toBe("New Players. New Stories. Same Question.");
		expect(STARTING_ELEVEN_COPY.supporting).toMatch(/Every twelve seconds/);
	});

	it("names the rotation controls — both the desktop pause and the amber refresh CTA", () => {
		expect(STARTING_ELEVEN_COPY.pauseLabel).toBe("Pause rotation");
		expect(STARTING_ELEVEN_COPY.nextElevenLabel).toBe("Bring on the next eleven");
	});

	it("exposes the reduced-motion fallback pill copy", () => {
		expect(STARTING_ELEVEN_COPY.reducedMotionPill).toBe("Reduced motion — rotation paused");
	});
});

describe("countdownLabel", () => {
	it("templates the seconds into the prototype's 'Next rotation in Ns' shape", () => {
		expect(countdownLabel(8)).toBe("Next rotation in 8s");
		expect(countdownLabel(1)).toBe("Next rotation in 1s");
		// We deliberately don't pluralise — 0s is a real tick state
		// the timer will pass through and should still render cleanly.
		expect(countdownLabel(0)).toBe("Next rotation in 0s");
	});
});

describe("tile-count constants", () => {
	it("pins the prototype's 11 / 8 split", () => {
		expect(DESKTOP_TILE_COUNT).toBe(11);
		expect(MOBILE_TILE_COUNT).toBe(8);
	});
});

describe("formationRows", () => {
	it("partitions 11 voices into the 1-4-3-3 row counts", () => {
		const rows = formationRows(makeVoices(11));
		expect(rows.keeper).toHaveLength(1);
		expect(rows.defenders).toHaveLength(4);
		expect(rows.midfielders).toHaveLength(3);
		expect(rows.forwards).toHaveLength(3);
	});

	it("assigns positions 1–11 in the fixed keeper → forwards order", () => {
		const rows = formationRows(makeVoices(11));
		expect(rows.keeper.map((t) => t.position)).toEqual([1]);
		expect(rows.defenders.map((t) => t.position)).toEqual([2, 3, 4, 5]);
		expect(rows.midfielders.map((t) => t.position)).toEqual([6, 7, 8]);
		expect(rows.forwards.map((t) => t.position)).toEqual([9, 10, 11]);
	});

	it("preserves the input order — voices[0] is keeper, voices[10] is the last forward", () => {
		const voices = makeVoices(11);
		const rows = formationRows(voices);
		expect(rows.keeper[0]?.voice.id).toBe("voice-0");
		expect(rows.forwards[2]?.voice.id).toBe("voice-10");
	});

	it("drops anything beyond the first 11 voices — keeps the formation predictable", () => {
		const rows = formationRows(makeVoices(20));
		const total =
			rows.keeper.length + rows.defenders.length + rows.midfielders.length + rows.forwards.length;
		expect(total).toBe(11);
	});

	it("collapses later rows when fewer than 11 voices are supplied", () => {
		const rows = formationRows(makeVoices(7));
		expect(rows.keeper).toHaveLength(1);
		expect(rows.defenders).toHaveLength(4); // positions 2–5 filled
		expect(rows.midfielders).toHaveLength(2); // positions 6–7 only
		expect(rows.forwards).toHaveLength(0);
	});

	it("returns four empty rows when no voices are supplied — caller renders nothing", () => {
		const rows = formationRows([]);
		expect(rows.keeper).toEqual([]);
		expect(rows.defenders).toEqual([]);
		expect(rows.midfielders).toEqual([]);
		expect(rows.forwards).toEqual([]);
	});
});
