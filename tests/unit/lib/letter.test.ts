import { describe, expect, it } from "vitest";

import { LETTER_COPY, LETTER_WAYPOINTS, letterHeadline } from "~/lib/letter";
import { WAYPOINT_NAMES } from "~/lib/letter-render";

describe("LETTER_COPY", () => {
	it("exposes the open-letter kicker", () => {
		expect(LETTER_COPY.kicker).toBe("An open letter");
	});

	it("subtitle names the three lead themes from the prototype", () => {
		expect(LETTER_COPY.subtitle).toContain("fairness");
		expect(LETTER_COPY.subtitle).toContain("belonging");
		expect(LETTER_COPY.subtitle).toContain("friendship");
	});
});

describe("letterHeadline", () => {
	it("templates the voice count into the headline", () => {
		expect(letterHeadline(247)).toBe("From 247 young people to FIFA");
	});

	it("renders cleanly at the campaign-launch zero state", () => {
		expect(letterHeadline(0)).toBe("From 0 young people to FIFA");
	});

	it("applies the en-US thousands separator above 999", () => {
		expect(letterHeadline(1247)).toBe("From 1,247 young people to FIFA");
	});
});

describe("LETTER_WAYPOINTS", () => {
	it("exposes the four rhetorical waypoints in reading order", () => {
		expect(LETTER_WAYPOINTS.map((w) => w.id)).toEqual(["opening", "question", "ask", "signoff"]);
	});

	it("every waypoint id matches a parser waypoint anchor name", () => {
		// The rail observes `#waypoint-${id}`; those anchors are emitted by
		// the parser for exactly WAYPOINT_NAMES. Keep the two in lockstep.
		for (const w of LETTER_WAYPOINTS) {
			expect(WAYPOINT_NAMES).toContain(w.id);
		}
	});
});
