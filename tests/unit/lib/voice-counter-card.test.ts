import { describe, expect, it } from "vitest";

import { VOICE_COUNTER_CARD_COPY } from "~/lib/voice-counter-card";

describe("VOICE_COUNTER_CARD_COPY", () => {
	it("exposes the eyebrow label used as both visible text and the section aria-label", () => {
		expect(VOICE_COUNTER_CARD_COPY.label).toBe("The voice counter");
	});

	it("provides distinct long + short live-row variants for desktop and reduced-motion / mobile", () => {
		expect(VOICE_COUNTER_CARD_COPY.liveLong).toBe("Young voices — and counting");
		expect(VOICE_COUNTER_CARD_COPY.liveShort).toBe("Voices and counting");
		expect(VOICE_COUNTER_CARD_COPY.liveLong).not.toBe(VOICE_COUNTER_CARD_COPY.liveShort);
	});

	it("error fallback copy names the explicit reconnecting state for the live row", () => {
		expect(VOICE_COUNTER_CARD_COPY.liveError).toContain("reconnecting");
	});

	it("error description names the missing-data condition without scaring the user", () => {
		expect(VOICE_COUNTER_CARD_COPY.descriptionError).toContain("Live counter temporarily offline");
		expect(VOICE_COUNTER_CARD_COPY.descriptionError).toContain("09:42 GMT");
	});

	it("provides a screen-reader stand-in for the loading-state skeleton block", () => {
		expect(VOICE_COUNTER_CARD_COPY.loadingNumber).toBe("Loading voice count");
	});
});
