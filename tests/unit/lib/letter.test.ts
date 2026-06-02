import { describe, expect, it } from "vitest";

import { LETTER_WAYPOINT_IDS } from "~/lib/letter";
import { WAYPOINT_NAMES } from "~/lib/letter-render";

// The letter chrome strings (kicker, subtitle, headline, waypoint labels)
// moved into the translation dictionary (DEV-70); `Letter.astro` resolves
// them via `t()`. This lib now holds only the structural waypoint ids.

describe("LETTER_WAYPOINT_IDS", () => {
	it("exposes the four rhetorical waypoints in reading order", () => {
		expect([...LETTER_WAYPOINT_IDS]).toEqual(["opening", "question", "ask", "signoff"]);
	});

	it("every waypoint id matches a parser waypoint anchor name", () => {
		// The rail observes `#waypoint-${id}`; those anchors are emitted by
		// the parser for exactly WAYPOINT_NAMES. Keep the two in lockstep.
		for (const id of LETTER_WAYPOINT_IDS) {
			expect(WAYPOINT_NAMES).toContain(id);
		}
	});
});
